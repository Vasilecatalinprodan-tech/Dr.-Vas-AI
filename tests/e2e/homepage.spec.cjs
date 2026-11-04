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
      order() { return this; },
      limit: async () => ({ data: [], error: null }),
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

test("first visit shows the Dr.Vas landing page, language selector and clear entry CTA", async ({ page }) => {
  await openApp(page);
  await expect(page.locator("#languageGate")).toBeVisible();
  await expect(page.locator("#heroSection")).toBeVisible();
  await expect(page.locator("#landingActions")).toBeVisible();
  await expect(page.locator("#landingActions button")).toContainText("Vorbește cu Dr.Vas");
  await expect(page.locator("#moduleSelectionShell")).toBeHidden();
  await expect(page.locator("#appMain")).not.toHaveClass(/language-pending/);
});

test("saved language keeps the presentation first and reveals modules only after the CTA", async ({ page }) => {
  await openApp(page, "ro");
  await expect(page.locator("#heroSection")).toBeVisible();
  await expect(page.locator("#languageGate")).toBeVisible();
  await expect(page.locator("#moduleSelectionShell")).toBeHidden();
  await page.locator("#headerChatCta").click();
  await expect(page.locator("#moduleSelectionShell")).toBeVisible();
  await expect(page.locator('[data-module]')).toHaveCount(6);
});

test("showChat keeps the landing page until the user chooses to enter the modules", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    if (typeof window.showChat !== "function") throw new Error("showChat() is not exposed for browser regression testing");
    window.showChat({ id: "e2e-session-user", email: "e2e@example.invalid" }, "E2E");
  });
  await expect(page.locator("#heroSection")).toBeVisible();
  await expect(page.locator("#moduleSelectionShell")).toBeHidden();
  await expect(page.locator("#chatSection")).toBeHidden();
});

test("persisted Supabase session keeps the profile screen isolated when profile loading fails", async ({ page }) => {
  await openApp(page, "ro", {
    access_token: "e2e-access-token",
    user: { id: "e2e-session-user", email: "e2e@example.invalid" }
  }, true);

  await expect(page.locator("#profileMessage")).toContainText("E2E profile read failure");
  await expect(page.locator("#profileSection")).toBeVisible();
  await expect(page.locator("#heroSection")).toBeHidden();
  await expect(page.locator("#moduleSelectionShell")).toBeVisible();
  await expect(page.locator("#moduleSelectionSection")).toHaveClass(/auth-flow-mode/);
  await expect(page.locator("#chatSection")).toBeHidden();
});

test("desktop module opens its own workspace beside its contextual chat", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-session-user", email: "e2e@example.invalid" };
    isDrvasAdmin = true;
    showModuleSelection();
    selectModule("studio", true);
  });

  await expect(page.locator("#studioWorkspace")).toBeVisible();
  await expect(page.locator("#chatSection")).toBeVisible();
  await expect(page.locator("#question")).toBeVisible();
  await expect(page.locator(".chat-back-button")).toContainText("Înapoi la module");
  await expect(page.locator(".chat-logout-button")).toBeVisible();
  await expect(page.locator(".chat-module-rail")).toBeHidden();
  expect(await page.evaluate(() => document.body.classList.contains("module-workspace-mode"))).toBe(true);
  const layout = await page.locator("main").evaluate(node => getComputedStyle(node).gridTemplateColumns);
  expect(layout.split(" ").length).toBeGreaterThanOrEqual(2);
});

test("clicking a module as a visitor opens the sign-in gate and preserves the selected module", async ({ page }) => {
  await openApp(page, "ro");
  await page.locator("#headerChatCta").click();
  await page.locator('[data-module="studio"]').click();
  await expect(page.locator("#authSection")).toBeVisible();
  await expect(page.locator("#moduleSelectionSection")).toHaveClass(/auth-flow-mode/);
  await expect(page.locator("#authDescription")).toContainText("Dr.Vas Studio");
  expect(await page.evaluate(() => sessionStorage.getItem("drvas_pending_module"))).toBe("studio");
  await expect(page.locator("#chatSection")).toBeHidden();
});

