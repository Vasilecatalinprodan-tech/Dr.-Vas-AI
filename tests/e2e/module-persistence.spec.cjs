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
