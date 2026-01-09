-- Create portfolio_items table for specialist work catalog
CREATE TABLE public.portfolio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table for ratings
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_review_per_contract_reviewer UNIQUE (contract_id, reviewer_id)
);

-- Enable RLS
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Portfolio policies: Anyone can view, specialists can manage their own
CREATE POLICY "Anyone can view portfolio items"
ON public.portfolio_items FOR SELECT
USING (true);

CREATE POLICY "Specialists can manage own portfolio"
ON public.portfolio_items FOR ALL
USING (auth.uid() = user_id AND has_role(auth.uid(), 'specialist'::app_role));

-- Reviews policies: Anyone can view (public ratings), participants can create
CREATE POLICY "Anyone can view reviews"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "Contract participants can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_id
  AND EXISTS (
    SELECT 1 FROM public.contracts
    WHERE contracts.id = contract_id
    AND contracts.status = 'completed'::contract_status
    AND (contracts.client_id = auth.uid() OR contracts.specialist_id = auth.uid())
  )
);

-- Trigger for portfolio updated_at
CREATE TRIGGER update_portfolio_items_updated_at
BEFORE UPDATE ON public.portfolio_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();