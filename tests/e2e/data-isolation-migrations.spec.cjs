const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

const migration = name => fs.readFileSync(
  path.join(__dirname, "../../supabase/migrations", name),
  "utf8"
).replace(/--[^\n]*/g, "");

function assertOwnerScopedTable(sql, table, label) {
  expect(sql, label + ": RLS must be enabled").toMatch(
    new RegExp("alter\\s+table\\s+(?:public\\.)?" + table + "\\s+enable\\s+row\\s+level\\s+security", "i")
  );
  expect(sql, label + ": public and anon must have no table privileges").toMatch(
    new RegExp("revoke\\s+all\\s+on\\s+table\\s+(?:public\\.)?" + table + "\\s+from\\s+public\\s*,\\s*anon", "i")
  );
  for (const operation of ["select", "insert", "update", "delete"]) {
    const policy = new RegExp(
      "create\\s+policy[\\s\\S]{0,180}?on\\s+(?:public\\.)?" + table +
      "\\s+for\\s+" + operation + "[\\s\\S]{0,500}?(?:using|with\\s+check)\\s*\\([\\s\\S]{0,180}?auth\\s*\\.\\s*uid\\s*\\(\\s*\\)\\s*=\\s*user_id",
      "i"
    );
    expect(sql, label + ": " + operation + " policy must bind rows to auth.uid()").toMatch(policy);
  }
}

test("Academy, Commerce and Business project drafts enforce owner-only database access", async () => {
  const sql = migration("202611040001_module_projects.sql");
  assertOwnerScopedTable(sql, "drvas_module_projects", "module projects");
  expect(sql).toMatch(/module\s+in\s*\(\s*'academy'\s*,\s*'commerce'\s*,\s*'business'\s*\)/i);
});

test("Business cashbook enforces owner-only access and validates money fields", async () => {
  const sql = migration("202611040003_business_cashbook.sql");
  assertOwnerScopedTable(sql, "drvas_business_transactions", "business cashbook");
  expect(sql).toMatch(/amount\s+numeric\s*\(\s*14\s*,\s*2\s*\)\s+not\s+null\s+check\s*\(\s*amount\s*>\s*0\s*\)/i);
  expect(sql).toMatch(/currency\s+in\s*\(\s*'GBP'\s*,\s*'EUR'\s*,\s*'RON'\s*,\s*'CHF'\s*,\s*'USD'\s*\)/i);
  expect(sql).toMatch(/vat_rate\s+numeric\s*\(\s*5\s*,\s*2\s*\)\s+not\s+null\s+default\s+0\s+check\s*\(\s*vat_rate\s+between\s+0\s+and\s+100\s*\)/i);
});

