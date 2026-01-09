-- Create role enum
CREATE TYPE public.app_role AS ENUM ('client', 'specialist', 'admin');

-- Create user_roles table (secure role management)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS for profiles
CREATE POLICY "Anyone can view profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
ON public.categories FOR SELECT
USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Specialist categories (skills)
CREATE TABLE public.specialist_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, category_id)
);

ALTER TABLE public.specialist_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view specialist categories"
ON public.specialist_categories FOR SELECT
USING (true);

CREATE POLICY "Specialists can manage own categories"
ON public.specialist_categories FOR ALL
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'specialist'));

-- Jobs status enum
CREATE TYPE public.job_status AS ENUM ('draft', 'open', 'assigned', 'in_progress', 'completed_pending_client', 'completed', 'canceled');

-- Jobs table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    status job_status DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS for jobs
CREATE POLICY "Clients can manage own jobs"
ON public.jobs FOR ALL
USING (auth.uid() = client_id);

CREATE POLICY "Specialists can view open jobs"
ON public.jobs FOR SELECT
USING (status = 'open' AND public.has_role(auth.uid(), 'specialist'));

CREATE POLICY "Admins can manage all jobs"
ON public.jobs FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Job images
CREATE TABLE public.job_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.job_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job images follow job visibility"
ON public.job_images FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.jobs 
        WHERE jobs.id = job_images.job_id 
        AND (jobs.client_id = auth.uid() OR jobs.status = 'open' OR public.has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Clients can manage own job images"
ON public.job_images FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_images.job_id AND jobs.client_id = auth.uid())
);

-- Bid status enum
CREATE TYPE public.bid_status AS ENUM ('submitted', 'withdrawn', 'accepted', 'rejected');

-- Bids table
CREATE TABLE public.bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    specialist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    eta TEXT,
    status bid_status DEFAULT 'submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (job_id, specialist_id)
);

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- RLS for bids
CREATE POLICY "Specialists can manage own bids"
ON public.bids FOR ALL
USING (auth.uid() = specialist_id);

CREATE POLICY "Clients can view bids on own jobs"
ON public.bids FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = bids.job_id AND jobs.client_id = auth.uid())
);

CREATE POLICY "Clients can update bid status on own jobs"
ON public.bids FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = bids.job_id AND jobs.client_id = auth.uid())
);

CREATE POLICY "Admins can manage all bids"
ON public.bids FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Contract status enum
CREATE TYPE public.contract_status AS ENUM ('active', 'in_progress', 'completed_pending_client', 'completed', 'canceled');

-- Contracts table
CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL UNIQUE,
    accepted_bid_id UUID REFERENCES public.bids(id) ON DELETE CASCADE NOT NULL UNIQUE,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    specialist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status contract_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS for contracts
CREATE POLICY "Contract participants can view"
ON public.contracts FOR SELECT
USING (auth.uid() = client_id OR auth.uid() = specialist_id);

CREATE POLICY "Contract participants can update"
ON public.contracts FOR UPDATE
USING (auth.uid() = client_id OR auth.uid() = specialist_id);

CREATE POLICY "Clients can create contracts"
ON public.contracts FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Admins can manage all contracts"
ON public.contracts FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Payment status enum
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'pending_verification', 'paid_held', 'released', 'refunded');

-- Payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee_pct DECIMAL(5,2) DEFAULT 10.00,
    fee_amount DECIMAL(10,2),
    payout_amount DECIMAL(10,2),
    status payment_status DEFAULT 'unpaid',
    method TEXT,
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS for payments
CREATE POLICY "Contract participants can view payments"
ON public.payments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.contracts 
        WHERE contracts.id = payments.contract_id 
        AND (contracts.client_id = auth.uid() OR contracts.specialist_id = auth.uid())
    )
);

CREATE POLICY "Clients can manage payments on own contracts"
ON public.payments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.contracts 
        WHERE contracts.id = payments.contract_id 
        AND contracts.client_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all payments"
ON public.payments FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Function to automatically create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _role app_role;
    _full_name TEXT;
BEGIN
    -- Get role from metadata (default to client)
    _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'client');
    _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario');
    
    -- Create profile
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, _full_name);
    
    -- Create role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role);
    
    RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate payment amounts
CREATE OR REPLACE FUNCTION public.calculate_payment_amounts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.fee_amount := NEW.amount * (NEW.platform_fee_pct / 100);
    NEW.payout_amount := NEW.amount - NEW.fee_amount;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_payment_before_insert
    BEFORE INSERT OR UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.calculate_payment_amounts();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bids_updated_at
    BEFORE UPDATE ON public.bids
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON public.contracts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed categories
INSERT INTO public.categories (name, icon) VALUES
    ('Plomería', 'droplet'),
    ('Electricidad', 'zap'),
    ('Reparación de Electrodomésticos', 'refrigerator'),
    ('Aire Acondicionado', 'wind'),
    ('Limpieza', 'sparkles'),
    ('Soporte Técnico', 'monitor'),
    ('Albañilería', 'hammer'),
    ('Pintura', 'paintbrush'),
    ('Carpintería', 'axe'),
    ('Cerrajería', 'key');