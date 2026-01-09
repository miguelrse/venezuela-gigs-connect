-- Fix search_path for calculate_payment_amounts function
CREATE OR REPLACE FUNCTION public.calculate_payment_amounts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.fee_amount := NEW.amount * (NEW.platform_fee_pct / 100);
    NEW.payout_amount := NEW.amount - NEW.fee_amount;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

-- Fix search_path for update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;