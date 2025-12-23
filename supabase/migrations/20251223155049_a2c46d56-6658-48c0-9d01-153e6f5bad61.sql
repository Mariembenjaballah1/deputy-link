-- Create wilayas table
CREATE TABLE public.wilayas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dairas table
CREATE TABLE public.dairas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  wilaya_id UUID NOT NULL REFERENCES public.wilayas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mutamadiyat table
CREATE TABLE public.mutamadiyat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  daira_id UUID NOT NULL REFERENCES public.dairas(id) ON DELETE CASCADE,
  wilaya_id UUID NOT NULL REFERENCES public.wilayas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.wilayas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dairas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutamadiyat ENABLE ROW LEVEL SECURITY;

-- Create policies for wilayas (public read, admin write)
CREATE POLICY "Wilayas are viewable by everyone" 
  ON public.wilayas FOR SELECT USING (true);

CREATE POLICY "Anyone can insert wilayas" 
  ON public.wilayas FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update wilayas" 
  ON public.wilayas FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete wilayas" 
  ON public.wilayas FOR DELETE USING (true);

-- Create policies for dairas
CREATE POLICY "Dairas are viewable by everyone" 
  ON public.dairas FOR SELECT USING (true);

CREATE POLICY "Anyone can insert dairas" 
  ON public.dairas FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update dairas" 
  ON public.dairas FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete dairas" 
  ON public.dairas FOR DELETE USING (true);

-- Create policies for mutamadiyat
CREATE POLICY "Mutamadiyat are viewable by everyone" 
  ON public.mutamadiyat FOR SELECT USING (true);

CREATE POLICY "Anyone can insert mutamadiyat" 
  ON public.mutamadiyat FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update mutamadiyat" 
  ON public.mutamadiyat FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete mutamadiyat" 
  ON public.mutamadiyat FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_dairas_wilaya_id ON public.dairas(wilaya_id);
CREATE INDEX idx_mutamadiyat_daira_id ON public.mutamadiyat(daira_id);
CREATE INDEX idx_mutamadiyat_wilaya_id ON public.mutamadiyat(wilaya_id);

-- Create triggers for updated_at
CREATE TRIGGER update_wilayas_updated_at
  BEFORE UPDATE ON public.wilayas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dairas_updated_at
  BEFORE UPDATE ON public.dairas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mutamadiyat_updated_at
  BEFORE UPDATE ON public.mutamadiyat
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();