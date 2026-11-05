-- Shared, atomic per-user rate limiting for expensive Dr.Vas AI endpoints.
-- The Worker calls this function with its server-only Supabase service-role key.
begin;
CREATE TABLE IF NOT EXISTS public.drvas_rate_limits (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, bucket)
);

ALTER TABLE public.drvas_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.drvas_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.drvas_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.drvas_consume_rate_limit(
  p_user_id uuid,
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS TABLE (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_window_start timestamptz;
  v_count integer;
BEGIN
  IF p_user_id IS NULL
     OR p_bucket IS NULL
     OR p_limit IS NULL
     OR p_window_seconds IS NULL
     OR p_bucket !~ '^[a-z0-9_:-]{1,80}$'
     OR p_limit < 1 OR p_limit > 1000
     OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid rate-limit parameters';
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch FROM clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.drvas_rate_limits AS current_limit
    (user_id, bucket, window_start, request_count, updated_at)
  VALUES
    (p_user_id, p_bucket, v_window_start, 1, clock_timestamp())
  ON CONFLICT (user_id, bucket) DO UPDATE
    SET window_start = EXCLUDED.window_start,
        request_count = CASE
          WHEN current_limit.window_start = EXCLUDED.window_start
            THEN current_limit.request_count + 1
          ELSE 1
        END,
        updated_at = clock_timestamp()
  RETURNING request_count INTO v_count;

  RETURN QUERY SELECT
    (v_count <= p_limit),
    greatest(0, p_limit - v_count),
    v_window_start + make_interval(secs => p_window_seconds);
END;
$$;

REVOKE ALL ON FUNCTION public.drvas_consume_rate_limit(uuid, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.drvas_consume_rate_limit(uuid, text, integer, integer)
  TO service_role;

COMMENT ON TABLE public.drvas_rate_limits IS
  'Atomic fixed-window counters for server-side Dr.Vas abuse and cost controls. No message content is stored.';

commit;
