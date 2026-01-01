-- Allow anyone to delete complaints
CREATE POLICY "Anyone can delete complaints" 
ON public.complaints 
FOR DELETE 
USING (true);