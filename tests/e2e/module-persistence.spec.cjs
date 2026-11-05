const { test, expect } = require("@playwright/test");

const SUPABASE_STUB = `
window.supabase = {
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
    },
    from(table) {
      const query = {
        select() { return this; },
        eq(key, value) { (this.filters ||= []).push([key, value]); return this; },
        order() { return this; },
        limit: async () => ({ data: [], error: null }),
        insert(payload) {
          window.__DRVAS_DB_CALLS__.push({ operation: "insert", table, payload });
          return {
            select() { return this; },
            single: async () => ({ data: { id: "e2e-project-" + payload.module }, error: null })
          };
        }
      };
      return query;
    }
  })
};
`;

async function openApp(page) {
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", route =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: SUPABASE_STUB })
  );
  await page.addInitScript(() => {
    localStorage.setItem("drvas_language", "ro");
    window.__DRVAS_DB_CALLS__ = [];
  });
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.lang === "ro" &&
    !document.querySelector("#appMain")?.classList.contains("language-pending"));
  await page.evaluate(() => {
    currentUser = { id: "e2e-module-owner", email: "owner@example.invalid" };
    isDrvasAdmin = true;
    const client = supabaseClient;
    client.from = table => {
      const query = {
        select() { return this; },
        eq(key, value) { (this.filters ||= []).push([key, value]); return this; },
        order() { return this; },
        limit: async () => ({ data: [], error: null }),
        insert(payload) {
          window.__DRVAS_DB_CALLS__.push({ operation: "insert", table, payload });
          return {
            select() { return this; },
            single: async () => ({ data: { id: "e2e-project-" + payload.module }, error: null })
          };
        }
      };
      return query;
    };
  });
}

for (const scenario of [
  { module: "academy", primary: "academySubject", title: "academyProjectTitle", value: "Plan curs antreprenoriat" },
  { module: "commerce", primary: "commerceProduct", title: "commerceProjectTitle", value: "Magazin online" },
  { module: "business", primary: "businessIdea", title: "businessProjectTitle", value: "Plan companie servicii" }
]) {
  test(`${scenario.module} saves its own private project with module and user ownership`, async ({ page }) => {
    await openApp(page);
    await page.evaluate(({ primary, title, value, module }) => {
      document.getElementById(primary).value = value;
      document.getElementById(title).value = value + " — proiect";
      return saveModuleProject(module);
    }, { ...scenario });
    const calls = await page.evaluate(() => window.__DRVAS_DB_CALLS__);
    expect(calls).toHaveLength(1);
    expect(calls[0].operation).toBe("insert");
    expect(calls[0].table).toBe("drvas_module_projects");
    expect(calls[0].payload.user_id).toBe("e2e-module-owner");
    expect(calls[0].payload.module).toBe(scenario.module);
    expect(calls[0].payload.title).toBe(scenario.value + " — proiect");
    expect(calls[0].payload.brief.saved_from).toBe("drvas-" + scenario.module);
  });
}


test("last selected module is remembered across browser reloads per account", async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => {
    currentUser = { id: "e2e-returning-user", email: "returning@example.invalid" };
    rememberActiveModule("health");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.lang === "ro" &&
    !document.querySelector("#appMain")?.classList.contains("language-pending"));
  const remembered = await page.evaluate(() => {
    currentUser = { id: "e2e-returning-user", email: "returning@example.invalid" };
    return getRememberedModule();
  });
  expect(remembered).toBe("health");
  const otherAccount = await page.evaluate(() => {
    currentUser = { id: "different-user" };
    return getRememberedModule();
  });
  expect(otherAccount).toBeNull();
  await page.evaluate(() => clearRememberedModule("e2e-returning-user"));
  const afterLogout = await page.evaluate(() => {
    currentUser = { id: "e2e-returning-user" };
    return getRememberedModule();
  });
  expect(afterLogout).toBeNull();
});


for (const scenario of [
  { module: "academy", primary: "academySubject", title: "academyProjectTitle", value: "Curs restaurat după redeschidere" },
  { module: "commerce", primary: "commerceProduct", title: "commerceProjectTitle", value: "Produs restaurat după redeschidere" },
  { module: "business", primary: "businessIdea", title: "businessProjectTitle", value: "Plan restaurat după redeschidere" }
]) {
  test(\`\${scenario.module} project can be saved, listed and reopened with its original fields\`, async ({ page }) => {
    await openApp(page);
    await page.evaluate(() => {
      const rows = [];
      const calls = [];
      window.__DRVAS_ROUNDTRIP_CALLS__ = calls;
      supabaseClient.from = table => {
        const query = { filters: [], selected: false };
        query.select = function () { this.selected = true; return this; };
        query.eq = function (key, value) { this.filters.push([key, value]); return this; };
        query.order = function () { return this; };
        query.limit = async function () {
          const result = rows.filter(row => this.filters.every(([key, value]) => row[key] === value));
          return { data: result.map(row => ({ id: row.id, title: row.title, updated_at: row.updated_at })), error: null };
        };
        query.single = async function () {
          const result = rows.find(row => this.filters.every(([key, value]) => row[key] === value));
          return { data: result || null, error: result ? null : { message: "Project not found" } };
        };
        query.insert = function (payload) {
          calls.push({ operation: "insert", table, payload });
          const row = { ...payload, id: "e2e-roundtrip-" + payload.module };
          rows.push(row);
          return { select() { return this; }, single: async () => ({ data: { id: row.id }, error: null }) };
        };
        return query;
      };
    });
    await page.evaluate(async ({ primary, title, value, module }) => {
      document.getElementById(primary).value = value;
      document.getElementById(title).value = value + " — titlu";
      await saveModuleProject(module);
      document.getElementById(primary).value = "Valoare modificată temporar";
      document.getElementById(title).value = "Titlu temporar";
      const picker = document.getElementById(module + "ProjectList");
      picker.value = "e2e-roundtrip-" + module;
      await openModuleProject(module);
    }, scenario);
    const restored = await page.evaluate(({ primary, title }) => ({
      primary: document.getElementById(primary).value,
      title: document.getElementById(title).value,
      calls: window.__DRVAS_ROUNDTRIP_CALLS__
    }), scenario);
    expect(restored.primary).toBe(scenario.value);
    expect(restored.title).toBe(scenario.value + " — titlu");
    expect(restored.calls).toHaveLength(1);
    expect(restored.calls[0].payload.user_id).toBe("e2e-module-owner");
    expect(restored.calls[0].payload.module).toBe(scenario.module);
  });
}
