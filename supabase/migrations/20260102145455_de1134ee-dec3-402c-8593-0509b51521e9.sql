-- Add stats columns to local_deputies
ALTER TABLE public.local_deputies
ADD COLUMN IF NOT EXISTS complaints_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_rate integer DEFAULT 0;

-- Function to refresh local deputy stats
CREATE OR REPLACE FUNCTION public.refresh_local_deputy_stats(p_deputy_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_replied int;
  v_rate int;
BEGIN
  IF p_deputy_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COUNT(*)::int,
    COUNT(*) FILTER (
      WHERE (reply IS NOT NULL AND btrim(reply) <> '')
         OR status = 'replied'
    )::int
  INTO v_total, v_replied
  FROM public.complaints
  WHERE local_deputy_id = p_deputy_id::text;

  v_rate := CASE
    WHEN v_total > 0 THEN ROUND((v_replied::numeric * 100) / v_total)::int
    ELSE 0
  END;

  UPDATE public.local_deputies
  SET complaints_count = v_total,
      response_rate = v_rate,
      updated_at = now()
  WHERE id = p_deputy_id;
END;
$$;

-- Trigger function for local deputy stats
CREATE OR REPLACE FUNCTION public.complaints_refresh_local_deputy_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.local_deputy_id IS NOT NULL THEN
      PERFORM public.refresh_local_deputy_stats(NEW.local_deputy_id::uuid);
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.local_deputy_id IS NOT NULL THEN
      PERFORM public.refresh_local_deputy_stats(OLD.local_deputy_id::uuid);
    END IF;
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (NEW.local_deputy_id IS DISTINCT FROM OLD.local_deputy_id) THEN
      IF OLD.local_deputy_id IS NOT NULL THEN
        PERFORM public.refresh_local_deputy_stats(OLD.local_deputy_id::uuid);
      END IF;
      IF NEW.local_deputy_id IS NOT NULL THEN
        PERFORM public.refresh_local_deputy_stats(NEW.local_deputy_id::uuid);
      END IF;
    ELSE
      IF NEW.local_deputy_id IS NOT NULL THEN
        PERFORM public.refresh_local_deputy_stats(NEW.local_deputy_id::uuid);
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- Create trigger for local deputy stats
DROP TRIGGER IF EXISTS trg_complaints_refresh_local_deputy_stats ON public.complaints;
CREATE TRIGGER trg_complaints_refresh_local_deputy_stats
AFTER INSERT OR UPDATE OR DELETE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.complaints_refresh_local_deputy_stats();

-- Backfill existing local deputies stats
WITH agg AS (
  SELECT
    local_deputy_id::uuid as deputy_id,
    COUNT(*)::int AS total,
    COUNT(*) FILTER (
      WHERE (reply IS NOT NULL AND btrim(reply) <> '')
         OR status = 'replied'
    )::int AS replied
  FROM public.complaints
  WHERE local_deputy_id IS NOT NULL
  GROUP BY local_deputy_id
)
UPDATE public.local_deputies ld
SET complaints_count = COALESCE(agg.total, 0),
    response_rate = CASE
      WHEN COALESCE(agg.total, 0) > 0 THEN ROUND((COALESCE(agg.replied, 0)::numeric * 100) / agg.total)::int
      ELSE 0
    END,
    updated_at = now()
FROM agg
WHERE ld.id = agg.deputy_id;

-- Reset stats for deputies with no complaints
UPDATE public.local_deputies ld
SET complaints_count = 0,
    response_rate = 0,
    updated_at = now()
WHERE NOT EXISTS (
  SELECT 1
  FROM public.complaints c
  WHERE c.local_deputy_id = ld.id::text
);