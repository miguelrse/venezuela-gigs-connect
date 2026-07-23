
-- =========================================================================
-- Phase 2: Marketplace integrity — atomic RPCs & tightened policies
-- =========================================================================

-- 1) accept_bid: atomic bid acceptance + contract creation
CREATE OR REPLACE FUNCTION public.accept_bid(_bid_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bid       public.bids%ROWTYPE;
  _job       public.jobs%ROWTYPE;
  _contract_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO _bid FROM public.bids WHERE id = _bid_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'bid not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO _job FROM public.jobs WHERE id = _bid.job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'job not found' USING ERRCODE = 'P0002';
  END IF;

  IF _job.client_id <> auth.uid() THEN
    RAISE EXCEPTION 'only job owner can accept bids' USING ERRCODE = '42501';
  END IF;

  IF _job.status <> 'open' THEN
    RAISE EXCEPTION 'job is not open' USING ERRCODE = '22023';
  END IF;

  IF _bid.status <> 'submitted' THEN
    RAISE EXCEPTION 'bid is not active' USING ERRCODE = '22023';
  END IF;

  UPDATE public.bids SET status = 'accepted', updated_at = now()
    WHERE id = _bid.id;

  UPDATE public.bids SET status = 'rejected', updated_at = now()
    WHERE job_id = _job.id AND id <> _bid.id AND status = 'submitted';

  INSERT INTO public.contracts (job_id, accepted_bid_id, client_id, specialist_id, status)
  VALUES (_job.id, _bid.id, _job.client_id, _bid.specialist_id, 'active')
  RETURNING id INTO _contract_id;

  UPDATE public.jobs SET status = 'assigned', updated_at = now()
    WHERE id = _job.id;

  RETURN _contract_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_bid(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_bid(uuid) TO authenticated;

-- 2) specialist_start_contract: active -> in_progress
CREATE OR REPLACE FUNCTION public.specialist_start_contract(_contract_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _c public.contracts%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required' USING ERRCODE='42501'; END IF;
  SELECT * INTO _c FROM public.contracts WHERE id = _contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'contract not found' USING ERRCODE='P0002'; END IF;
  IF _c.specialist_id <> auth.uid() THEN
    RAISE EXCEPTION 'only specialist can start contract' USING ERRCODE='42501';
  END IF;
  IF _c.status <> 'active' THEN
    RAISE EXCEPTION 'contract not in active state' USING ERRCODE='22023';
  END IF;
  UPDATE public.contracts SET status='in_progress', updated_at=now() WHERE id=_c.id;
  UPDATE public.jobs SET status='in_progress', updated_at=now() WHERE id=_c.job_id;
END;
$$;
REVOKE ALL ON FUNCTION public.specialist_start_contract(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.specialist_start_contract(uuid) TO authenticated;

-- 3) specialist_mark_completed: in_progress -> completed_pending_client
CREATE OR REPLACE FUNCTION public.specialist_mark_completed(_contract_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _c public.contracts%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required' USING ERRCODE='42501'; END IF;
  SELECT * INTO _c FROM public.contracts WHERE id=_contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'contract not found' USING ERRCODE='P0002'; END IF;
  IF _c.specialist_id <> auth.uid() THEN
    RAISE EXCEPTION 'only specialist can mark completed' USING ERRCODE='42501';
  END IF;
  IF _c.status NOT IN ('active','in_progress') THEN
    RAISE EXCEPTION 'contract cannot be completed from current state' USING ERRCODE='22023';
  END IF;
  UPDATE public.contracts SET status='completed_pending_client', updated_at=now() WHERE id=_c.id;
  UPDATE public.jobs SET status='completed_pending_client', updated_at=now() WHERE id=_c.job_id;
END;
$$;
REVOKE ALL ON FUNCTION public.specialist_mark_completed(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.specialist_mark_completed(uuid) TO authenticated;

-- 4) client_confirm_completed: completed_pending_client -> completed
CREATE OR REPLACE FUNCTION public.client_confirm_completed(_contract_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _c public.contracts%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required' USING ERRCODE='42501'; END IF;
  SELECT * INTO _c FROM public.contracts WHERE id=_contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'contract not found' USING ERRCODE='P0002'; END IF;
  IF _c.client_id <> auth.uid() THEN
    RAISE EXCEPTION 'only client can confirm completion' USING ERRCODE='42501';
  END IF;
  IF _c.status <> 'completed_pending_client' THEN
    RAISE EXCEPTION 'contract not pending client confirmation' USING ERRCODE='22023';
  END IF;
  UPDATE public.contracts SET status='completed', updated_at=now() WHERE id=_c.id;
  UPDATE public.jobs SET status='completed', updated_at=now() WHERE id=_c.job_id;
END;
$$;
REVOKE ALL ON FUNCTION public.client_confirm_completed(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.client_confirm_completed(uuid) TO authenticated;

-- 5) cancel_contract: either participant while active/in_progress
CREATE OR REPLACE FUNCTION public.cancel_contract(_contract_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _c public.contracts%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required' USING ERRCODE='42501'; END IF;
  SELECT * INTO _c FROM public.contracts WHERE id=_contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'contract not found' USING ERRCODE='P0002'; END IF;
  IF auth.uid() NOT IN (_c.client_id, _c.specialist_id) THEN
    RAISE EXCEPTION 'not a contract participant' USING ERRCODE='42501';
  END IF;
  IF _c.status NOT IN ('active','in_progress') THEN
    RAISE EXCEPTION 'contract cannot be canceled from current state' USING ERRCODE='22023';
  END IF;
  UPDATE public.contracts SET status='canceled', updated_at=now() WHERE id=_c.id;
  UPDATE public.jobs SET status='canceled', updated_at=now() WHERE id=_c.job_id;
END;
$$;
REVOKE ALL ON FUNCTION public.cancel_contract(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_contract(uuid) TO authenticated;

-- =========================================================================
-- Lock down direct writes to contracts: only RPCs (SECURITY DEFINER) or admin
-- =========================================================================
DROP POLICY IF EXISTS "Clients can create contracts" ON public.contracts;
DROP POLICY IF EXISTS "Contract participants can update" ON public.contracts;
-- Keep: "Contract participants can view" (SELECT) and "Admins can manage all contracts"

-- Prevent direct INSERT/UPDATE from clients; RPCs bypass RLS via SECURITY DEFINER.
REVOKE INSERT, UPDATE, DELETE ON public.contracts FROM authenticated, anon;
GRANT SELECT ON public.contracts TO authenticated;

-- =========================================================================
-- Reviews: enforce reviewee is the OTHER participant
-- =========================================================================
DROP POLICY IF EXISTS "Contract participants can create reviews" ON public.reviews;
CREATE POLICY "Contract participants can create reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reviewer_id
  AND reviewer_id <> reviewee_id
  AND EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = reviews.contract_id
      AND c.status = 'completed'
      AND (
        (c.client_id = auth.uid()     AND c.specialist_id = reviews.reviewee_id)
        OR
        (c.specialist_id = auth.uid() AND c.client_id     = reviews.reviewee_id)
      )
  )
);
