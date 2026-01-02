-- Recompute and keep MP statistics in sync with complaints

CREATE OR REPLACE FUNCTION public.refresh_mp_stats(p_mp_id uuid)
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
  IF p_mp_id IS NULL THEN
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
  WHERE mp_id = p_mp_id;

  v_rate := CASE
    WHEN v_total > 0 THEN ROUND((v_replied::numeric * 100) / v_total)::int
    ELSE 0
  END;

  UPDATE public.mps
  SET complaints_count = v_total,
      response_rate = v_rate,
      updated_at = now()
  WHERE id = p_mp_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complaints_refresh_mp_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM public.refresh_mp_stats(NEW.mp_id);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM public.refresh_mp_stats(OLD.mp_id);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (NEW.mp_id IS DISTINCT FROM OLD.mp_id) THEN
      PERFORM public.refresh_mp_stats(OLD.mp_id);
      PERFORM public.refresh_mp_stats(NEW.mp_id);
    ELSE
      PERFORM public.refresh_mp_stats(NEW.mp_id);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_complaints_refresh_mp_stats ON public.complaints;
CREATE TRIGGER trg_complaints_refresh_mp_stats
AFTER INSERT OR UPDATE OR DELETE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.complaints_refresh_mp_stats();

-- One-time backfill to sync existing MPs
WITH agg AS (
  SELECT
    mp_id,
    COUNT(*)::int AS total,
    COUNT(*) FILTER (
      WHERE (reply IS NOT NULL AND btrim(reply) <> '')
         OR status = 'replied'
    )::int AS replied
  FROM public.complaints
  WHERE mp_id IS NOT NULL
  GROUP BY mp_id
)
UPDATE public.mps m
SET complaints_count = COALESCE(agg.total, 0),
    response_rate = CASE
      WHEN COALESCE(agg.total, 0) > 0 THEN ROUND((COALESCE(agg.replied, 0)::numeric * 100) / agg.total)::int
      ELSE 0
    END,
    updated_at = now()
FROM agg
WHERE m.id = agg.mp_id;

UPDATE public.mps m
SET complaints_count = 0,
    response_rate = 0,
    updated_at = now()
WHERE NOT EXISTS (
  SELECT 1
  FROM public.complaints c
  WHERE c.mp_id = m.id
);