for (const [moduleId, workspaceId] of [
  ["free", null],
  ["health", "healthWorkspace"],
  ["studio", "studioWorkspace"],
  ["academy", "academyWorkspace"],
  ["commerce", "commerceWorkspace"],
  ["business", "businessWorkspace"]
]) {
  test(`module card click opens the dedicated ${moduleId} workspace for the administrator`, async ({ page }) => {
    await openApp(page, "ro");
    await page.evaluate(() => {
      currentUser = { id: "e2e-founder", email: "founder@example.invalid" };
      isDrvasAdmin = true;
      showModuleSelection();
    });
    await page.locator(`[data-module="${moduleId}"]`).click();
    await expect(page.locator("#chatSection")).toBeVisible();
    await expect(page.locator("#chatWorkspaceTitle")).toContainText(
      ({free:"Dr.Vas Free",health:"Dr.Vas Health",studio:"Dr.Vas Studio",academy:"Dr.Vas Academy",commerce:"Dr.Vas Commerce",business:"Dr.Vas Business"})[moduleId]
    );
    if (workspaceId) await expect(page.locator(`#${workspaceId}`)).toBeVisible();
    await expect(page.locator(".chat-back-button")).toBeVisible();
    await expect(page.locator(".chat-logout-button")).toBeVisible();
    expect(await page.evaluate(() => document.body.classList.contains("module-workspace-mode"))).toBe(true);
    if (moduleId === "free") expect(await page.evaluate(() => document.body.classList.contains("free-module-mode"))).toBe(true);
  });
}

test("successful administrator sign-in opens the exact module selected before authentication", async ({ page }) => {
  await openApp(page, "ro");
  const modules = [
    ["free", "Dr.Vas Free"],
    ["health", "Dr.Vas Health"],
    ["studio", "Dr.Vas Studio"],
    ["academy", "Dr.Vas Academy"],
    ["commerce", "Dr.Vas Commerce"],
    ["business", "Dr.Vas Business"]
  ];

  await page.evaluate(() => {
    refreshAdminPanel = async () => { isDrvasAdmin = true; };
    loadStudioProjects = async () => {};
    loadModuleProjectList = async () => {};
    loadIncomeOpportunities = async () => {};
    loadConversationList = async () => [];
  });

  for (const [module, title] of modules) {
    await page.evaluate(selected => {
      sessionStorage.setItem("drvas_pending_module", selected);
      return showChat({ id: "e2e-authenticated-admin", email: "owner@example.invalid" }, "Administrator");
    }, module);
    await expect(page.locator("#chatSection")).toBeVisible();
    await expect(page.locator("#chatWorkspaceTitle")).toContainText(title);
    if (module === "free") await expect(page.locator("#moduleSelectionShell")).toBeHidden();
    else await expect(page.locator("#moduleSelectionShell")).toBeVisible();
    await expect(page.locator("#moduleSelectionSection")).not.toHaveClass(/auth-flow-mode/);
    await expect(page.locator("#moduleSelectionSection [data-module='" + module + "']")).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => sessionStorage.getItem("drvas_pending_module"))).toBeNull();
    if (module === "free") {
      await expect(page.locator("#chatSection")).toBeVisible();
      expect(await page.evaluate(() => document.body.classList.contains("free-module-mode"))).toBe(true);
    } else {
      await expect(page.locator("#" + module + "Workspace")).toBeVisible();
    }
  }
});

test("sign-in with a non-admin account never opens a pending private module", async ({ page }) => {
  await openApp(page, "ro");
  const modules = ["free", "health", "studio", "academy", "commerce", "business"];
  await page.evaluate(() => {
    refreshAdminPanel = async () => { isDrvasAdmin = false; };
    loadStudioProjects = async () => {};
    loadModuleProjectList = async () => {};
    loadIncomeOpportunities = async () => {};
    loadConversationList = async () => [];
  });

  for (const module of modules) {
    await page.evaluate(selected => {
      sessionStorage.setItem("drvas_pending_module", selected);
      return showChat({ id: "e2e-standard-user", email: "member@example.invalid" }, "Member");
    }, module);
    await expect(page.locator("#moduleSelectionShell")).toBeVisible();
    await expect(page.locator("#moduleAccessMessage")).toContainText("pilot privat");
    await expect(page.locator("#chatSection")).toBeHidden();
    for (const workspace of ["health", "studio", "academy", "commerce", "business"]) {
      await expect(page.locator("#" + workspace + "Workspace")).toBeHidden();
    }
    expect(await page.evaluate(() => sessionStorage.getItem("drvas_pending_module"))).toBeNull();
  }
});

