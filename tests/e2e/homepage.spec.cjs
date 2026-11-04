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

test("header chat button opens the conversation without entering destructive focus layout", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-session-user", email: "e2e@example.invalid" };
    window.enterChatFocus();
  });

  await expect(page.locator("#chatSection")).toBeVisible();
  await expect(page.locator("#heroSection")).toBeVisible();
  await expect(page.locator('[data-module]')).toHaveCount(6);
  expect(await page.evaluate(() => document.body.classList.contains("chat-focus-mode"))).toBe(false);
  await page.locator("#chatSection").scrollIntoViewIfNeeded();
  await expect(page.locator("#question")).toBeVisible();
});

test("header chat button routes signed-out visitors to sign-in without hiding the dashboard", async ({ page }) => {
  await openApp(page, "ro");
  await page.locator("#headerChatCta").click();

  await expect(page.locator("#authSection")).toBeVisible();
  await expect(page.locator("#heroSection")).toBeVisible();
  await expect(page.locator('[data-module]')).toHaveCount(6);
  await expect(page.locator("#chatSection")).toBeHidden();
  expect(await page.evaluate(() => document.body.classList.contains("chat-focus-mode"))).toBe(false);
});

test("health stays available while premium modules remain gated for non-admin users", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-standard-user", email: "standard@example.invalid" };
    isDrvasAdmin = false;
    selectModule("health", true);
  });

  await expect(page.locator("#activeModuleName")).toContainText("Dr.Vas Health");
  await expect(page.locator("#moduleAccessMessage")).toContainText("nu înlocuiește");
  await page.evaluate(() => selectModule("studio", true));
  await expect(page.locator("#moduleAccessMessage")).toContainText("Premium");
  await expect(page.locator("#studioWorkspace")).toBeHidden();
  await expect(page.locator("#activeModuleName")).toContainText("Dr.Vas Health");
});


test("first spoken answer waits for asynchronously loaded browser voices and plays without Replay", async ({ page }) => {
  await openApp(page, "ro");

  const playback = await page.evaluate(async () => {
    let voices = [];
    const listeners = new Set();
    window.__DRVAS_SPOKEN__ = [];
    const synth = {
      getVoices: () => voices,
      addEventListener: (name, callback) => { if (name === "voiceschanged") listeners.add(callback); },
      removeEventListener: (name, callback) => { if (name === "voiceschanged") listeners.delete(callback); },
      cancel() {},
      resume() {},
      speak: utterance => {
        window.__DRVAS_SPOKEN__.push({ text: utterance.text, voice: utterance.voice?.name || "" });
        utterance.onstart?.();
        utterance.onend?.();
      }
    };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: synth });
    window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    voiceAutoRead = true;
    setTimeout(() => {
      voices = [{ name: "Andrei Romanian", lang: "ro-RO", voiceURI: "andrei-ro" }];
      [...listeners].forEach(callback => callback());
    }, 100);
    await window.speakDrVas("Primul răspuns Dr Vas.");
    return window.__DRVAS_SPOKEN__;
  });

  expect(playback).toHaveLength(1);
  expect(playback[0].text).toContain("Primul răspuns Dr Vas");
  expect(playback[0].voice).toBe("Andrei Romanian");
});

test("live voice room shows the selected assistant avatar and speaking animation for all three characters", async ({ page }) => {
  await openApp(page, "ro");
  const states = await page.evaluate(() => {
    const result = [];
    for (const [id, expectedName, expectedType] of [
      ["drvas", "Dr.Vas", "img"],
      ["jan", "Dr.Jan", "svg"],
      ["aurora", "Sarah", "svg"]
    ]) {
      selectAssistant(id);
      updateLiveVoiceStage("speaking", expectedName + " vorbește…");
      const stage = document.querySelector("#liveVoiceStage");
      result.push({
        name: document.querySelector("#liveStageName")?.textContent,
        visible: !stage.hidden && stage.classList.contains("is-open"),
        speaking: stage.classList.contains("is-speaking"),
        avatarType: document.querySelector("#liveStageAvatar img") ? "img" :
          document.querySelector("#liveStageAvatar svg") ? "svg" : "missing"
      });
    }
    updateLiveVoiceStage("closed");
    return result;
  });
  expect(states).toHaveLength(3);
  for (let i = 0; i < states.length; i++) {
    expect(states[i].name).toBe(["Dr.Vas", "Dr.Jan", "Sarah"][i]);
    expect(states[i].visible).toBe(true);
    expect(states[i].speaking).toBe(true);
    expect(states[i].avatarType).toBe(["img", "svg", "svg"][i]);
  }
  await expect(page.locator("#liveVoiceStage")).toBeHidden();
});