test("Studio render jobs and media storage remain private and owner-scoped", async () => {
  const sql = migration("202611040004_studio_render_storage.sql");
  assertOwnerScopedTable(sql, "drvas_studio_render_jobs", "Studio render jobs");
  expect(sql).toMatch(/values\s*\(\s*'drvas-media'\s*,\s*'drvas-media'\s*,\s*false/i);
  for (const operation of ["select", "insert", "update", "delete"]) {
    const policy = new RegExp(
      "on\\s+storage\\.objects\\s+for\\s+" + operation +
      "[\\s\\S]{0,350}?bucket_id\\s*=\\s*'drvas-media'[\\s\\S]{0,350}?storage\\.foldername\\s*\\(\\s*name\\s*\\)\\s*\\)\\s*\\[\\s*1\\s*\\]\\s*=\\s*auth\\s*\\.\\s*uid\\s*\\(\\s*\\)\\s*::\\s*text",
      "i"
    );
    expect(sql, "Studio storage " + operation + " policy must scope the first folder to the signed-in user").toMatch(policy);
  }
});


test("Private profiles and consent evidence cannot be accessed directly by browser roles", async () => {
  const sql = migration("202611030002_private_profile_and_privacy.sql");
  expect(sql).toMatch(/drvas_private_profiles[\s\S]{0,1200}?enable row level security/i);
  expect(sql).toMatch(/revoke all on public\.drvas_private_profiles from anon,\s*authenticated/i);
  expect(sql).toMatch(/grant select,\s*insert,\s*update,\s*delete on public\.drvas_private_profiles to service_role/i);
  expect(sql).toMatch(/revoke all on public\.drvas_privacy_consents from anon,\s*authenticated/i);
  expect(sql).toMatch(/grant select,\s*insert,\s*update,\s*delete on public\.drvas_privacy_consents to service_role/i);
  expect(sql).toMatch(/health_data_processing/i);
});

test("Chat attachment metadata is owner-scoped, bounded and restricted to supported file types", async () => {
  const sql = migration("202611050001_chat_attachments.sql");
  expect(sql).toMatch(/alter table public\.drvas_chat_attachments enable row level security/i);
  expect(sql).toMatch(/revoke all on table public\.drvas_chat_attachments from public, anon/i);
  expect(sql).toMatch(/grant select, insert, delete on public\.drvas_chat_attachments to authenticated/i);
  for (const operation of ["select", "insert", "delete"]) {
    expect(sql).toMatch(new RegExp(
      "create\\s+policy[\\s\\S]{0,180}?on public\\.drvas_chat_attachments\\s+for\\s+" + operation,
      "i"
    ));
  }
  expect(sql).toMatch(/file_size between 1 and 15728640/i);
  expect(sql).toContain("storage_path like user_id::text || '/%'");
  expect(sql).toMatch(/module in \('free','health','studio','academy','commerce','business'\)/i);
  expect(sql).toMatch(/'application\/pdf'[\s\S]*'text\/plain'[\s\S]*'text\/csv'/i);
  expect(sql).toMatch(/set public = false/i);
});

test("Worker requires separate explicit consent for health attachments and fails closed", async () => {
  const worker = fs.readFileSync(path.join(__dirname, "../../worker/index.js"), "utf8");
  expect(worker).toContain('latestConsent.get("file_processing") !== true');
  expect(worker).toContain('moduleName === "health" && latestConsent.get("health_data_processing") !== true');
  expect(worker).toContain('return json({ error: "Este necesar acordul explicit pentru procesarea fișierelor înainte de analiză." }, 403)');
  expect(worker).toContain('consent_type: "health_data_processing"');
  expect(worker).toContain('granted: body.granted');
  expect(worker).toContain('body.granted === false');
  expect(worker).toContain('!item.storage_path.startsWith(expectedPrefix)');
  expect(worker).toContain('item.storage_path.includes("..")');
  expect(worker).toContain('DRVAS_FILE_ANALYSIS_ENABLED !== "true"');
});

test("Health assistant keeps clinical boundaries and emergency escalation in its server instructions", async () => {
  const worker = fs.readFileSync(path.join(__dirname, "../../worker/index.js"), "utf8");
  expect(worker).toContain("You are an AI assistant, not a doctor, nurse, pharmacist or emergency service.");
  expect(worker).toContain("Do not prescribe, recommend starting/stopping/changing a prescription");
  expect(worker).toContain("calling 999 (or 112)");
  expect(worker).toContain("NHS 111 or urgent GP assessment");
  expect(worker).toContain("Do not reassure someone that serious symptoms are harmless");
  expect(worker).toContain('liveModule === "health" && env.GEMINI_LIVE_HEALTH_ENABLED !== "true"');
});


test("Conversation context migration classifies only new threads and preserves unknown legacy context", async () => {
  const sql = migration("202611060001_conversation_context.sql");
  expect(sql).toMatch(/add column if not exists module text/i);
  expect(sql).toMatch(/add column if not exists conversation_kind text/i);
  expect(sql).toMatch(/add column if not exists feature_key text/i);
  expect(sql).toMatch(/module is null or module in\s*\('free','health','studio','academy','commerce','business'\)/i);
  expect(sql).toMatch(/conversation_kind is null or conversation_kind in\s*\('general','module_assistant','feature_assistant'\)/i);
  expect(sql).toMatch(/user_id, module, archived_at, updated_at desc/i);
  expect(sql).toMatch(/NULL means legacy context is unknown and must not be guessed/i);
  expect(sql).not.toMatch(/update public\.drvas_conversation_metadata\s+set\s+module/i);
  expect(sql).not.toMatch(/drop policy|disable row level security|delete from public\.drvas_conversation_metadata/i);
});


test("Scheduled reminders and notifications are private, bounded and delivered once by the Worker cron", async () => {
  const sql = migration("202611060002_scheduled_reminders.sql");
  expect(sql).toMatch(/create table if not exists public\.drvas_scheduled_tasks/i);
  expect(sql).toMatch(/create table if not exists public\.drvas_notifications/i);
  for (const table of ["drvas_scheduled_tasks", "drvas_notifications"]) {
    expect(sql).toMatch(new RegExp("alter table public\\." + table + " enable row level security", "i"));
    expect(sql).toMatch(new RegExp("auth\\.uid\\(\\) = user_id", "i"));
  }
  expect(sql).toMatch(/unique references public\.drvas_scheduled_tasks/i);
  expect(sql).toMatch(/revoke insert on public\.drvas_notifications from authenticated/i);
  const worker = fs.readFileSync(path.join(__dirname, "../../worker/index.js"), "utf8");
  const wrangler = fs.readFileSync(path.join(__dirname, "../../wrangler.toml"), "utf8");
  expect(wrangler).toContain('crons = ["*/5 * * * *"]');
  expect(worker).toContain("async scheduled(controller, env, ctx)");
  expect(worker).toContain("processDrVasScheduledReminders(env)");
  expect(worker).toContain("resolution=ignore-duplicates,return=minimal");
  expect(worker).toContain("drvas_notifications");
});


test("Private Library migration enforces owner-only access and a user-owned storage path", async () => {
  const sql = migration("202611060003_library_items.sql");
  expect(sql).toMatch(/create table if not exists public\.drvas_library_items/i);
  expect(sql).toMatch(/storage_path like user_id::text \|\| '\/library\/%'/i);
  expect(sql).toMatch(/alter table public\.drvas_library_items enable row level security/i);
  expect(sql).toMatch(/auth\.uid\(\) = user_id/i);
  expect(sql).toMatch(/grant\s+select\s*,\s*insert\s*,\s*delete\s+on\s+(?:table\s+)?public\.drvas_library_items\s+to\s+authenticated/i);
  expect(sql).toMatch(/revoke all on table public\.drvas_library_items from public, anon/i);
});


test("Standalone Projects migration enforces owner-scoped CRUD and module context", async () => {
  const sql = migration("202611060004_projects.sql");
  expect(sql).toMatch(/create table if not exists public\.drvas_projects/i);
  expect(sql).toMatch(/alter table public\.drvas_projects enable row level security/i);
  expect(sql).toMatch(/auth\.uid\(\) = user_id/i);
  expect(sql).toMatch(/module in \('free','health','studio','academy','commerce','business'\)/i);
  expect(sql).toMatch(/grant\s+select\s*,\s*insert\s*,\s*update\s*,\s*delete\s+on\s+(?:table\s+)?public\.drvas_projects\s+to\s+authenticated/i);
  expect(sql).toMatch(/notes text not null default ''/i);
});


test("Worker rejects missing or cross-module conversation context before loading chat history", async () => {
  const worker = fs.readFileSync(path.join(__dirname, "../../worker/index.js"), "utf8");
  const contextGuard = worker.indexOf('"drvas_conversation_metadata"');
  const historyRead = worker.indexOf('"chat_messages"', contextGuard);
  expect(contextGuard).toBeGreaterThan(-1);
  expect(historyRead).toBeGreaterThan(contextGuard);
  expect(worker).toContain('context.module !== moduleName');
  expect(worker).toContain('context.module');
  expect(worker).toContain('}, 409)');
});

test("Frontend establishes conversation module metadata before persisting or sending the first user message", async () => {
  const html = fs.readFileSync(path.join(__dirname, "../../www/index.html"), "utf8");
  const sendStart = html.indexOf("async function send(){");
  const sendEnd = html.indexOf("\nfunction resizeQuestionInput()", sendStart);
  const sendBody = html.slice(sendStart, sendEnd);
  expect(sendBody.indexOf("await ensureConversationMetadata")).toBeGreaterThan(-1);
  expect(sendBody.indexOf("await ensureConversationMetadata")).toBeLessThan(sendBody.indexOf('await saveMessage("user"'));
  expect(sendBody).not.toMatch(/ensureConversationMetadata\([^;]+catch\(metadataError\)/);
});


test("Conversation feature context is saved before chat writes and enforced by the Worker", async () => {
  const html = fs.readFileSync(path.join(__dirname, "../../www/index.html"), "utf8");
  const workspaces = fs.readFileSync(path.join(__dirname, "../../www/module-workspaces.js"), "utf8");
  const worker = fs.readFileSync(path.join(__dirname, "../../worker/index.js"), "utf8");
  expect(html).toContain("feature_key:featureKey||null");
  expect(html).toContain("activeFeatureKey");
  expect(html).toContain("feature_assistant");
  expect(workspaces).toContain("window.drvasSetFeatureContext?.(moduleName,conversationFeature)");
  expect(worker).toContain("body.feature_key || null");
  expect(worker).toContain("context.module !== moduleName");
  expect(worker).toContain("(context.feature_key || null) !== featureKey");
  expect(html).toContain("liveConversationId=currentConversationId");
  expect(html).toContain("const conversationId=liveConversationId||currentConversationId");
  expect(html).toContain("await saveMessage(\"user\",userText,conversationId)");
  expect(html).toContain("setChatNavigationDisabled(true)");
});
