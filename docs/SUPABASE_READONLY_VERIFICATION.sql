-- Dr.Vas live Supabase verification (READ ONLY)
-- Run this in Supabase SQL Editor. It does not create, alter, delete, or update anything.

WITH expected_objects(schema_name, object_name, object_kind) AS (
  VALUES
    ('public', 'drvas_audit_logs', 'table'),
    ('public', 'drvas_rate_limits', 'table'),
    ('public', 'drvas_private_profiles', 'table'),
    ('public', 'drvas_privacy_consents', 'table'),
    ('public', 'drvas_crypto_devices', 'table'),
    ('public', 'drvas_studio_projects', 'table'),
    ('public', 'drvas_module_projects', 'table'),
    ('public', 'drvas_income_opportunities', 'table'),
    ('public', 'drvas_founder_provenance', 'table'),
    ('public', 'drvas_conversation_metadata', 'table'),
    ('public', 'drvas_consume_rate_limit(uuid,text,integer,integer)', 'function')
)
SELECT
  e.object_kind,
  e.schema_name,
  e.object_name,
  CASE
    WHEN e.object_kind = 'table' THEN to_regclass(format('%I.%I', e.schema_name, e.object_name)) IS NOT NULL
    WHEN e.object_kind = 'function' THEN to_regprocedure('public.drvas_consume_rate_limit(uuid,text,integer,integer)') IS NOT NULL
    ELSE false
  END AS exists_in_database,
  CASE WHEN e.object_kind = 'table' THEN c.relrowsecurity ELSE NULL END AS rls_enabled,
  CASE WHEN e.object_kind = 'table' THEN c.relforcerowsecurity ELSE NULL END AS force_rls
FROM expected_objects e
LEFT JOIN pg_namespace n ON n.nspname = e.schema_name
LEFT JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = e.object_name AND e.object_kind = 'table'
ORDER BY e.object_kind, e.object_name;

-- RLS policy inventory for Dr.Vas tables. Zero rows means no policies were found.
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'drvas_%'
ORDER BY tablename, policyname;

-- Privilege overview for selected sensitive tables (does not reveal row contents).
SELECT
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'drvas_audit_logs', 'drvas_rate_limits', 'drvas_private_profiles',
    'drvas_privacy_consents', 'drvas_crypto_devices', 'drvas_studio_projects', 'drvas_module_projects',
    'drvas_income_opportunities', 'drvas_founder_provenance',
    'drvas_conversation_metadata'
  )
ORDER BY table_name, grantee, privilege_type;
