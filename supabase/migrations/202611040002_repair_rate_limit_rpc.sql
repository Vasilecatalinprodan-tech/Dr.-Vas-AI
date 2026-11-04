-- Repair the rate-limit RPC execution context and refresh PostgREST's schema cache.
-- Safe to re-run: this only reapplies function settings and the intended service-role grants.
BEGIN;

ALTER FUNCTION public.drvas_consume_rate_limit(uuid, text, integer, integer)
  SET search_path = pg_catalog, public;

REVOKE ALL ON FUNCTION public.drvas_consume_rate_limit(uuid, text, integer, integer)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.drvas_consume_rate_limit(uuid, text, integer, integer)
  TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
