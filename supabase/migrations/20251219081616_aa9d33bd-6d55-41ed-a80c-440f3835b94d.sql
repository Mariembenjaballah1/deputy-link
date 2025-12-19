-- Create MPs table for persistent storage
CREATE TABLE public.mps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT,
  wilaya TEXT NOT NULL,
  wilaya_id TEXT,
  daira_id TEXT,
  daira TEXT,
  bloc TEXT,
  complaints_count INTEGER DEFAULT 0,
  response_rate INTEGER DEFAULT 0,
  email TEXT,
  phone TEXT,
  bio TEXT,
  profile_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mps ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (everyone can see MPs list)
CREATE POLICY "MPs are viewable by everyone" 
ON public.mps 
FOR SELECT 
USING (true);

-- Create policy for admin insert (using a simple check for now - in production use proper role check)
CREATE POLICY "Anyone authenticated can insert MPs" 
ON public.mps 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy for admin update
CREATE POLICY "Anyone authenticated can update MPs" 
ON public.mps 
FOR UPDATE 
TO authenticated
USING (true);

-- Create policy for admin delete
CREATE POLICY "Anyone authenticated can delete MPs" 
ON public.mps 
FOR DELETE 
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mps_updated_at
BEFORE UPDATE ON public.mps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();