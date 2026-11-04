-- Read-only verification for the Dr.Vas rate-limit service.
-- Safe to run in Supabase SQL Editor: no writes, no counters consumed, no secrets returned.
WITH checks AS (
  SELECT
    to_regclass('public.drvas_rate_limits') IS NOT NULL AS table_exists,
    to_regprocedure('public.drvas_consume_rate_limit(uuid,text,integer,integer)') IS NOT NULL AS function_exists
), details AS (
  SELECT
    c.table_exists,
    c.function_exists,
    CASE WHEN c.table_exists THEN (
      SELECT relrowsecurity FROM pg_class WHERE oid = to_regclass('public.drvas_rate_limits')
    ) ELSE false END AS rls_enabled,
    CASE WHEN c.function_exists THEN (
      SELECT p.prosecdef FROM pg_proc p
      WHERE p.oid = to_regprocedure('public.drvas_consume_rate_limit(uuid,text,integer,integer)')
    ) ELSE false END AS security_definer,
    CASE WHEN c.function_exists THEN (
      SELECT coalesce(array_to_string(p.proconfig, ','), '') FROM pg_proc p
      WHERE p.oid = to_regprocedure('public.drvas_consume_rate_limit(uuid,text,integer,integer)')
    ) ELSE '' END AS function_config,
    CASE WHEN c.function_exists THEN has_function_privilege(
      'service_role',
      'public.drvas_consume_rate_limit(uuid,text,integer,integer)',
      'EXECUTE'
    ) ELSE false END AS service_role_can_execute,
    CASE WHEN c.table_exists THEN has_table_privilege(
      'service_role', 'public.drvas_rate_limits', 'SELECT,INSERT,UPDATE'
    ) ELSE false END AS service_role_table_access,
    CASE WHEN c.table_exists THEN has_table_privilege(
      'anon', 'public.drvas_rate_limits', 'SELECT'
    ) ELSE false END AS anon_can_select
  FROM checks c
)
SELECT *,
  (table_exists AND function_exists AND rls_enabled AND security_definer
   AND function_config LIKE '%search_path=pg_catalog, public%'
   AND service_role_can_execute AND service_role_table_access AND NOT anon_can_select
  ) AS rate_limit_setup_ok
FROM details;
