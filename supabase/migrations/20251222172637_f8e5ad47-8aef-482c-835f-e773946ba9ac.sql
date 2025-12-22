-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars');

-- Create local_deputies table
CREATE TABLE public.local_deputies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  wilaya_id TEXT NOT NULL,
  daira_id TEXT NOT NULL,
  image TEXT,
  bio TEXT,
  whatsapp_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.local_deputies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Local deputies are viewable by everyone" 
ON public.local_deputies FOR SELECT USING (true);

CREATE POLICY "Anyone can insert local deputies" 
ON public.local_deputies FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update local deputies" 
ON public.local_deputies FOR UPDATE USING (true);

-- Create reply_templates table
CREATE TABLE public.reply_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_by TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reply_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are viewable by everyone" 
ON public.reply_templates FOR SELECT USING (true);

CREATE POLICY "Anyone can insert templates" 
ON public.reply_templates FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update templates" 
ON public.reply_templates FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete templates" 
ON public.reply_templates FOR DELETE USING (true);

-- Create complaint_audit_log table
CREATE TABLE public.complaint_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  action_by TEXT NOT NULL,
  action_by_role TEXT,
  old_value JSONB,
  new_value JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.complaint_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs are viewable by everyone" 
ON public.complaint_audit_log FOR SELECT USING (true);

CREATE POLICY "Anyone can insert audit logs" 
ON public.complaint_audit_log FOR INSERT WITH CHECK (true);

-- Add new columns to complaints table for forwarding
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS forwarded_to_deputy_id UUID REFERENCES public.local_deputies(id),
ADD COLUMN IF NOT EXISTS forwarded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS forwarding_method TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Insert default reply templates
INSERT INTO public.reply_templates (title, content, category, is_default) VALUES
('شكر واستلام', 'شكراً على تواصلكم معنا. تم استلام شكواكم وسيتم دراستها في أقرب وقت.', NULL, true),
('قيد الدراسة', 'نحيطكم علماً أن شكواكم قيد الدراسة حالياً وسنوافيكم بالمستجدات.', NULL, true),
('تم التحويل', 'تم تحويل شكواكم إلى الجهة المختصة للمتابعة والمعالجة.', NULL, true),
('خارج الاختصاص', 'نأسف لإعلامكم أن موضوع شكواكم خارج نطاق اختصاصنا. ننصحكم بالتوجه إلى الجهة المختصة.', NULL, true),
('تم الحل', 'يسرنا إعلامكم أنه تمت معالجة شكواكم بنجاح. شكراً على ثقتكم.', NULL, true);

-- Trigger for updated_at
CREATE TRIGGER update_local_deputies_updated_at
BEFORE UPDATE ON public.local_deputies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reply_templates_updated_at
BEFORE UPDATE ON public.reply_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();