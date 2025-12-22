-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone authenticated can insert MPs" ON public.mps;

-- Create permissive INSERT policy for everyone (public admin dashboard)
CREATE POLICY "Anyone can insert MPs" 
ON public.mps 
FOR INSERT 
WITH CHECK (true);

-- Also update update and delete to be permissive
DROP POLICY IF EXISTS "Anyone authenticated can update MPs" ON public.mps;
DROP POLICY IF EXISTS "Anyone authenticated can delete MPs" ON public.mps;

CREATE POLICY "Anyone can update MPs" 
ON public.mps 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete MPs" 
ON public.mps 
FOR DELETE 
USING (true);