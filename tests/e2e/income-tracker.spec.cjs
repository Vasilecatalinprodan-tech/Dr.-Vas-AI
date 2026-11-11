const { test, expect } = require("@playwright/test");

const SUPABASE_STUB = `
window.supabase = {
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
    },
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        order() { return this; },
        limit: async () => ({ data: [], error: null })
      };
    }
  })
};
`;

async function openApp(page) {
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", route =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: SUPABASE_STUB })
  );
  await page.addInitScript(() => localStorage.setItem("drvas_language", "ro"));
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.lang === "ro" &&
    !document.querySelector("#appMain")?.classList.contains("language-pending"));
  await page.evaluate(() => {
    currentUser = { id: "e2e-income-owner", email: "owner@example.invalid" };
  });
}

test("Income Tracker inserts a private opportunity with the authenticated owner and all financial fields", async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => {
    window.__INCOME_INSERTS__ = [];
    supabaseClient.from = table => {
      const query = { filters: [], payload: null };
      query.insert = function (payload) {
        this.payload = payload;
        window.__INCOME_INSERTS__.push({ table, payload });
        return this;
      };
      query.select = function () { return this; };
      query.single = async function () {
        return { data: { id: "e2e-income-1" }, error: null };
      };
      query.eq = function (key, value) { this.filters.push([key, value]); return this; };
      query.order = function () { return this; };
      query.limit = async function () { return { data: [], error: null }; };
      return query;
    };
    document.getElementById("incomeTitle").value = "Traducere pentru client";
    document.getElementById("incomePlatform").value = "Client test";
    document.getElementById("incomeType").value = "translation";
    document.getElementById("incomeStatus").value = "submitted";
    document.getElementById("incomeEstimated").value = "250";
    document.getElementById("incomeActual").value = "75";
    document.getElementById("incomeCurrency").value = "GBP";
    document.getElementById("incomeNextAction").value = "Așteaptă feedback";
    document.getElementById("incomeNotes").value = "Drepturile și termenii trebuie verificați";
    document.getElementById("incomeUrl").value = "https://example.invalid/opportunity";
  });
  await page.evaluate(() => saveIncomeOpportunity());
  const result = await page.evaluate(() => ({
    inserts: window.__INCOME_INSERTS__,
    message: document.getElementById("incomeStatusMessage").textContent,
    activeId: currentIncomeOpportunityId
  }));
  expect(result.inserts).toHaveLength(1);
  expect(result.inserts[0].table).toBe("drvas_income_opportunities");
  expect(result.inserts[0].payload.user_id).toBe("e2e-income-owner");
  expect(result.inserts[0].payload.title).toBe("Traducere pentru client");
  expect(result.inserts[0].payload.opportunity_type).toBe("translation");
  expect(result.inserts[0].payload.status).toBe("submitted");
  expect(result.inserts[0].payload.estimated_amount).toBe(250);
  expect(result.inserts[0].payload.actual_amount).toBe(75);
  expect(result.inserts[0].payload.currency).toBe("GBP");
  expect(result.activeId).toBe("e2e-income-1");
  expect(result.message).toContain("salvată");
});

test("Income Tracker reports a failed database write and does not claim the opportunity was saved", async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => {
    supabaseClient.from = () => ({
      insert() { return this; },
      select() { return this; },
      single: async () => ({ data: null, error: { message: "simulated write failure" } })
    });
    document.getElementById("incomeTitle").value = "Oportunitate nesalvată";
  });
  await page.evaluate(() => saveIncomeOpportunity());
  const result = await page.evaluate(() => ({
    message: document.getElementById("incomeStatusMessage").textContent,
    activeId: currentIncomeOpportunityId
  }));
  expect(result.message).toContain("Nu am putut salva");
  expect(result.message).not.toContain("Oportunitatea a fost salvată");
  expect(result.activeId).toBeNull();
});

test("Income Tracker renders untrusted opportunity titles as text, not executable HTML", async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => {
    window.__INCOME_XSS__ = false;
    incomeOpportunityCache = [{
      id: "untrusted-1",
      title: '<img src=x onerror="window.__INCOME_XSS__=true">',
      platform: "Test",
      opportunity_type: "other",
      status: "idea",
      estimated_amount: 10,
      actual_amount: 0,
      currency: "GBP",
      next_action: "",
      notes: ""
    }];
    renderIncomeOpportunities();
  });
  await expect(page.locator("#incomeOpportunityList img")).toHaveCount(0);
  await expect(page.locator("#incomeOpportunityList strong")).toContainText("<img");
  expect(await page.evaluate(() => window.__INCOME_XSS__)).toBe(false);
});

test("Income Tracker totals stay separated by currency and filters only change visible rows", async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => {
    incomeOpportunityCache = [
      { id:"a", title:"GBP translation", platform:"A", opportunity_type:"translation", status:"paid", estimated_amount:100, actual_amount:90, currency:"GBP", next_action:"", notes:"" },
      { id:"b", title:"EUR writing", platform:"B", opportunity_type:"writing", status:"submitted", estimated_amount:200, actual_amount:0, currency:"EUR", next_action:"", notes:"" }
    ];
    renderIncomeOpportunities();
    document.getElementById("incomeFilterStatus").value = "paid";
    renderIncomeOpportunities();
  });
  await expect(page.locator("#incomeOpportunityList .income-item")).toHaveCount(1);
  await expect(page.locator("#incomeFilterCount")).toContainText("Afișate 1 din 2");
  const totals = await page.evaluate(() => ({
    estimated: document.getElementById("incomeEstimatedTotal").textContent,
    actual: document.getElementById("incomeActualTotal").textContent
  }));
  expect(totals.estimated).toContain("GBP");
  expect(totals.estimated).toContain("EUR");
  expect(totals.actual).toContain("GBP");
  expect(totals.actual).toContain("EUR");
});