test("administrator can open the Academy, Commerce and Business pilot brief builders", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-admin-user", email: "admin@example.invalid" };
    isDrvasAdmin = true;
  });

  await page.evaluate(() => selectModule("academy", true));
  await expect(page.locator("#academyWorkspace")).toBeVisible();
  await page.locator("#academySubject").fill("Bazele comerțului online");
  await page.locator("#academyAudience").fill("Începători");
  await page.locator("#academyOutcome").fill("Lansarea unui magazin simplu");
  await page.locator("#academyBrief").fill("Curs practic cu exerciții.");
  await page.locator('#academyWorkspace button[onclick="buildAcademyPrompt()"]').click();
  await expect(page.locator("#question")).toHaveValue(/DR.VAS ACADEMY/);
  await expect(page.locator("#question")).toHaveValue(/Bazele comerțului online/);

  await page.evaluate(() => selectModule("commerce", true));
  await expect(page.locator("#commerceWorkspace")).toBeVisible();
  await page.locator("#commerceProduct").fill("Organizatoare pentru casă");
  await page.locator("#commerceBudget").fill("100");
  await page.locator("#commerceBrief").fill("Fără stoc mare la început.");
  await page.locator('#commerceWorkspace button[onclick="buildCommercePrompt()"]').click();
  await expect(page.locator("#question")).toHaveValue(/DR.VAS COMMERCE/);
  await expect(page.locator("#question")).toHaveValue(/BUGET MAXIM: 100/);

  await page.evaluate(() => selectModule("business", true));
  await expect(page.locator("#businessWorkspace")).toBeVisible();
  await page.locator("#businessIdea").fill("Servicii de curățenie");
  await page.locator("#businessBudget").fill("500");
  await page.locator("#businessGoal").fill("Primii 10 clienți");
  await page.locator("#businessBrief").fill("Pornire locală.");
  await page.locator('#businessWorkspace button[onclick="buildBusinessPrompt()"]').click();
  await expect(page.locator("#question")).toHaveValue(/DR.VAS BUSINESS/);
  await expect(page.locator("#question")).toHaveValue(/Primii 10 clienți/);
});

test("non-admin users cannot open Academy, Commerce or Business pilot workspaces", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-standard-user", email: "standard@example.invalid" };
    isDrvasAdmin = false;
  });
  for (const moduleId of ["academy", "commerce", "business"]) {
    await page.evaluate(id => selectModule(id, true), moduleId);
    await expect(page.locator("#moduleAccessMessage")).toContainText("Premium");
    await expect(page.locator("#" + moduleId + "Workspace")).toBeHidden();
  }
});