test("text chat sends the selected module context to the Worker for all six modules", async ({ page }) => {
  await openApp(page, "ro", {
    access_token: "e2e-access-token",
    user: { id: "e2e-chat-user", email: "owner@example.invalid" }
  });
  const sentRequests = [];
  await page.route(/dr--vas-ai/, async route => {
    const body = route.request().postDataJSON() || {};
    if (body.action === "client_event") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
      return;
    }
    sentRequests.push(body);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ reply: "Răspuns contextual de test." }) });
  });

  await page.evaluate(() => {
    saveMessage = async () => {};
    loadConversationList = async () => [];
    loadModuleProjectList = async () => [];
    logClientEvent = () => {};
    loadStudioProjects = async () => [];
    loadBusinessLedger = async () => {};
    loadStudentAssessmentProjects = async () => [];
  });
  const modules = ["free", "health", "studio", "academy", "commerce", "business"];
  for (const module of modules) {
    await page.evaluate(selected => {
      currentUser = { id: "e2e-chat-user", email: "owner@example.invalid" };
      isDrvasAdmin = true;
      showModuleSelection();
      selectModule(selected, true);
      currentConversationId = crypto.randomUUID();
      conversationSaved = false;
      pendingMessages = [];
      isSendingMessage = false;
    }, module);
    await page.locator("#question").fill("Ajută-mă cu următorul pas.");
    await page.evaluate(() => send());
    await expect(page.locator("#chat .msg.bot").last()).toContainText("Răspuns contextual de test.");
    const request = sentRequests[sentRequests.length - 1];
    expect(request.module).toBe(module);
    expect(request.access_token).toBe("e2e-access-token");
    expect(request.message).toBe("Ajută-mă cu următorul pas.");
  }
  expect(sentRequests).toHaveLength(6);
});

test("mobile Free chat stays simple and offers only module navigation and logout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-mobile-user", email: "mobile@example.invalid" };
    isDrvasAdmin = true;
    showModuleSelection();
    selectModule("free", true);
  });

  await expect(page.locator("#chatSection")).toBeVisible();
  await expect(page.locator("#question")).toBeVisible();
  await expect(page.locator(".chat-back-button")).toBeVisible();
  await expect(page.locator(".chat-logout-button")).toBeVisible();
  await expect(page.locator(".chat-history-toggle")).toBeHidden();
  await expect(page.locator(".assistant-switcher")).toBeHidden();
  await expect(page.locator(".chat-module-rail")).toBeHidden();
  await page.locator(".chat-back-button").click();
  await expect(page.locator("#chatSection")).toBeHidden();
  await expect(page.locator("#moduleSelectionShell")).toBeVisible();
});

test("landing CTA opens the module chooser without skipping the presentation", async ({ page }) => {
  await openApp(page, "ro");
  await page.locator("#headerChatCta").click();
  await expect(page.locator("#moduleSelectionShell")).toBeVisible();
  await expect(page.locator('[data-module]')).toHaveCount(6);
  await expect(page.locator("#chatSection")).toBeHidden();
});

test("all six modules remain private to administrators during the pilot", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-standard-user", email: "standard@example.invalid" };
    isDrvasAdmin = false;
    showModuleSelection();
  });

  for (const moduleId of ["free", "health", "studio", "academy", "commerce", "business"]) {
    await page.evaluate(id => selectModule(id, true), moduleId);
    await expect(page.locator("#moduleAccessMessage")).toContainText("pilot privat");
  }
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
  await expect(page.locator("#chatSection")).toBeVisible();
  await expect(page.locator("#question")).toBeVisible();
  await expect(page.locator("#question")).toHaveValue(/DR.VAS ACADEMY/);
  await expect(page.locator("#question")).toHaveValue(/Bazele comerțului online/);
  await page.evaluate(() => goToModules());

  await page.evaluate(() => selectModule("commerce", true));
  await expect(page.locator("#commerceWorkspace")).toBeVisible();
  await page.locator("#commerceProduct").fill("Organizatoare pentru casă");
  await page.locator("#commerceBudget").fill("100");
  await page.locator("#commerceBrief").fill("Fără stoc mare la început.");
  await page.locator('#commerceWorkspace button[onclick="buildCommercePrompt()"]').click();
  await expect(page.locator("#question")).toHaveValue(/DR.VAS COMMERCE/);
  await expect(page.locator("#question")).toHaveValue(/BUGET MAXIM: 100/);
  await page.evaluate(() => goToModules());

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

