-- Add custom_categories column for specialists to add unlisted specialties
ALTER TABLE public.profiles 
ADD COLUMN custom_categories text[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.custom_categories IS 'Custom specialist categories not in the predefined list';