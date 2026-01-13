-- Add policy to allow specialists to view jobs they have contracts with
CREATE POLICY "Specialists can view jobs they have contracts with" 
ON public.jobs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM contracts 
    WHERE contracts.job_id = jobs.id 
    AND contracts.specialist_id = auth.uid()
  )
);