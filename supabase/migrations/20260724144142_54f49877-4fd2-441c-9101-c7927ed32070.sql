
-- Reports table for trust & safety
CREATE TYPE public.report_target_type AS ENUM ('user','job','review','bid');
CREATE TYPE public.report_status AS ENUM ('open','reviewing','resolved','dismissed');

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.report_target_type NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status public.report_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, target_type, target_id)
);

GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX reports_target_idx ON public.reports (target_type, target_id);
CREATE INDEX reports_status_idx ON public.reports (status);

-- Public trust stats function: aggregate reputation without exposing PII
CREATE OR REPLACE FUNCTION public.user_trust_stats(_user_id uuid)
RETURNS TABLE (
  completed_jobs int,
  avg_rating numeric,
  review_count int,
  member_since timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*)::int FROM public.contracts
       WHERE status = 'completed'
         AND (specialist_id = _user_id OR client_id = _user_id)),
    (SELECT round(avg(rating)::numeric, 2) FROM public.reviews WHERE reviewee_id = _user_id),
    (SELECT count(*)::int FROM public.reviews WHERE reviewee_id = _user_id),
    (SELECT created_at FROM public.profiles WHERE user_id = _user_id)
$$;

REVOKE EXECUTE ON FUNCTION public.user_trust_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_trust_stats(uuid) TO authenticated, anon;