test("Studio creates a branded MP4 render request and restores a private completed preview", async ({ page }) => {
  const session = {
    access_token: "e2e-studio-token",
    user: { id: "e2e-studio-user", email: "admin@example.invalid" }
  };
  await openApp(page, "ro", session);
  let createPayload = null;
  await page.route("https://dr--vas-ai.vasilecatalinprodan.workers.dev/**", async route => {
    const body = route.request().postDataJSON();
    if (body.action === "studio_render_create") {
      createPayload = body;
      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, job_id: "11111111-1111-4111-8111-111111111111", render_id: "render-e2e", status: "planned", duration: 9, output_format: "mp4" })
      });
    } else if (body.action === "studio_render_status") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, job_id: body.job_id, status: "stored", storage_path: "e2e-studio-user/render-e2e.mp4", duration: 9, output_format: "mp4" })
      });
    } else {
      await route.continue();
    }
  });
  await page.evaluate(() => {
    currentUser = { id: "e2e-studio-user", email: "admin@example.invalid" };
    isDrvasAdmin = true;
    supabaseClient.storage = {
      from: () => ({
        upload: async () => ({ data: { path: "e2e-studio-user/studio-assets/voice.mp3" }, error: null }),
        createSignedUrl: async () => ({ data: { signedUrl: "https://media.example.invalid/final.mp4" }, error: null })
      })
    };
    selectModule("studio", true);
  });
  await expect(page.locator("#studioWorkspace")).toBeVisible();
  await expect(page.locator("#studioRenderTitle")).toBeVisible();
  await expect(page.locator("#studioProjectStatus")).toContainText("Studio este pregătit");
  await page.locator("#studioSceneAudio").setInputFiles({
    name: "voice.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("e2e-audio")
  });
  await page.locator("#studioProjectTitle").fill("Dr.Vas — primul teaser");
  await page.evaluate(async () => { await renderStudioVideo(); });
  await expect(page.locator("#studioRenderStatus")).toContainText("Randarea a pornit");
  expect(createPayload.action).toBe("studio_render_create");
  expect(createPayload.render_script.output_format).toBe("mp4");
  expect(createPayload.render_script.width).toBe(1080);
  expect(createPayload.render_script.height).toBe(1920);
  expect(createPayload.render_script.duration).toBe(9);
  expect(createPayload.render_script.elements).toHaveLength(4);
  expect(createPayload.render_script.elements.some(element => element.type === "audio" && element.name === "Studio-Voiceover")).toBe(true);

  await page.evaluate(async () => { await checkStudioRenderStatus(); });
  await expect(page.locator("#studioRenderPreview")).toBeVisible();
  await expect(page.locator("#studioRenderDownload")).toBeVisible();
  await expect(page.locator("#studioRenderDownload")).toHaveAttribute("href", /media\.example\.invalid\/final\.mp4/);
});


test("Business workspace exposes the cashbook and Student Desk with working VAT maths and academic feedback brief", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-business-user", email: "admin@example.invalid" };
    isDrvasAdmin = true;
    selectModule("business", true);
  });
  await expect(page.locator("#businessWorkspace")).toBeVisible();
  await expect(page.locator("#businessCashbookTitle")).toBeVisible();
  await expect(page.locator("#businessAssessmentTitle")).toBeVisible();

  const accounting = await page.evaluate(() => {
    businessLedgerState.rows = [
      { id: "income-1", currency: "GBP", entry_type: "income", amount: 120, vat_rate: 20, vat_included: true, transaction_date: "2026-11-04", description: "Client payment", category: "Sales" },
      { id: "expense-1", currency: "GBP", entry_type: "expense", amount: 60, vat_rate: 20, vat_included: true, transaction_date: "2026-11-04", description: "Materials", category: "Supplies" }
    ];
    renderBusinessLedger();
    return {
      income: document.querySelector("#businessLedgerIncome").textContent,
      expenses: document.querySelector("#businessLedgerExpenses").textContent,
      net: document.querySelector("#businessLedgerNet").textContent,
      vat: document.querySelector("#businessLedgerVat").textContent,
      rows: document.querySelectorAll("#businessLedgerRows tbody tr").length
    };
  });
  expect(accounting.income).toContain("120");
  expect(accounting.expenses).toContain("60");
  expect(accounting.net).toContain("60");
  expect(accounting.vat).toContain("10");
  expect(accounting.rows).toBe(2);

  await page.locator("#businessFixedCosts").fill("1000");
  await page.locator("#businessUnitPrice").fill("50");
  await page.locator("#businessVariableCost").fill("25");
  await page.locator("#businessExpectedUnits").fill("50");
  await expect(page.locator("#businessBreakEvenUnits")).toContainText("40");
  await expect(page.locator("#businessBreakEvenRevenue")).toContainText("2,000");
  await expect(page.locator("#businessContributionMargin")).toContainText("50.0%");
  await expect(page.locator("#businessExpectedProfit")).toContainText("250");

  await page.locator("#studentAssessmentSubject").fill("Business Management");
  await page.locator("#studentAssessmentBrief").fill("Evaluate a business strategy using evidence.");
  await page.locator("#studentAssessmentDraft").fill("My draft explains the strategy and its limitations.");
  await page.locator("#studentAssessmentRubric").fill("Analysis 40%, evidence 30%, structure 30%.");
  await page.locator('#businessWorkspace button[onclick="buildStudentAssessmentPrompt()"]').click();
  await expect(page.locator("#chatSection")).toBeVisible();
  await expect(page.locator("#question")).toBeVisible();
  await expect(page.locator("#question")).toHaveValue(/DR.VAS STUDENT DESK/);
  await expect(page.locator("#question")).toHaveValue(/nu rescrie integral lucrarea/i);
});

