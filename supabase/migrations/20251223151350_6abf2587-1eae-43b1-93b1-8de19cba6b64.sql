-- Add is_active field to mps table if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mps' AND column_name = 'is_active') THEN
    ALTER TABLE public.mps ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Create pending_registrations table for MPs and Local Deputies who want to register themselves
CREATE TABLE IF NOT EXISTS public.pending_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('mp', 'local_deputy')),
  wilaya_id text NOT NULL,
  daira_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by text
);

-- Enable RLS
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for pending_registrations
CREATE POLICY "Anyone can insert pending registrations"
ON public.pending_registrations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Pending registrations are viewable by everyone"
ON public.pending_registrations
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update pending registrations"
ON public.pending_registrations
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete pending registrations"
ON public.pending_registrations
FOR DELETE
USING (true);