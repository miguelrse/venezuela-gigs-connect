
-- 1) Helper: shares any contract between two users
CREATE OR REPLACE FUNCTION public.shares_contract(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contracts
    WHERE (client_id = _a AND specialist_id = _b)
       OR (client_id = _b AND specialist_id = _a)
  )
$$;
REVOKE EXECUTE ON FUNCTION public.shares_contract(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.shares_contract(uuid, uuid) TO authenticated;

-- 2) Restrict profiles SELECT (hide phone from unrelated users)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Users can view own or counterpart profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.shares_contract(auth.uid(), user_id)
  );

-- 3) Public profiles view (no phone). Available to any user for name/avatar/bio/location.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = off) AS
SELECT
  id,
  user_id,
  full_name,
  avatar_url,
  location,
  bio,
  created_at,
  updated_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 4) Open jobs feed view for browsing: strips the [geo:lat,lng] marker from description
--    so exact GPS coordinates are not leaked to specialists before a contract exists.
CREATE OR REPLACE VIEW public.open_jobs_feed
WITH (security_invoker = off) AS
SELECT
  j.id,
  j.client_id,
  j.category_id,
  j.title,
  regexp_replace(
    COALESCE(j.description, ''),
    E'\\n?\\n?\\[geo:[-0-9.]+,[-0-9.]+(?:,[0-9.]+)?\\]\\s*$',
    '',
    'g'
  ) AS description,
  j.location,
  j.budget_min,
  j.budget_max,
  j.job_type,
  j.urgency,
  j.urgency_date,
  j.status,
  j.created_at,
  j.updated_at
FROM public.jobs j
WHERE j.status = 'open';

GRANT SELECT ON public.open_jobs_feed TO authenticated;
