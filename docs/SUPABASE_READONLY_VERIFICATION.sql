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
    ('public', 'drvas_business_transactions', 'table'),
    ('public', 'drvas_studio_render_jobs', 'table'),
    ('public', 'drvas_chat_attachments', 'table'),
    ('storage', 'objects', 'table'),
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

-- Focused verification for the shared Academy / Commerce / Business project table.
-- Expected: RLS is true, four owner-scoped policies exist, authenticated has CRUD,
-- and anon/public have no table privileges.
SELECT
  c.relrowsecurity AS rls_enabled,
  (SELECT count(*) FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'drvas_module_projects'
      AND p.policyname IN (
        'Users can read their own module projects',
        'Users can create their own module projects',
        'Users can update their own module projects',
        'Users can delete their own module projects'
      )) AS expected_owner_policy_count,
  has_table_privilege('authenticated', 'public.drvas_module_projects', 'SELECT') AS authenticated_can_select,
  has_table_privilege('authenticated', 'public.drvas_module_projects', 'INSERT') AS authenticated_can_insert,
  has_table_privilege('authenticated', 'public.drvas_module_projects', 'UPDATE') AS authenticated_can_update,
  has_table_privilege('authenticated', 'public.drvas_module_projects', 'DELETE') AS authenticated_can_delete,
  has_table_privilege('anon', 'public.drvas_module_projects', 'SELECT') AS anon_can_select,
  has_table_privilege('anon', 'public.drvas_module_projects', 'INSERT') AS anon_can_insert,
  has_table_privilege('anon', 'public.drvas_module_projects', 'UPDATE') AS anon_can_update,
  has_table_privilege('anon', 'public.drvas_module_projects', 'DELETE') AS anon_can_delete
FROM pg_class c
WHERE c.oid = 'public.drvas_module_projects'::regclass;

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


-- Private Studio/chat Storage bucket configuration (no object names or file contents).
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'drvas-media';

-- Storage object policies must scope access to the user's own folder.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- Verify that anonymous/authenticated roles cannot execute the privileged rate-limit function.
SELECT
  has_function_privilege('anon', 'public.drvas_consume_rate_limit(uuid,text,integer,integer)', 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', 'public.drvas_consume_rate_limit(uuid,text,integer,integer)', 'EXECUTE') AS authenticated_can_execute,
  has_function_privilege('service_role', 'public.drvas_consume_rate_limit(uuid,text,integer,integer)', 'EXECUTE') AS service_role_can_execute;

-- Explicitly surface any unexpected anon/authenticated grants on sensitive Dr.Vas tables.
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon','authenticated')
  AND table_name IN (
    'drvas_private_profiles','drvas_privacy_consents','drvas_crypto_devices',
    'drvas_rate_limits','drvas_audit_logs','drvas_founder_provenance'
  )
ORDER BY table_name, grantee, privilege_type;
