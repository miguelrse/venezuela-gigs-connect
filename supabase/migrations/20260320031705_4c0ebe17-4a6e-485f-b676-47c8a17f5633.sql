
-- Add job_type and urgency to jobs table
CREATE TYPE public.job_type AS ENUM ('presencial', 'remoto', 'hibrido');
CREATE TYPE public.job_urgency AS ENUM ('asap', 'flexible', 'fecha_especifica');

ALTER TABLE public.jobs 
  ADD COLUMN job_type public.job_type DEFAULT 'presencial',
  ADD COLUMN urgency public.job_urgency DEFAULT 'flexible',
  ADD COLUMN urgency_date DATE DEFAULT NULL;
