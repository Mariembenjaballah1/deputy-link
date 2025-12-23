-- Drop the existing check constraint and add a new one that includes 'in_cabinet'
ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_status_check;

ALTER TABLE public.complaints ADD CONSTRAINT complaints_status_check 
CHECK (status IN ('pending', 'viewed', 'replied', 'forwarded', 'in_cabinet', 'out_of_scope'));