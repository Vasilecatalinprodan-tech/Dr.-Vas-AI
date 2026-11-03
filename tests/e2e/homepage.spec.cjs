const { test, expect } = require("@playwright/test");

const SUPABASE_STUB = `
window.supabase = {
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: window.__DRVAS_E2E_SESSION__ || null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
    },
    from: () => ({
      select() { return this; },
      eq() { return this; },
      maybeSingle: async () => ({
        data: null,
        error: window.__DRVAS_E2E_PROFILE_ERROR__ ? { message: "E2E profile read failure" } : null
      }),
      insert: async () => ({ error: null })
    })
  })
};
`;

async function openApp(page, language = null, session = null, profileError = false) {
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", route =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: SUPABASE_STUB })
  );
  await page.addInitScript(({ language, session, profileError }) => {
    if (language) localStorage.setItem("drvas_language", language);
    else localStorage.removeItem("drvas_language");
    window.__DRVAS_E2E_SESSION__ = session;
    window.__DRVAS_E2E_PROFILE_ERROR__ = profileError;
  }, { language, session, profileError });
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
}

test("first visit shows the language chooser", async ({ page }) => {
  await openApp(page);
  await expect(page.locator("#languageGate")).toBeVisible();
  await expect(page.locator("#appMain")).toHaveClass(/language-pending/);
});

test("saved language keeps the public dashboard visible", async ({ page }) => {
  await openApp(page, "ro");
  await expect(page.locator("#heroSection")).toBeVisible();
  await expect(page.locator('[data-module]')).toHaveCount(6);
});

test("showChat keeps the public dashboard visible instead of entering focus mode", async ({ page }) => {
  await openApp(page, "ro");
  await expect(page.locator("#heroSection")).toBeVisible();

  const enteredFocusMode = await page.evaluate(() => {
    if (typeof window.showChat !== "function") throw new Error("showChat() is not exposed for browser regression testing");
    window.showChat({ id: "e2e-session-user", email: "e2e@example.invalid" }, "E2E");
    return document.body.classList.contains("chat-focus-mode");
  });

  expect(enteredFocusMode).toBe(false);
  await expect(page.locator("#heroSection")).toBeVisible();
  await expect(page.locator('[data-module]')).toHaveCount(6);
});

test("persisted Supabase session keeps the public dashboard visible when profile loading fails", async ({ page }) => {
  await openApp(page, "ro", {
    access_token: "e2e-access-token",
    user: { id: "e2e-session-user", email: "e2e@example.invalid" }
  }, true);

  await expect(page.locator("#profileMessage")).toContainText("E2E profile read failure");
  await expect(page.locator("#heroSection")).toBeVisible();
  await expect(page.locator('[data-module]')).toHaveCount(6);
  await expect(page.locator("#chatSection")).toBeHidden();
  expect(await page.evaluate(() => document.body.classList.contains("chat-focus-mode"))).toBe(false);
});