test("Academy, Commerce and Business projects are saved, reopened and deleted per user", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-project-owner", email: "owner@example.invalid" };
    isDrvasAdmin = true;
    const rows = [];
    let nextId = 1;
    supabaseClient.from = function(table) {
        let operation = "select", payload = null, filters = {};
        const matches = row => Object.entries(filters).every(([key, value]) => row[key] === value);
        const execute = () => {
          if (table !== "drvas_module_projects") return { data: null, error: { message: "Unexpected table" } };
          if (operation === "insert") {
            const row = { ...payload, id: "module-project-" + nextId++, created_at: new Date().toISOString(), updated_at: payload.updated_at };
            rows.push(row);
            return { data: row, error: null };
          }
          if (operation === "update") {
            const row = rows.find(matches);
            if (!row) return { data: null, error: { message: "Not found" } };
            Object.assign(row, payload);
            return { data: row, error: null };
          }
          if (operation === "delete") {
            for (let i = rows.length - 1; i >= 0; i--) if (matches(rows[i])) rows.splice(i, 1);
            return { data: null, error: null };
          }
          return { data: rows.filter(matches).sort((a,b) => b.updated_at.localeCompare(a.updated_at)), error: null };
        };
        const query = {
          select() { return this; },
          eq(key, value) { filters[key] = value; return this; },
          order() { return this; },
          limit() { return this; },
          insert(value) { operation = "insert"; payload = value; return this; },
          update(value) { operation = "update"; payload = value; return this; },
          delete() { operation = "delete"; return this; },
          single() { const result = execute(); return Promise.resolve({ data: Array.isArray(result.data) ? result.data[0] : result.data, error: result.error }); },
          then(resolve, reject) { return Promise.resolve(execute()).then(resolve, reject); }
        };
        return query;
    };
  });

  const modules = [
    { id: "academy", primary: "academySubject", value: "Curs de antreprenoriat", title: "Curs pilot" },
    { id: "commerce", primary: "commerceProduct", value: "Accesorii pentru casă", title: "Analiză produs" },
    { id: "business", primary: "businessIdea", value: "Servicii locale", title: "Plan afaceri" }
  ];
  for (const item of modules) {
    await page.evaluate(id => selectModule(id, true), item.id);
    await page.locator("#" + item.primary).fill(item.value);
    await page.locator("#" + item.id + "ProjectTitle").fill(item.title);
    await page.evaluate(id => saveModuleProject(id), item.id);
    await expect(page.locator("#" + item.id + "ProjectStatus")).toContainText("salvat");
    await expect(page.locator("#" + item.id + "ProjectList option")).toHaveCount(2);

    await page.locator("#" + item.primary).fill("Valoare modificată");
    await page.evaluate(id => openModuleProject(id), item.id);
    await expect(page.locator("#" + item.primary)).toHaveValue(item.value);

    page.once("dialog", dialog => dialog.accept());
    await page.evaluate(id => deleteModuleProject(id), item.id);
    await expect(page.locator("#" + item.id + "ProjectList option")).toHaveCount(1);
  }
});

test("logout removes administrator workspaces and clears private module drafts", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-admin-user", email: "admin@example.invalid" };
    isDrvasAdmin = true;
    selectModule("business", true);
    moduleProjectState.business = "private-project-id";
    moduleProjectOutputs.business = "Private draft output";
    document.querySelector("#adminPanel")?.classList.remove("hidden");
    document.querySelector("#businessProjectTitle").value = "Private plan";
    document.querySelector("#businessIdea").value = "Private business idea";
    document.querySelector("#privateLegalName").value = "Private legal name";
    document.querySelector("#privateProfileConsent").checked = true;
    showLogin();
  });
  await expect(page.locator("#businessWorkspace")).toBeHidden();
  await expect(page.locator("#academyWorkspace")).toBeHidden();
  await expect(page.locator("#commerceWorkspace")).toBeHidden();
  await expect(page.locator("#studioWorkspace")).toBeHidden();
  await expect(page.locator("#adminPanel")).toBeHidden();
  const state = await page.evaluate(() => ({
    user: currentUser,
    admin: isDrvasAdmin,
    projectId: moduleProjectState.business,
    output: moduleProjectOutputs.business,
    title: document.querySelector("#businessProjectTitle").value,
    idea: document.querySelector("#businessIdea").value,
    privateName: document.querySelector("#privateLegalName").value,
    privateConsent: document.querySelector("#privateProfileConsent").checked
  }));
  expect(state.user).toBeNull();
  expect(state.admin).toBe(false);
  expect(state.projectId).toBeNull();
  expect(state.output).toBe("");
  expect(state.title).toBe("");
  expect(state.idea).toBe("");
  expect(state.privateName).toBe("");
  expect(state.privateConsent).toBe(false);
});