test("non-admin users cannot open any of the six private pilot workspaces", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-standard-user", email: "standard@example.invalid" };
    isDrvasAdmin = false;
  });
  for (const moduleId of ["free", "health", "studio", "academy", "commerce", "business"]) {
    await page.evaluate(id => selectModule(id, true), moduleId);
    await expect(page.locator("#moduleAccessMessage")).toContainText("pilot privat");
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
    await page.locator("#" + item.id + "ProjectTitle").fill(item.title);
    await page.locator("#" + item.primary).fill(item.value);
    await expect(page.locator("#" + item.primary)).toHaveValue(item.value);
    await page.evaluate(({ id, primary, value }) => {
      const field = document.getElementById(primary);
      if (!field || field.value.trim() !== value) throw new Error("Primary project field is empty before save: " + primary + " = " + (field?.value ?? "<missing>"));
      return saveModuleProject(id);
    }, { id: item.id, primary: item.primary, value: item.value });
    await expect(page.locator("#" + item.id + "ProjectStatus")).toContainText("salvat");
    await expect(page.locator("#" + item.id + "ProjectList option")).toHaveCount(2);

    await page.locator("#" + item.primary).fill("Valoare modificată");
    await page.evaluate(id => openModuleProject(id), item.id);
    await expect(page.locator("#" + item.primary)).toHaveValue(item.value);

    page.once("dialog", dialog => dialog.accept());
    await page.evaluate(id => deleteModuleProject(id), item.id);
    await expect(page.locator("#" + item.id + "ProjectList option")).toHaveCount(1);
  }

  await page.evaluate(() => selectModule("business", true));
  await page.locator("#studentAssessmentSubject").fill("Business Management");
  await page.locator("#studentAssessmentBrief").fill("Assess a business strategy using evidence.");
  await page.locator("#studentAssessmentRubric").fill("Analysis 40%, evidence 30%, structure 30%.");
  await page.locator("#studentAssessmentDraft").fill("Original student draft for feedback.");
  await page.locator("#studentAssessmentProjectTitle").fill("Student assessment pilot");
  await expect(page.locator("#studentAssessmentSubject")).toHaveValue("Business Management");
  await expect(page.locator("#studentAssessmentBrief")).toHaveValue("Assess a business strategy using evidence.");
  await page.evaluate(() => {
    const brief = studentAssessmentBriefData();
    if (!brief.subject || !brief.assignment) throw new Error("Student Desk form state missing: " + JSON.stringify(brief));
    return saveStudentAssessmentProject();
  });
  await expect(page.locator("#studentAssessmentProjectStatus")).toContainText("salvat");
  await expect(page.locator("#studentAssessmentProjectList option")).toHaveCount(2);
  await page.locator("#studentAssessmentDraft").fill("Changed draft text.");
  await page.evaluate(() => openStudentAssessmentProject());
  await expect(page.locator("#studentAssessmentDraft")).toHaveValue("Original student draft for feedback.");
  page.once("dialog", dialog => dialog.accept());
  await page.evaluate(() => deleteStudentAssessmentProject());
  await expect(page.locator("#studentAssessmentProjectList option")).toHaveCount(1);
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
    currentStudioRenderJobId = "private-render-job";
    currentStudioRenderStoragePath = "private/render.mp4";
    document.querySelector("#studioRenderPreview").hidden = false;
    document.querySelector("#studioSceneAudio").value = "";
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
    privateConsent: document.querySelector("#privateProfileConsent").checked,
    renderJobId: currentStudioRenderJobId,
    renderPath: currentStudioRenderStoragePath,
    renderPreviewHidden: document.querySelector("#studioRenderPreview").hidden
  }));
  expect(state.user).toBeNull();
  expect(state.admin).toBe(false);
  expect(state.projectId).toBeNull();
  expect(state.output).toBe("");
  expect(state.title).toBe("");
  expect(state.idea).toBe("");
  expect(state.privateName).toBe("");
  expect(state.privateConsent).toBe(false);
  expect(state.renderJobId).toBeNull();
  expect(state.renderPath).toBe("");
  expect(state.renderPreviewHidden).toBe(true);
});
