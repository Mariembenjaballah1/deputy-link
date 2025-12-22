-- Create complaints table
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_phone TEXT,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  wilaya_id TEXT NOT NULL,
  daira_id TEXT NOT NULL,
  mp_id UUID REFERENCES public.mps(id),
  local_deputy_id TEXT,
  assigned_to TEXT NOT NULL CHECK (assigned_to IN ('mp', 'local_deputy')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'replied', 'forwarded', 'out_of_scope')),
  reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  forwarded_to TEXT,
  official_letter TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Anyone can view complaints (for demo purposes)
CREATE POLICY "Complaints are viewable by everyone" 
ON public.complaints 
FOR SELECT 
USING (true);

-- Anyone can insert complaints
CREATE POLICY "Anyone can insert complaints" 
ON public.complaints 
FOR INSERT 
WITH CHECK (true);

-- Anyone can update complaints
CREATE POLICY "Anyone can update complaints" 
ON public.complaints 
FOR UPDATE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for complaints
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;