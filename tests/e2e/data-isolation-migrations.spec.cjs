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
