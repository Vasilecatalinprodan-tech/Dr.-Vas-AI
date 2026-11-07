const { test, expect } = require("@playwright/test");

const SUPABASE_STUB = `
window.supabase = {
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: window.__DRVAS_E2E_SESSION__ || null }, error: null }),
      onAuthStateChange: callback => {
        // Match Supabase's asynchronous initial event and exercise the race with checkSession().
        setTimeout(() => callback("INITIAL_SESSION", window.__DRVAS_E2E_SESSION__ || null), 0);
        return { data: { subscription: { unsubscribe() {} } } };
      }
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
  // Wait for initLanguage() to finish before exercising controls guarded by languageReady.
  await page.waitForFunction(() => document.documentElement.lang === "ro" && !document.querySelector("#appMain")?.classList.contains("language-pending"));
}

test("universal chat uploader accepts private images and documents and requires Health consent", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-attachment-user" };
    activeModule = "health";
    // The uploader lives inside chatSection; make its real workspace visible
    // so the test checks the pending-file UI rather than a hidden ancestor.
    document.querySelector("#chatSection").classList.remove("hidden");
    renderPendingChatFiles();
  });
  const picker = page.locator("#chatFileInput");
  await picker.evaluate(input => input.addEventListener("change", () => {
    window.__DRVAS_E2E_SELECTED_FILES__ = Array.from(input.files || []).map(file => ({ name: file.name, type: file.type, size: file.size }));
  }, { capture: true, once: true }));
  await picker.setInputFiles([
    { name: "blood-results.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 E2E") },
    { name: "scan.png", mimeType: "image/png", buffer: Buffer.from("png-e2e") }
  ]);
  const selectedFiles = await page.evaluate(() => window.__DRVAS_E2E_SELECTED_FILES__ || []);
  expect(selectedFiles).toHaveLength(2);
  const pendingFiles = await page.evaluate(() => pendingChatFiles.map(file => ({ name: file.name, type: file.type, size: file.size })));
  expect(pendingFiles).toHaveLength(2);
  await expect(page.locator("#pendingChatFiles")).toBeVisible();
  await expect(page.locator("#pendingChatFiles")).toContainText("blood-results.pdf");
  await expect(page.locator("#pendingChatFiles")).toContainText("scan.png");
  await expect(page.locator("#fileProcessingConsentWrap")).toBeVisible();
  await expect(page.locator("#healthDataProcessingConsentWrap")).toBeVisible();
  await page.locator("#fileProcessingConsent").check();
  await page.locator("#healthDataProcessingConsent").check();
  await page.evaluate(() => {
    activeModule = "free";
    renderPendingChatFiles();
  });
  await expect(page.locator("#healthDataProcessingConsentWrap")).toBeHidden();
  await expect(page.locator("#fileProcessingConsentWrap")).toBeVisible();
  await page.locator("#pendingChatFiles button").first().click();
  await expect(page.locator("#pendingChatFiles")).toContainText("scan.png");
  await expect(page.locator("#pendingChatFiles")).not.toContainText("blood-results.pdf");
  await page.locator("#pendingChatFiles button").first().click();
  await expect(page.locator("#pendingChatFiles")).toBeHidden();
  await expect(page.locator("#fileProcessingConsentWrap")).toBeHidden();
});

test("chat attachment picker rejects unsupported files, more than five files and files above 15 MB", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-attachment-user" };
    activeModule = "free";
    document.querySelector("#chatSection").classList.remove("hidden");
    window.__DRVAS_E2E_ALERTS__ = [];
    window.alert = message => window.__DRVAS_E2E_ALERTS__.push(String(message));
    renderPendingChatFiles();
  });
  const picker = page.locator("#chatFileInput");
  await picker.setInputFiles(Array.from({ length: 6 }, (_, index) => ({
    name: `file-${index + 1}.pdf`,
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 test")
  })));
  expect(await page.evaluate(() => pendingChatFiles.length)).toBe(0);
  expect(await page.evaluate(() => window.__DRVAS_E2E_ALERTS__.at(-1))).toContain("maximum 5");

  await picker.setInputFiles({
    name: "malware.exe",
    mimeType: "application/x-msdownload",
    buffer: Buffer.from("not a supported document")
  });
  expect(await page.evaluate(() => pendingChatFiles.length)).toBe(0);
  expect(await page.evaluate(() => window.__DRVAS_E2E_ALERTS__.at(-1))).toContain("Format neacceptat");

  await picker.setInputFiles({
    name: "oversized.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(15 * 1024 * 1024 + 1, 65)
  });
  expect(await page.evaluate(() => pendingChatFiles.length)).toBe(0);
  expect(await page.evaluate(() => window.__DRVAS_E2E_ALERTS__.at(-1))).toContain("maximum 15 MB");

  await picker.setInputFiles({
    name: "valid.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Dr.Vas attachment boundary test")
  });
  expect(await page.evaluate(() => pendingChatFiles.map(file => file.name))).toEqual(["valid.txt"]);
  await expect(page.locator("#pendingChatFiles")).toContainText("valid.txt");
});

test("users can review and withdraw file-processing consent from their profile", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-consent-user", email: "consent@example.invalid" };
    showOnly("profileSection");
    document.querySelector("#fileProcessingPrivacyPanel").open = true;
    window.__DRVAS_CONSENT_CALLS__ = [];
    window.confirm = () => true;
    privateProfileRequest = async (action, extra = {}) => {
      window.__DRVAS_CONSENT_CALLS__.push({ action, ...extra });
      if (action === "file_processing_consent_get") {
        return {
          ok: true,
          file_processing_granted: true,
          health_data_processing_granted: true
        };
      }
      if (action === "file_processing_consent" && extra.granted === false) {
        return { ok: true, recorded: true, granted: false, revoked: true };
      }
      throw new Error("Unexpected consent action: " + action);
    };
  });

  await page.evaluate(() => loadFileProcessingConsent(currentUser));
  await expect(page.locator("#fileProcessingConsentStatus")).toContainText("Acord activ");
  await expect(page.locator("#revokeFileProcessingConsentButton")).toBeEnabled();

  await page.locator("#revokeFileProcessingConsentButton").click();
  await expect(page.locator("#fileProcessingConsentStatus")).toContainText("Acord retras");
  await expect(page.locator("#revokeFileProcessingConsentButton")).toBeDisabled();
  const state = await page.evaluate(() => ({
    calls: window.__DRVAS_CONSENT_CALLS__,
    generalCheckbox: document.querySelector("#fileProcessingConsent").checked,
    healthCheckbox: document.querySelector("#healthDataProcessingConsent").checked
  }));
  expect(state.calls.map(call => call.action)).toEqual(["file_processing_consent_get", "file_processing_consent"]);
  expect(state.calls[1].granted).toBe(false);
  expect(state.generalCheckbox).toBe(false);
  expect(state.healthCheckbox).toBe(false);
});

test("first visit shows the Dr.Vas landing page, language selector and clear entry CTA", async ({ page }) => {
  await openApp(page);
  await expect(page.locator("#languageGate")).toBeVisible();
  await expect(page.locator("#heroSection")).toBeVisible();
  await expect(page.locator("#landingActions")).toBeVisible();
  await expect(page.locator("#heroChatCta")).toContainText("Vorbește cu Dr.Vas");
  await expect(page.locator("#moduleSelectionShell")).toBeHidden();
  await expect(page.locator("#appMain")).not.toHaveClass(/language-pending/);
});

test("primary Dr.Vas CTA is above the hero description and sends visitors to login first", async ({ page }) => {
  await openApp(page, "ro");
  await expect(page.locator("#heroSection")).toBeVisible();
  await expect(page.locator("#languageGate")).toBeVisible();
  await expect(page.locator("#moduleSelectionShell")).toBeHidden();
  const order = await page.evaluate(() => {
    const button = document.querySelector("#heroChatCta");
    const description = document.querySelector("#heroSection .hero-content p");
    return button.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING;
  });
  expect(order).toBeTruthy();
  await page.locator("#headerChatCta").click();
  await expect(page.locator("#authSection")).toBeVisible();
  await expect(page.locator("#moduleSelectionShell")).toBeVisible();
  await expect(page.locator("#moduleSelectionSection")).toBeVisible();
  await expect(page.locator("#moduleSelectionSection > .modules-heading")).toBeHidden();
  await expect(page.locator("#moduleSelectionShell")).toHaveClass(/auth-flow-mode/);
  expect(await page.evaluate(() => sessionStorage.getItem("drvas_pending_entry"))).toBe("modules");
  await expect(page.locator("#chatSection")).toBeHidden();
});

test("successful login returns the visitor to the module chooser", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(async () => {
    sessionStorage.setItem("drvas_pending_entry", "modules");
    window.refreshAdminPanel = async () => { isDrvasAdmin = true; };
    window.loadConversationList = async () => [];
    window.loadStudioProjects = async () => [];
    window.loadModuleProjectList = async () => [];
    window.showChat({ id: "e2e-entry-user", email: "founder@example.invalid" }, "E2E");
  });
  await expect(page.locator("#moduleSelectionShell")).toBeVisible();
  await expect(page.locator("#moduleSelectionSection")).not.toHaveClass(/auth-flow-mode/);
  await expect(page.locator("#chatSection")).toBeHidden();
});

test("signed-in workspace header masks the founder's personal name and email", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(async () => {
    window.refreshAdminPanel = async () => { isDrvasAdmin = true; };
    window.loadConversationList = async () => [];
    window.loadStudioProjects = async () => [];
    window.loadModuleProjectList = async () => [];
    await showChat(
      { id: "e2e-identity-mask-user", email: "private-founder@example.invalid" },
      "Vasile-Cătălin Prodan"
    );
  });
  await expect(page.locator("#accountEmail")).toContainText("Cont administrator");
  await expect(page.locator("#accountEmail")).not.toContainText("private-founder@example.invalid");
  await expect(page.locator("#accountEmail")).not.toContainText("Vasile-Cătălin Prodan");
});

test("showChat resumes the last selected module instead of returning to the landing page", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    if (typeof window.showChat !== "function") throw new Error("showChat() is not exposed for browser regression testing");
    localStorage.setItem("drvas_active_module:e2e-session-user", "health");
    window.refreshAdminPanel = async () => { isDrvasAdmin = false; };
    window.loadConversationList = async () => [];
    window.showChat({ id: "e2e-session-user", email: "e2e@example.invalid" }, "E2E");
  });
  await expect(page.locator("#chatSection")).toBeVisible();
  await expect(page.locator("#healthWorkspace")).toBeVisible();
  await expect(page.locator("#heroSection")).toBeHidden();
  await expect(page.locator("#moduleSelectionStatus")).toBeHidden();
  expect(await page.evaluate(() => activeModule)).toBe("health");
});

test("last selected module is remembered per account and cleared on logout", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-returning-user" };
    rememberActiveModule("health");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.lang === "ro" &&
    !document.querySelector("#appMain")?.classList.contains("language-pending"));
  const remembered = await page.evaluate(() => {
    currentUser = { id: "e2e-returning-user" };
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

test("persisted Supabase session keeps the profile screen isolated when profile loading fails", async ({ page }) => {
  page.once("dialog", dialog => dialog.accept());
  await openApp(page, "ro", {
    access_token: "e2e-access-token",
    user: { id: "e2e-session-user", email: "e2e@example.invalid" }
  }, true);

  await expect(page.locator("#profileMessage")).toContainText("E2E profile read failure");
  await expect(page.locator("#profileSection")).toBeVisible();
  await expect(page.locator("#heroSection")).toBeHidden();
  await expect(page.locator("#moduleSelectionShell")).toBeVisible();
  await expect(page.locator("#moduleSelectionSection")).toBeVisible();
  await expect(page.locator("#moduleSelectionSection > .modules-heading")).toBeHidden();
  await expect(page.locator("#moduleSelectionShell")).toHaveClass(/auth-flow-mode/);
  await expect(page.locator("#chatSection")).toBeHidden();
});

test("private module selection explains future paid access without showing an administrator error", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-regular-user", email: "visitor@example.invalid" };
    isDrvasAdmin = false;
    refreshAdminPanel = async () => { isDrvasAdmin = false; return false; };
    showModuleSelection();
  });
  await page.locator('[data-module="studio"]').click();
  await expect(page.locator("#moduleSelectionStatus")).toBeVisible();
  await expect(page.locator("#moduleSelectionStatus")).toContainText("Premium și momentan privat");
  await expect(page.locator("#moduleSelectionStatus")).not.toContainText("administrator");
  await expect(page.locator("#adminAccessNotice")).toBeHidden();
});

test("desktop module opens one isolated full-width workspace without the global module rail", async ({ page }) => {
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
  await expect(page.locator("#moduleSelectionSection > .modules-grid")).toBeHidden();
  await expect(page.locator(".chat-module-rail")).toBeHidden();
  await expect(page.locator("#question")).toBeVisible();
  await expect(page.locator("#globalBackToModules")).toBeVisible();
  await expect(page.locator("#globalBackToModules")).toContainText("Înapoi la module");
  await expect(page.locator("#globalLogoutTop")).toBeVisible();
  await expect(page.locator("#globalLogoutBottom")).toBeVisible();
  await expect(page.locator(".chat-module-rail")).toBeHidden();
  expect(await page.evaluate(() => document.body.classList.contains("module-workspace-mode"))).toBe(true);
  const layout = await page.locator("main").evaluate(node => getComputedStyle(node).gridTemplateColumns);
  expect(layout.trim().split(/\s+/)).toHaveLength(1);
});

test("each premium module shows only its own tools and keeps the other module workspaces hidden", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, "ro");
  const modules = ["health", "studio", "academy", "commerce", "business"];
  await page.evaluate(() => {
    currentUser = { id: "e2e-isolated-user", email: "admin@example.invalid" };
    isDrvasAdmin = true;
    showModuleSelection();
  });

  for (const moduleName of modules) {
    await page.evaluate(name => selectModule(name, true), moduleName);
    await expect(page.locator("#moduleSelectionSection > .modules-grid")).toBeHidden();
    await expect(page.locator(".chat-module-rail")).toBeHidden();
    await expect(page.locator("#chatSection .history-panel")).toBeVisible();
    await expect(page.locator("#globalLogoutTop")).toBeVisible();
    await expect(page.locator("#globalLogoutBottom")).toBeVisible();
    for (const otherModule of modules) {
      const workspace = page.locator("#" + otherModule + "Workspace");
      if (otherModule === moduleName) await expect(workspace).toBeVisible();
      else await expect(workspace).toBeHidden();
    }
    const columns = await page.locator("main").evaluate(node => getComputedStyle(node).gridTemplateColumns);
    expect(columns.trim().split(/\s+/), moduleName + " must occupy one full-width column").toHaveLength(1);
  }
});

test("public signed-in users can enter Dr.Vas Free without administrator privileges", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-public-free-user", email: "public-user@example.invalid" };
    isDrvasAdmin = false;
    showModuleSelection();
    selectModule("free", true);
  });
  await expect(page.locator("#chatSection")).toBeVisible();
  await expect(page.locator("#question")).toBeVisible();
  await expect(page.locator("#globalLogoutTop")).toBeVisible();
  await expect(page.locator("#globalLogoutBottom")).toBeVisible();
  await expect(page.locator("#moduleSelectionStatus")).toBeHidden();
  await expect(page.locator("#adminPanel")).toBeHidden();
  expect(await page.locator("body").evaluate(node => node.classList.contains("free-module-mode"))).toBeTruthy();
});

test("public signed-in users can enter Dr.Vas Health without administrator privileges", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-public-health-user", email: "public-user@example.invalid" };
    isDrvasAdmin = false;
    showModuleSelection();
    selectModule("health", true);
  });
  await expect(page.locator("#chatSection")).toBeVisible();
  await expect(page.locator("#healthWorkspace")).toBeVisible();
  await expect(page.locator("#studioWorkspace")).toBeHidden();
  await expect(page.locator("#moduleSelectionStatus")).toBeHidden();
  await expect(page.locator("#adminPanel")).toBeHidden();
  await expect(page.locator("#adminAccessNotice")).toBeHidden();
  expect(await page.locator("body").evaluate(node => node.classList.contains("module-workspace-mode"))).toBeTruthy();
  expect(await page.evaluate(() => isDrvasAdmin)).toBeFalsy();
});

test("public non-admin can prepare a Health question from the mobile workspace", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-mobile-health-user", email: "mobile-user@example.invalid" };
    isDrvasAdmin = false;
    showModuleSelection();
    selectModule("health", true);
  });

  await expect(page.locator("#healthWorkspace")).toBeVisible();
  await expect(page.locator("#chatSection")).toBeVisible();
  await expect(page.locator(".chat-module-rail")).toBeHidden();
  await expect(page.locator("#healthWorkspace")).toContainText("nu stabilește diagnostice");
  await expect(page.locator("#adminPanel")).toBeHidden();
  await page.locator("#healthBrief").fill("Aș dori să înțeleg ce înseamnă termenul din rezultatul meu.");
  await page.getByRole("button", { name: "Discută cu Dr.Vas Health" }).click();
  await expect(page.locator("#question")).toHaveValue(/DR\.VAS HEALTH — SPRIJIN INFORMATIV/);
  await expect(page.locator("#question")).toHaveValue(/nu formula diagnostic/);
  await expect(page.locator("#chatSection")).toBeVisible();
  expect(await page.evaluate(() => isDrvasAdmin)).toBeFalsy();
});

test("public signed-in users cannot open premium workspaces or gain administrator access", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-public-premium-user", email: "public-user@example.invalid" };
    isDrvasAdmin = false;
    refreshAdminPanel = async () => { isDrvasAdmin = false; return false; };
    showModuleSelection();
    selectModule("studio", true);
  });
  await expect(page.locator("#chatSection")).toBeHidden();
  await expect(page.locator("#studioWorkspace")).toBeHidden();
  await expect(page.locator("#moduleSelectionStatus")).toBeVisible();
  await expect(page.locator("#moduleSelectionStatus")).toContainText("Premium");
  expect(await page.evaluate(() => isDrvasAdmin)).toBeFalsy();
});

test("Dr.Vas Free keeps its existing clean chat while all dedicated module tools stay hidden", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-free-isolation-user", email: "admin@example.invalid" };
    isDrvasAdmin = true;
    showModuleSelection();
    selectModule("free", true);
  });
  await expect(page.locator("#chatSection")).toBeVisible();
  await expect(page.locator("#moduleSelectionShell")).toBeHidden();
  await expect(page.locator(".chat-module-rail")).toBeHidden();
  for (const id of ["healthWorkspace","studioWorkspace","academyWorkspace","commerceWorkspace","businessWorkspace"]) {
    await expect(page.locator("#" + id)).toBeHidden();
  }
  await expect(page.locator("#question")).toBeVisible();
});

test("legacy focused workspace never exposes other modules or cross-module history", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-focus-user", email: "focus@example.invalid" };
    isDrvasAdmin = true;
    showModuleSelection();
    selectModule("studio", true);
    document.body.classList.add("chat-focus-mode");
    document.documentElement.classList.add("chat-focus-document");
  });

  await expect(page.locator("#chatSection")).toBeVisible();
  await expect(page.locator(".chat-module-rail")).toBeHidden();
  await expect(page.locator("#chatSection .history-panel")).toBeVisible();
  const layout = await page.locator("#chatSection > .chat-layout").evaluate(node => {
    const value = getComputedStyle(node).gridTemplateColumns;
    let depth = 0;
    let inTrack = false;
    let count = 0;
    for (const character of value.trim()) {
      if (character === "(") depth++;
      if (character === ")") depth--;
      if (character.trim() === "" && depth === 0) {
        inTrack = false;
      } else if (!inTrack) {
        count++;
        inTrack = true;
      }
    }
    return { value, count };
  });
  expect(layout.count, `Expected the shared sidebar and one chat track, received "${layout.value}"`).toBe(2);
});

test("clicking a module as a visitor opens the sign-in gate and preserves the selected module", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => showModuleSelection());
  await page.locator('[data-module="studio"]').click();
  await expect(page.locator("#authSection")).toBeVisible();
  await expect(page.locator("#moduleSelectionShell")).toBeVisible();
  await expect(page.locator("#moduleSelectionSection")).toBeVisible();
  await expect(page.locator("#moduleSelectionSection > .modules-heading")).toBeHidden();
  await expect(page.locator("#moduleSelectionShell")).toHaveClass(/auth-flow-mode/);
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
    await expect(page.locator("#globalBackToModules")).toBeVisible();
    await expect(page.locator("#globalLogoutTop")).toBeVisible();
  await expect(page.locator("#globalLogoutBottom")).toBeVisible();
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

test("selected administrator module opens before slow conversation history finishes loading", async ({ page }) => {
  await openApp(page, "ro");
  const modules = ["free", "health", "studio", "academy", "commerce", "business"];
  await page.evaluate(() => {
    refreshAdminPanel = async () => { isDrvasAdmin = true; };
    loadConversationList = () => new Promise(() => {});
    loadStudioProjects = async () => {};
    loadModuleProjectList = async () => {};
    loadBusinessLedger = async () => {};
    loadStudentAssessmentProjects = async () => {};
    loadIncomeOpportunities = async () => {};
  });

  for (const module of modules) {
    await page.evaluate(selected => {
      sessionStorage.setItem("drvas_pending_module", selected);
      void showChat({ id: "e2e-slow-history-admin", email: "owner@example.invalid" }, "Administrator");
    }, module);
    await expect(page.locator("#chatSection")).toBeVisible();
    await expect(page.locator("#chatWorkspaceTitle")).toContainText(
      module === "free" ? "Dr.Vas Free" :
      module === "health" ? "Dr.Vas Health" :
      module === "studio" ? "Dr.Vas Studio" :
      module === "academy" ? "Dr.Vas Academy" :
      module === "commerce" ? "Dr.Vas Commerce" : "Dr.Vas Business"
    );
    if (module !== "free") await expect(page.locator("#" + module + "Workspace")).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("drvas_pending_module"))).toBeNull();
  }
});

test("ordinary accounts can open Free and Health after sign-in, while the four paid modules remain founder-only", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    refreshAdminPanel = async () => { isDrvasAdmin = false; };
    loadStudioProjects = async () => {};
    loadModuleProjectList = async () => {};
    loadIncomeOpportunities = async () => {};
    loadConversationList = async () => [];
    loadConversation = async () => {};
  });

  for (const module of ["free", "health"]) {
    await page.evaluate(selected => {
      sessionStorage.setItem("drvas_pending_module", selected);
      return showChat({ id: "e2e-standard-user", email: "member@example.invalid" }, "Member");
    }, module);
    await expect(page.locator("#chatSection")).toBeVisible();
    await expect(page.locator("#question")).toBeVisible();
    await expect(page.locator("#adminPanel")).toBeHidden();
    await expect(page.locator("#adminAccessNotice")).toBeHidden();
    if (module === "health") await expect(page.locator("#healthWorkspace")).toBeVisible();
    else await expect(page.locator("#healthWorkspace")).toBeHidden();
    expect(await page.evaluate(() => sessionStorage.getItem("drvas_pending_module"))).toBeNull();
    await page.evaluate(() => {
      document.querySelector("#chatSection")?.classList.add("hidden");
      document.body.classList.remove("module-workspace-mode", "free-module-mode");
    });
  }

  for (const module of ["studio", "academy", "commerce", "business"]) {
    await page.evaluate(selected => {
      sessionStorage.setItem("drvas_pending_module", selected);
      return showChat({ id: "e2e-standard-user", email: "member@example.invalid" }, "Member");
    }, module);
    await expect(page.locator("#moduleSelectionShell")).toBeVisible();
    await expect(page.locator("#moduleAccessMessage")).toContainText("privat");
    await expect(page.locator("#chatSection")).toBeHidden();
    expect(await page.evaluate(() => sessionStorage.getItem("drvas_pending_module"))).toBeNull();
  }
});

test("text chat request carries the selected module and Worker has dedicated module instructions", async ({ page }) => {
  await openApp(page, "ro");
  const requestBuilder = await page.evaluate(() => send.toString());
  expect(requestBuilder).toContain("module:moduleId");
  expect(requestBuilder).toContain("access_token:accessToken");
  expect(requestBuilder).toContain("conversation_id:conversationId");

  const workerSource = require("node:fs").readFileSync("worker/index.js", "utf8");
  for (const instruction of [
    "DR.VAS HEALTH — SPECIALIST MODE",
    "DR.VAS STUDIO — CREATIVE PRODUCTION ENGINE",
    "DR.VAS ACADEMY — PRACTICAL LEARNING ENGINE",
    "DR.VAS COMMERCE — ETHICAL E-COMMERCE",
    "DR.VAS BUSINESS — BUSINESS PLANNING"
  ]) {
    expect(workerSource).toContain(instruction);
  }
  expect(workerSource).toContain("Current selected module: ${moduleName}");
  expect(workerSource).toContain('const privatePilotModules = new Set(["studio", "academy", "commerce", "business"]);');
  expect(workerSource).not.toContain('const privatePilotModules = new Set(["health", "studio", "academy", "commerce", "business"]);');
});

test("mobile Free chat offers its sidebar drawer and logout", async ({ page }) => {
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
  await expect(page.locator("#globalBackToModules")).toBeVisible();
  await expect(page.locator("#globalLogoutTop")).toBeVisible();
  await expect(page.locator("#globalLogoutBottom")).toBeVisible();
  await expect(page.locator(".chat-history-toggle")).toBeVisible();
  await expect(page.locator(".assistant-switcher")).toBeHidden();
  await expect(page.locator(".chat-module-rail")).toBeHidden();
  await page.locator("#globalBackToModules").click();
  await expect(page.locator("#chatSection")).toBeHidden();
  await expect(page.locator("#moduleSelectionShell")).toBeVisible();
});

test("landing CTA sends visitors to authentication before showing private modules", async ({ page }) => {
  await openApp(page, "ro");
  await page.locator("#headerChatCta").click();
  await expect(page.locator("#authSection")).toBeVisible();
  await expect(page.locator("#moduleSelectionShell")).toBeVisible();
  await expect(page.locator("#moduleSelectionSection")).toBeVisible();
  await expect(page.locator("#moduleSelectionSection > .modules-heading")).toBeHidden();
  await expect(page.locator("#moduleSelectionShell")).toHaveClass(/auth-flow-mode/);
  await expect(page.locator("#chatSection")).toBeHidden();
  expect(await page.evaluate(() => sessionStorage.getItem("drvas_pending_entry"))).toBe("modules");
});

test("module chooser clearly separates two public free modules from four founder-only future paid modules", async ({ page }) => {
  await openApp(page, "ro");
  await expect(page.locator("#moduleSelectionSection > .modules-heading .status"))
    .toContainText("2 MODULE GRATUITE PENTRU PUBLIC");
  await expect(page.locator('[data-module="free"] .module-state')).toContainText("Gratuit");
  await expect(page.locator('[data-module="health"] .module-state')).toContainText("Gratuit");
  for (const moduleId of ["studio", "academy", "commerce", "business"]) {
    await expect(page.locator('[data-module="' + moduleId + '"] .module-state')).toContainText("privat");
  }

  await page.evaluate(() => {
    currentUser = { id: "e2e-standard-user", email: "standard@example.invalid" };
    isDrvasAdmin = false;
    refreshAdminPanel = async () => { isDrvasAdmin = false; return false; };
    showModuleSelection();
  });
  for (const moduleId of ["studio", "academy", "commerce", "business"]) {
    await page.evaluate(() => {
      document.querySelector("#chatSection")?.classList.add("hidden");
      document.body.classList.remove("module-workspace-mode", "free-module-mode");
    });
    await page.evaluate(id => selectModule(id, true), moduleId);
    await expect(page.locator("#moduleAccessMessage")).toContainText("privat");
    await expect(page.locator("#chatSection")).toBeHidden();
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

test("Sarah always selects a feminine device voice and never silently falls back to a masculine voice", async ({ page }) => {
  await openApp(page, "ro");
  const result = await page.evaluate(() => {
    const voices = [
      { name: "Microsoft Andrei", lang: "ro-RO", voiceURI: "andrei-ro", default: true },
      { name: "Microsoft Zira", lang: "ro-RO", voiceURI: "zira-ro" },
      { name: "Microsoft Alina", lang: "ro-RO", voiceURI: "alina-ro" },
      { name: "Google UK English Female", lang: "en-GB", voiceURI: "google-female" }
    ];
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => voices } });
    activeAssistant = "aurora";
    const chatVoice = chooseSpeechVoice("ro-RO");
    const presentation = getDrvasPresentationVoiceProfile(voices, "ro-RO");
    const noFemale = getDrvasPresentationVoiceProfile([voices[0]], "ro-RO");
    const crossLanguageVoices = [
      voices[0],
      { name: "Google UK English Female", lang: "en-GB", voiceURI: "google-female" }
    ];
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => crossLanguageVoices } });
    const crossLanguageChatVoice = chooseSpeechVoice("ro-RO");
    const crossLanguagePresentation = getDrvasPresentationVoiceProfile(crossLanguageVoices, "ro-RO");
    return {
      chatVoice: chatVoice?.voiceURI || null,
      presentationSarah: presentation.sarah?.voiceURI || null,
      presentationHasFemale: presentation.hasFemale,
      noFemaleSarah: noFemale.sarah?.voiceURI || null,
      crossLanguageChatVoice: crossLanguageChatVoice?.voiceURI || null,
      crossLanguagePresentationSarah: crossLanguagePresentation.sarah?.voiceURI || null,
      crossLanguageVoiceLanguage: crossLanguagePresentation.sarah?.lang || null
    };
  });
  expect(result.chatVoice).toBe("alina-ro");
  expect(result.presentationSarah).toBe("alina-ro");
  expect(result.presentationHasFemale).toBe(true);
  expect(result.noFemaleSarah).toBeNull();
  expect(result.crossLanguageChatVoice).toBe("google-female");
  expect(result.crossLanguagePresentationSarah).toBe("google-female");
  expect(result.crossLanguageVoiceLanguage).toBe("en-GB");
});

test("late portrait load callbacks cannot overwrite the currently selected presenter label", async ({ page }) => {
  await openApp(page, "ro");
  const result = await page.evaluate(() => {
    updateDrvasPresentationScene(0);
    const photo = document.querySelector("#presentationAvatar .presentation-photo");
    const staleLoad = photo.onload;
    updateDrvasPresentationScene(1);
    staleLoad?.call(photo);
    photo.setAttribute("alt", "Dr.Vas — fotografia fondatorului");
    return new Promise(resolve => requestAnimationFrame(() => resolve({ presenter: photo.dataset.presenter, alt: photo.getAttribute("alt") })));
  });
  expect(result.presenter).toBe("jan");
  expect(result.alt).toBe("Dr.Jan — personaj AI fictiv");
});

test("live voice room shows the selected assistant avatar and speaking animation for all three characters", async ({ page }) => {
  await openApp(page, "ro");
  const states = await page.evaluate(() => {
    const result = [];
    for (const [id, expectedName, expectedType] of [
      ["drvas", "Dr.Vas", "img"],
      ["jan", "Dr.Jan", "img"],
      ["aurora", "Sarah", "img"]
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
    expect(states[i].avatarType).toBe(["img", "img", "img"][i]);
  }
  for (const [id, alt] of [["jan", "Dr.Jan — portretul asistentului AI"], ["aurora", "Sarah — portretul asistentei AI"]]) {
    const portrait = page.locator('.assistant-choice[data-assistant="' + id + '"] img.assistant-avatar');
    await expect(portrait).toHaveAttribute("alt", alt);
    await expect.poll(() => portrait.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
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
  await expect(page.locator("#moduleSelectionShell")).toBeVisible();

  await page.evaluate(() => selectModule("commerce", true));
  await expect(page.locator("#activeModuleName")).toContainText("Commerce");
  await expect(page.locator("#commerceWorkspace")).toBeVisible();
  // Clear the previous module's unsent brief so this assertion proves the
  // Commerce builder itself replaced the field rather than retaining Academy text.
  await page.locator("#question").fill("");
  await page.locator("#commerceProduct").fill("Organizatoare pentru casă");
  await page.locator("#commerceBudget").fill("100");
  await page.locator("#commerceBrief").fill("Fără stoc mare la început.");
  await page.locator('#commerceWorkspace button[onclick="buildCommercePrompt()"]').click();
  await expect(page.locator("#question")).toHaveValue(/DR.VAS COMMERCE/);
  await expect(page.locator("#question")).toHaveValue(/BUGET MAXIM: 100/);
  await page.evaluate(() => goToModules());
  await expect(page.locator("#moduleSelectionShell")).toBeVisible();

  await page.evaluate(() => selectModule("business", true));
  await expect(page.locator("#activeModuleName")).toContainText("Business");
  await expect(page.locator("#businessWorkspace")).toBeVisible();
  await page.locator("#question").fill("");
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
  await openApp(page, "ro");
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
    supabaseClient.auth.getSession = async () => ({
      data: { session: { access_token: "e2e-studio-token" } },
      error: null
    });
    supabaseClient.storage = {
      from: () => ({
        upload: async () => ({ data: { path: "e2e-studio-user/studio-assets/voice.mp3" }, error: null }),
        createSignedUrl: async () => ({ data: { signedUrl: "https://media.example.invalid/final.mp4" }, error: null })
      })
    };
    selectModule("studio", true);
  });
  await expect(page.locator("#studioWorkspace")).toBeVisible();
  await page.locator('#studioWorkspace [data-feature="projects"]').click();
  await expect(page.locator("#studioProjectStatus")).toContainText("Studio este pregătit");
  await page.locator("#studioProjectTitle").fill("Dr.Vas — primul teaser");
  await page.locator('#studioWorkspace [data-feature="video"]').click();
  await expect(page.locator("#studioRenderTitle")).toBeVisible();
  await page.locator("#studioSceneAudio").setInputFiles({
    name: "voice.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("e2e-audio")
  });
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
  await page.locator('#businessWorkspace [data-feature="cashbook"]').click();
  await expect(page.locator("#businessCashbookTitle")).toBeVisible();

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

  await page.locator('#businessWorkspace [data-feature="break-even"]').click();
  await page.locator("#businessFixedCosts").fill("1000");
  await page.locator("#businessUnitPrice").fill("50");
  await page.locator("#businessVariableCost").fill("25");
  await page.locator("#businessExpectedUnits").fill("50");
  await expect(page.locator("#businessBreakEvenUnits")).toContainText("40");
  await expect(page.locator("#businessBreakEvenRevenue")).toContainText(/2[.,]000/);
  await expect(page.locator("#businessContributionMargin")).toContainText("50.0%");
  await expect(page.locator("#businessExpectedProfit")).toContainText("250");

  await page.locator('#businessWorkspace [data-feature="student"]').click();
  await expect(page.locator("#businessAssessmentTitle")).toBeVisible();
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

test("non-admin users can open public Free and Health but not the four future paid workspaces", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-standard-user", email: "standard@example.invalid" };
    isDrvasAdmin = false;
    refreshAdminPanel = async () => { isDrvasAdmin = false; return false; };
    showModuleSelection();
  });

  await page.evaluate(() => selectModule("free", true));
  await expect(page.locator("#chatSection")).toBeVisible();
  await expect(page.locator("#healthWorkspace")).toBeHidden();
  await page.evaluate(() => {
    document.querySelector("#chatSection")?.classList.add("hidden");
    document.body.classList.remove("module-workspace-mode", "free-module-mode");
    showModuleSelection();
    selectModule("health", true);
  });
  await expect(page.locator("#chatSection")).toBeVisible();
  await expect(page.locator("#healthWorkspace")).toBeVisible();

  for (const moduleId of ["studio", "academy", "commerce", "business"]) {
    await page.evaluate(() => {
      document.querySelector("#chatSection")?.classList.add("hidden");
      document.body.classList.remove("module-workspace-mode", "free-module-mode");
      showModuleSelection();
    });
    await page.evaluate(id => selectModule(id, true), moduleId);
    await expect(page.locator("#moduleSelectionStatus")).toContainText("privat");
    await expect(page.locator("#chatSection")).toBeHidden();
    await expect(page.locator("#" + moduleId + "Workspace")).toBeHidden();
  }
});

test("Academy, Commerce and Business projects are saved, reopened and deleted per user", async ({ page }) => {
  test.setTimeout(60000);
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
    console.log("[module-project] start", item.id);
    await page.evaluate(id => selectModule(id, true), item.id);
    await page.locator("#" + item.primary).fill(item.value);
    if (item.id === "academy") await page.locator('#academyWorkspace [data-feature="courses"]').click();
    if (item.id === "commerce") await page.locator('#commerceWorkspace [data-feature="projects"]').click();
    await page.locator("#" + item.id + "ProjectTitle").fill(item.title);
    await expect(page.locator("#" + item.primary)).toHaveValue(item.value);
    console.log("[module-project] reopened", item.id);
    await page.evaluate(({ id, primary, value }) => {
      const field = document.getElementById(primary);
      if (!field || field.value.trim() !== value) throw new Error("Primary project field is empty before save: " + primary + " = " + (field?.value ?? "<missing>"));
      return saveModuleProject(id);
    }, { id: item.id, primary: item.primary, value: item.value });
    await expect(page.locator("#" + item.id + "ProjectStatus")).toContainText("salvat");
    console.log("[module-project] saved", item.id);
    await expect(page.locator("#" + item.id + "ProjectList option")).toHaveCount(2);

    if (item.id === "academy") await page.locator('#academyWorkspace [data-feature="course"]').click();
    if (item.id === "commerce") await page.locator('#commerceWorkspace [data-feature="research"]').click();
    await page.locator("#" + item.primary).fill("Valoare modificată");
    if (item.id === "academy") await page.locator('#academyWorkspace [data-feature="courses"]').click();
    if (item.id === "commerce") await page.locator('#commerceWorkspace [data-feature="projects"]').click();
    await page.evaluate(id => openModuleProject(id), item.id);
    await expect(page.locator("#" + item.primary)).toHaveValue(item.value);

    page.once("dialog", dialog => dialog.accept());
    await page.evaluate(id => deleteModuleProject(id), item.id);
    await expect(page.locator("#" + item.id + "ProjectList option")).toHaveCount(1);
    console.log("[module-project] deleted", item.id);
  }

  // The Business workspace is already active after the project loop; open its separate Student Desk page before editing the assessment.
  await page.locator('#businessWorkspace [data-feature="student"]').click();
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

test("Bitcoin mining calculator estimates net result without starting mining", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    document.querySelector("#adminPanel")?.classList.remove("hidden");
    isDrvasAdmin = true;
    document.querySelector("#cryptoBtcPerDay").value = "0.0003";
    document.querySelector("#cryptoBtcPrice").value = "60000";
    document.querySelector("#cryptoPowerWatts").value = "1500";
    document.querySelector("#cryptoElectricityRate").value = "0.25";
    document.querySelector("#cryptoPoolFee").value = "1";
    document.querySelector("#cryptoHardwareCost").value = "1000";
    // Keep this legacy arithmetic case independent of the newly added downtime/tax assumptions.
    document.querySelector("#cryptoDowntime").value = "0";
    document.querySelector("#cryptoTaxReserve").value = "0";
    document.querySelector("#cryptoMaintenanceMonthly").value = "0";
    calculateCryptoMiningEconomics();
  });
  await expect(page.locator("#cryptoGrossDaily")).toContainText("18.00");
  await expect(page.locator("#cryptoEnergyDaily")).toContainText("9.00");
  await expect(page.locator("#cryptoNetDaily")).toContainText("8.82");
  await expect(page.locator("#cryptoNetMonthly")).toContainText("264.60");
  await expect(page.locator("#cryptoPayback")).toContainText("113 zile");
  await expect(page.locator("#cryptoCalcNotice")).toContainText("nu predicții");
});

test("founder content campaign planner builds a 30-day brief for the private Studio", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    isDrvasAdmin = true;
    document.querySelector("#founderCampaignBrand").value = "Dr.Vas Studio";
    document.querySelector("#founderCampaignAudience").value = "Creatori români la început de drum";
    document.querySelector("#founderCampaignGoal").value = "Educație și încredere";
    document.querySelector("#founderCampaignChannels").value = "TikTok, YouTube Shorts";
    document.querySelector("#founderCampaignCadence").value = "Un video scurt pe zi";
    document.querySelector("#founderCampaignOffer").value = "Buget de test 50 GBP; numai materiale cu drepturi clare";
    window.__DRVAS_CAMPAIGN_CAPTURE__ = null;
    window.launchFounderWorkbenchPrompt = (moduleName, prompt, status) => {
      window.__DRVAS_CAMPAIGN_CAPTURE__ = { moduleName, prompt, status };
    };
    buildFounderCampaignCalendarPrompt();
  });
  const brief = await page.evaluate(() => window.__DRVAS_CAMPAIGN_CAPTURE__);
  expect(brief.moduleName).toBe("studio");
  expect(brief.prompt).toContain("CALENDAR EDITORIAL 30 DE ZILE");
  expect(brief.prompt).toContain("Dr.Vas Studio");
  expect(brief.prompt).toContain("TikTok, YouTube Shorts");
  expect(brief.prompt).toContain("Nu publica și nu programa automat.");
  expect(brief.status).toContain("Dr.Vas Studio");
});

test("Business cashbook monthly cashflow report summarizes and filters saved transactions", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-cashflow-user", email: "admin@example.invalid" };
    isDrvasAdmin = true;
    selectModule("business", true);
  });
  await expect(page.locator("#businessWorkspace")).toBeVisible();
  await page.locator('#businessWorkspace [data-feature="cashbook"]').click();
  // Wait for the workspace's asynchronous cashbook load to finish before seeding test rows.
  await expect(page.locator("#businessLedgerStatus")).toContainText("Registru încărcat");
  await page.locator('#businessWorkspace [data-feature="cashflow"]').click();
  await page.evaluate(() => {
    const today = new Date();
    const monthDate = offset => {
      const date = new Date(today.getFullYear(), today.getMonth() + offset, Math.min(today.getDate(), 20));
      return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
    };
    businessLedgerState.currency = "GBP";
    businessLedgerState.rows = [
      { id:"cf1", transaction_date:monthDate(0), entry_type:"income", description:"Current month sales", category:"Sales", amount:1200, currency:"GBP", vat_rate:0, vat_included:true },
      { id:"cf2", transaction_date:monthDate(0), entry_type:"expense", description:"Current month costs", category:"Costs", amount:300, currency:"GBP", vat_rate:0, vat_included:true },
      { id:"cf3", transaction_date:monthDate(-1), entry_type:"income", description:"Previous month sales", category:"Sales", amount:900, currency:"GBP", vat_rate:0, vat_included:true },
      { id:"cf4", transaction_date:monthDate(-1), entry_type:"expense", description:"Previous month costs", category:"Costs", amount:200, currency:"GBP", vat_rate:0, vat_included:true },
      { id:"cf5", transaction_date:monthDate(-2), entry_type:"income", description:"Two months ago sales", category:"Sales", amount:500, currency:"GBP", vat_rate:0, vat_included:true }
    ];
    document.querySelector("#businessLedgerCurrency").value = "GBP";
    document.querySelector("#businessCashflowRange").value = "90";
    renderBusinessLedger();
  });
  await expect(page.locator("#businessCashflowIncome")).toContainText(/2[.,]600/);
  await expect(page.locator("#businessCashflowExpenses")).toContainText("500");
  await expect(page.locator("#businessCashflowNet")).toContainText(/2[.,]100/);
  await expect(page.locator("#businessCashflowRows tbody tr")).toHaveCount(3);
  await page.locator("#businessCashflowRange").selectOption("30");
  await expect(page.locator("#businessCashflowIncome")).toContainText(/1[.,]200/);
  await expect(page.locator("#businessCashflowExpenses")).toContainText("300");
  await expect(page.locator("#businessCashflowNet")).toContainText("900");
  await expect(page.locator("#businessCashflowRows tbody tr")).toHaveCount(1);
});
test("Bitcoin mining calculator exposes its monthly maintenance assumption", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    document.querySelector("#adminPanel")?.classList.remove("hidden");
    isDrvasAdmin = true;
    calculateCryptoMiningEconomics();
  });
  await expect(page.locator("#cryptoMaintenanceMonthly")).toHaveValue("50");
  await expect(page.locator("#cryptoMaintenanceDaily")).toContainText("1.67");
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

test("Dr.Vas presentation introduces all six modules through three animated speakers in all supported languages", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    checkSession = async () => {};
    window.__drvasSpoken = [];
    window.__drvasStartCount = 0;
    window.startDrVas = () => { window.__drvasStartCount++; };
    const presentationVoices = [
      { name: "Microsoft Andrei", lang: "ro-RO", voiceURI: "andrei-ro" },
      { name: "Microsoft David", lang: "ro-RO", voiceURI: "david-ro" },
      { name: "Microsoft Alina", lang: "ro-RO", voiceURI: "alina-ro" }
    ];
    const synth = { getVoices: () => presentationVoices, cancel() {}, speak: utterance => { window.__drvasSpoken.push(utterance); } };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: synth });
    window.SpeechSynthesisUtterance = function (text) { this.text = text; };
  });
  await expect(page.locator("#heroPresentationOpenButton")).toBeVisible();
  await page.locator("#heroPresentationOpenButton").click();
  await expect(page.locator("#drvasPresentation")).toBeVisible();
  await expect(page.locator("#presentationAvatar .presentation-photo")).toBeVisible();
  await expect(page.locator("#presentationAvatar .presentation-photo")).toHaveAttribute("alt", "Dr.Vas — fotografia fondatorului");
  await expect.poll(() => page.locator("#presentationAvatar .presentation-photo").evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator("#presentationAvatar .character-orbit")).toHaveCount(2);
  const presentationButtonStyle = await page.locator("#heroPresentationOpenButton").evaluate(node => {
    const style = getComputedStyle(node);
    return { color: style.color, borderColor: style.borderTopColor, background: style.backgroundImage };
  });
  expect(presentationButtonStyle.color).toBe("rgb(9, 9, 9)");
  expect(presentationButtonStyle.borderColor).toBe("rgb(5, 5, 5)");
  expect(presentationButtonStyle.background).toContain("linear-gradient");
  await expect(page.locator("#presentationModuleGrid .presentation-module")).toHaveCount(6);
  await expect(page.locator("#presentationModuleGrid .presentation-module.is-active")).toHaveCount(2);
  await expect(page.locator("#presentationSpeakerName")).toHaveText("Dr.Vas");
  await expect.poll(() => page.evaluate(() => window.__drvasSpoken[0]?.voice?.name || "")).toBe("Microsoft Andrei");
  const languages = [["ro","ro-RO"],["en","en-GB"],["it","it-IT"],["tr","tr-TR"],["de","de-DE"],["fr","fr-FR"],["es","es-ES"],["ru","ru-RU"]];
  const openLabels = {ro:"Deschide prezentarea",en:"Open presentation",it:"Apri la presentazione",tr:"Tanıtımı aç",de:"Präsentation öffnen",fr:"Ouvrir la présentation",es:"Abrir presentación",ru:"Открыть презентацию"};
  for (const [language, locale] of languages) {
    const first = await page.evaluate(async code => {
      stopDrvasPresentationSpeech(); currentLanguage = code; renderDrvasPresentation(); await speakDrvasPresentation();
      const utterance = window.__drvasSpoken[window.__drvasSpoken.length - 1];
      return { text: utterance.text, lang: utterance.lang, speaker: document.querySelector("#presentationSpeakerName").textContent, expandedNames: prepareDrvasPresentationSpeechText("Dr.Vas și Dr.Jan") };
    }, language);
    expect(first.lang).toBe(locale);
    expect(first.speaker).toBe("Dr.Vas");
    expect(first.expandedNames).toBe("Doctor Vas și Doctor Jan");
    expect(first.text).toContain("Doctor Vas Free");
    expect(first.text).toContain("Doctor Vas Health");
    expect(first.text).not.toContain("Dr.Vas");
    expect(first.text).not.toContain("Dr.Jan");
    await expect(page.locator("#presentationSpeakerName")).toHaveText("Dr.Vas");
    await expect(page.locator("#presentationOpenButton")).toContainText(openLabels[language]);
  }
  await page.evaluate(async () => {
    stopDrvasPresentationSpeech(); currentLanguage = "ro"; renderDrvasPresentation(); await speakDrvasPresentation();
    window.__drvasSpoken[window.__drvasSpoken.length - 1].onend();
  });
  await page.waitForTimeout(500);
  const jan = await page.evaluate(() => ({
    speaker: document.querySelector("#presentationSpeakerName").textContent,
    modules: document.querySelector("#presentationSpeakerModules").textContent,
    speech: window.__drvasSpoken[window.__drvasSpoken.length - 1].text
  }));
  expect(jan.speaker).toBe("Dr.Jan");
  await expect(page.locator("#presentationAvatar")).toHaveClass(/presentation-avatar-jan/);
  await expect(page.locator("#presentationAvatar .presentation-photo")).toBeVisible();
  await expect(page.locator("#presentationAvatar .presentation-photo")).toHaveAttribute("data-presenter", "jan");
  await expect(page.locator("#presentationAvatar .presentation-photo")).toHaveAttribute("alt", "Dr.Jan — personaj AI fictiv");
  await expect.poll(() => page.locator("#presentationAvatar .presentation-photo").evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await page.locator("#presentationAvatar .character-glasses").evaluate(node => getComputedStyle(node).display)).toBe("block");
  expect(await page.evaluate(() => window.__drvasSpoken[window.__drvasSpoken.length - 1].voice?.name)).toBe("Microsoft Andrei");
  expect(jan.modules).toContain("Dr.Vas Studio");
  expect(jan.modules).toContain("Dr.Vas Business");
  expect(jan.speech).toContain("Doctor Vas Studio");
  expect(jan.speech).toContain("Doctor Vas Business");
  expect(jan.speech).toContain("Doctor Jan");
  await page.evaluate(() => window.__drvasSpoken[window.__drvasSpoken.length - 1].onend());
  await page.waitForTimeout(500);
  const sarah = await page.evaluate(() => ({
    speaker: document.querySelector("#presentationSpeakerName").textContent,
    modules: document.querySelector("#presentationSpeakerModules").textContent,
    speech: window.__drvasSpoken[window.__drvasSpoken.length - 1].text
  }));
  expect(sarah.speaker).toBe("Sarah");
  await expect(page.locator("#presentationAvatar")).toHaveClass(/presentation-avatar-sarah/);
  await expect(page.locator("#presentationAvatar .presentation-photo")).toBeVisible();
  await expect(page.locator("#presentationAvatar .presentation-photo")).toHaveAttribute("alt", "Sarah — portret profesional adult");
  await expect.poll(() => page.locator("#presentationAvatar .presentation-photo").evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await page.locator("#presentationAvatar .character-hair-long").evaluate(node => getComputedStyle(node).display)).toBe("block");
  expect(await page.evaluate(() => window.__drvasSpoken[window.__drvasSpoken.length - 1].voice?.name)).toBe("Microsoft Alina");
  expect(sarah.modules).toContain("Dr.Vas Academy");
  expect(sarah.modules).toContain("Dr.Vas Commerce");
  expect(sarah.speech).toContain("Doctor Vas Academy");
  expect(sarah.speech).toContain("Doctor Vas Commerce");
  await page.evaluate(() => window.__drvasSpoken[window.__drvasSpoken.length - 1].onend());
  await page.waitForTimeout(1450);
  await expect(page.locator("#drvasPresentation")).toBeVisible();
  expect(await page.evaluate(() => window.__drvasStartCount)).toBe(0);
  await page.locator("#presentationContinueButton").click();
  await expect(page.locator("#drvasPresentation")).toBeHidden();
  expect(await page.evaluate(() => window.__drvasStartCount)).toBe(1);
});


test("presentation reuses one available language voice when fewer than three presenter voices are installed", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    window.__drvasSpoken = [];
    const voices = [{ name: "Microsoft Andrei", lang: "ro-RO", voiceURI: "andrei-ro" }];
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { getVoices: () => voices, cancel() {}, resume() { window.__drvasResumeCalls = (window.__drvasResumeCalls || 0) + 1; }, speak: utterance => window.__drvasSpoken.push(utterance) }
    });
    window.SpeechSynthesisUtterance = function (text) { this.text = text; };
  });
  await page.evaluate(async () => { currentLanguage = "ro"; await speakDrvasPresentation(); });
  await expect(page.locator("#presentationAudioStatus")).toContainText("Narațiune audio");
  await expect(page.locator("#presentationPresenter")).toHaveClass(/scene-enter/);
  await expect(page.locator("#presentationSpeakerName")).toHaveText("Dr.Vas");
  expect(await page.evaluate(() => window.__drvasSpoken.length)).toBe(1);
  expect(await page.evaluate(() => window.__drvasResumeCalls)).toBeGreaterThanOrEqual(1);
  expect(await page.evaluate(() => window.__drvasSpoken[0].voice?.name)).toBe("Microsoft Andrei");
});

test("presentation attempts default device speech when the browser reports no installed voices", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    window.__drvasSpoken = [];
    window.__drvasResumeCalls = 0;
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [],
        cancel() {},
        resume() { window.__drvasResumeCalls++; },
        addEventListener() {},
        removeEventListener() {},
        speak: utterance => window.__drvasSpoken.push(utterance)
      }
    });
    window.SpeechSynthesisUtterance = function (text) { this.text = text; };
  });
  await page.evaluate(async () => { currentLanguage = "ro"; await speakDrvasPresentation(); });
  await expect(page.locator("#presentationAudioStatus")).toContainText("Încerc redarea cu vocea implicită");
  expect(await page.evaluate(() => window.__drvasSpoken.length)).toBe(1);
  expect(await page.evaluate(() => window.__drvasSpoken[0].voice)).toBeUndefined();
  expect(await page.evaluate(() => window.__drvasSpoken[0].lang)).toBe("ro-RO");
  expect(await page.evaluate(() => window.__drvasResumeCalls)).toBeGreaterThanOrEqual(1);
});

test("Studio builds a visual timeline from selected production assets", async ({ page }) => {
  await openApp(page, "ro");
  const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=", "base64");
  await page.locator("#studioSceneImages").setInputFiles([
    { name: "opening.png", mimeType: "image/png", buffer: pixel },
    { name: "closeup.png", mimeType: "image/png", buffer: pixel }
  ]);
  await expect(page.locator("#studioSceneTimeline .studio-scene-card")).toHaveCount(2);
  await expect(page.locator("#studioSceneTimelineCount")).toHaveText("2 scene");
  await expect(page.locator("#studioSceneTimeline .studio-scene-card").first()).toContainText("Scena 01");
  await expect(page.locator("#studioSceneTimeline .studio-scene-card").nth(1)).toContainText("Scena 02");
});

test("Dr.Vas Studio accepts MP4 scene footage alongside still images", async ({ page }) => {
  await openApp(page, "ro");
  const input = page.locator("#studioSceneImages");
  await expect(input).toHaveAttribute("accept", /video\/mp4/);
  await expect(input).toHaveAttribute("multiple", "");
  await expect(page.locator("#studioRenderCreateButton")).toHaveText("Randează video MP4");
});


test("spoken chat text expands Dr.Vas and Dr.Jan names without changing written branding", async ({ page }) => {
  await openApp(page, "ro");
  const result = await page.evaluate(() => ({
    spoken: prepareSpeechText("Dr.Vas răspunde împreună cu Dr.Jan. Intră în Dr.Vas Studio."),
    written: document.title,
    logo: document.querySelector("header")?.innerText || ""
  }));
  expect(result.spoken).toBe("Doctor Vas răspunde împreună cu Doctor Jan. Intră în Doctor Vas Studio.");
  expect(result.written).toContain("Dr.Vas AI");
  expect(result.logo).toContain("Dr.Vas");
});


test("stopping voice output cancels a founder voice request that is still loading", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    activeAssistant = "drvas";
    currentUser = { id: "voice-test-user" };
    voiceAutoRead = true;
    window.__voicePlayCount = 0;
    window.__resolveVoiceFetch = null;
    supabaseClient.auth.getSession = async () => ({ data: { session: { access_token: "test-token" } }, error: null });
    window.fetch = () => new Promise(resolve => { window.__resolveVoiceFetch = resolve; });
    window.Audio = function () {
      this.pause = () => {};
      this.play = async () => { window.__voicePlayCount++; };
    };
    URL.createObjectURL = () => "blob:drvas-test";
    URL.revokeObjectURL = () => {};
  });
  const pending = page.evaluate(() => speakDrVas("Dr.Vas răspunde."));
  await expect.poll(() => page.evaluate(() => typeof window.__resolveVoiceFetch)).toBe("function");
  await page.evaluate(() => stopVoiceOutput());
  await page.evaluate(() => window.__resolveVoiceFetch({
    ok: true,
    blob: async () => new Blob(["audio"], { type: "audio/mpeg" })
  }));
  await pending;
  expect(await page.evaluate(() => window.__voicePlayCount)).toBe(0);
  expect(await page.evaluate(() => document.body.classList.contains("assistant-speaking"))).toBe(false);
});


test("Studio explains its eight-item limit for mixed image and MP4 scenes", async ({ page }) => {
  await openApp(page, "ro");
  const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=", "base64");
  await page.locator("#studioSceneImages").setInputFiles(
    Array.from({ length: 9 }, (_, index) => ({
      name: `scene-${index + 1}.png`,
      mimeType: "image/png",
      buffer: pixel
    }))
  );
  await page.evaluate(async () => {
    currentUser = { id: "studio-limit-test" };
    await renderStudioVideo();
  });
  await expect(page.locator("#studioRenderStatus")).toContainText("maximum 8 scene");
  await expect(page.locator("#studioRenderStatus")).toContainText("clipuri MP4");
});


test("long-form chat input exposes the documented 100,000-character ceiling", async ({ page }) => {
  await openApp(page, "ro");
  const question = page.locator("#question");
  await expect(question).toHaveAttribute("maxlength", "100000");
});

test("Crypto device controls require administrator state and send explicit audited status changes", async ({ page }) => {
  await openApp(page, "ro");
  const result = await page.evaluate(async () => {
    const calls = [];
    isDrvasAdmin = true;
    window.confirm = () => true;
    supabaseClient.auth.getSession = async () => ({
      data: { session: { access_token: "e2e-admin-token" } },
      error: null
    });
    window.fetch = async (url, options) => {
      const payload = JSON.parse(options.body);
      calls.push({ url, payload });
      return {
        ok: true,
        json: async () => calls.length === 1
          ? { updated: true, device: { id: payload.device_id, status: payload.status } }
          : { devices: [], generated_at: "2026-11-05T00:00:00.000Z" }
      };
    };
    await updateCryptoDeviceStatus("123e4567-e89b-12d3-a456-426614174000", "authorized");
    const authorizedCalls = calls.slice();
    calls.length = 0;
    isDrvasAdmin = false;
    await updateCryptoDeviceStatus("123e4567-e89b-12d3-a456-426614174000", "revoked");
    return { authorizedCalls, blockedCalls: calls };
  });
  expect(result.authorizedCalls).toHaveLength(2);
  expect(result.authorizedCalls[0].payload).toMatchObject({
    action: "crypto_device_update",
    device_id: "123e4567-e89b-12d3-a456-426614174000",
    status: "authorized",
    access_token: "e2e-admin-token"
  });
  expect(result.blockedCalls).toHaveLength(0);
});


test("dedicated voice requests carry the selected Dr.Vas assistant identity", async ({ page }) => {
  await openApp(page, "ro", { access_token: "e2e-voice-token", user: { id: "e2e-voice-user" } });
  await page.evaluate(async () => {
    currentUser = { id: "e2e-voice-user" };
    voiceAutoRead = true;
    window.__DRVAS_E2E_VOICE_REQUESTS__ = [];
    window.fetch = async (_url, options) => {
      window.__DRVAS_E2E_VOICE_REQUESTS__.push(JSON.parse(options.body));
      return new Response(new Blob(["audio"]), { status: 200, headers: { "Content-Type": "audio/mpeg" } });
    };
    window.URL.createObjectURL = () => "blob:e2e-voice";
    window.URL.revokeObjectURL = () => {};
    window.Audio = class {
      constructor(src) { this.src = src; this.onplay = null; this.onended = null; this.onerror = null; }
      async play() { this.onplay?.(); this.onended?.(); }
      pause() {}
    };
    for (const assistant of ["drvas", "jan", "aurora"]) {
      activeAssistant = assistant;
      await speakDrVas("Test de voce dedicata.");
    }
  });
  const requests = await page.evaluate(() => window.__DRVAS_E2E_VOICE_REQUESTS__);
  expect(requests.map(request => request.assistant)).toEqual(["drvas", "jan", "aurora"]);
  expect(requests.every(request => request.action === "voice_tts" && request.access_token === "e2e-voice-token")).toBeTruthy();
});

test("server-side assistant TTS still works when browser speech synthesis is unavailable", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(async () => {
    currentUser = { id: "e2e-voice-user" };
    activeAssistant = "drvas";
    voiceAutoRead = true;
    window.__DRVAS_E2E_TTS_WITHOUT_BROWSER__ = [];
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined });
    supabaseClient.auth.getSession = async () => ({
      data: { session: { access_token: "e2e-voice-token" } },
      error: null
    });
    window.fetch = async (_url, options) => {
      window.__DRVAS_E2E_TTS_WITHOUT_BROWSER__.push(JSON.parse(options.body));
      return new Response(new Blob(["audio"]), { status: 200, headers: { "Content-Type": "audio/mpeg" } });
    };
    window.URL.createObjectURL = () => "blob:e2e-voice-no-browser";
    window.URL.revokeObjectURL = () => {};
    window.Audio = class {
      constructor(src) { this.src = src; this.onplay = null; this.onended = null; this.onerror = null; }
      async play() { this.onplay?.(); this.onended?.(); }
      pause() {}
    };
    await speakDrVas("Test vocal fără Web Speech API.");
  });
  const requests = await page.evaluate(() => window.__DRVAS_E2E_TTS_WITHOUT_BROWSER__);
  expect(requests).toHaveLength(1);
  expect(requests[0].action).toBe("voice_tts");
  expect(requests[0].assistant).toBe("drvas");
  await expect(page.locator("#voiceStatus")).not.toContainText("unsupported");
});


test("public dashboard exposes exactly six customer modules while internal workbenches stay inside the hidden admin centre", async ({ page }) => {
  await openApp(page, "ro");

  const publicModuleIds = await page.locator("#moduleSelectionSection .module-card").evaluateAll(cards =>
    cards.map(card => card.getAttribute("data-module"))
  );
  expect(publicModuleIds).toEqual(["free", "health", "studio", "academy", "commerce", "business"]);
  await expect(page.locator('#moduleSelectionSection [data-module="crypto"]')).toHaveCount(0);
  await expect(page.locator("#adminPanel")).toBeHidden();

  const internalWorkbenchState = await page.locator("#adminPanel").evaluate(panel => ({
    cryptoInsideAdmin: Boolean(panel.querySelector("#cryptoAdminHeading")),
    creatorLabInsideAdmin: Array.from(panel.querySelectorAll("h4, h5")).some(node => node.textContent.includes("Creator & Online Income Lab")),
    evaluationLabInsideAdmin: Array.from(panel.querySelectorAll("h5")).some(node => node.textContent.includes("AI Evaluation & Training Lab")),
    digitalProductStudioInsideAdmin: Array.from(panel.querySelectorAll("h5")).some(node => node.textContent.includes("Digital Product Studio")),
    founderProvenanceInsideAdmin: Boolean(panel.querySelector("#founderProvenanceHeading")),
    workbenchCount: panel.querySelectorAll(".founder-tool").length
  }));
  expect(internalWorkbenchState).toMatchObject({
    cryptoInsideAdmin: true,
    creatorLabInsideAdmin: true,
    evaluationLabInsideAdmin: true,
    digitalProductStudioInsideAdmin: true,
    founderProvenanceInsideAdmin: true
  });
  expect(internalWorkbenchState.workbenchCount).toBeGreaterThanOrEqual(10);
});


test("hidden founder workbench briefs are persisted to their matching private module before chat handoff", async ({ page }) => {
  await openApp(page, "ro");
  const result = await page.evaluate(async () => {
    currentUser = { id: "e2e-founder-workbench", email: "founder@example.invalid" };
    isDrvasAdmin = true;
    const calls = [];
    window.__DRVAS_FOUNDER_WORKBENCH_SAVES__ = calls;
    selectModule = () => {};
    submitModuleBrief = (prompt) => calls.push({ handoff: prompt });
    saveStudioProject = async () => {
      calls.push({
        save: "studio",
        title: document.getElementById("studioProjectTitle").value,
        deliverable: document.getElementById("studioDeliverable").value,
        brief: document.getElementById("studioIdea").value
      });
      return true;
    };
    saveModuleProject = async (module) => {
      calls.push({
        save: module,
        title: document.getElementById(module + "ProjectTitle").value,
        primary: document.getElementById(module === "academy" ? "academySubject" : "businessIdea").value,
        brief: document.getElementById(module === "academy" ? "academyBrief" : "businessBrief").value
      });
      return true;
    };

    await launchFounderWorkbenchPrompt("studio", "DR.VAS CONTENT & CAMPAIGN PLANNER\nCampaign brief", "Ready");
    await launchFounderWorkbenchPrompt("academy", "DR.VAS AI EVALUATION & TRAINING LAB\nEvaluation brief", "Ready");
    await launchFounderWorkbenchPrompt("business", "DR.VAS BUSINESS OPERATIONS PLANNER\nOperations brief", "Ready");
    return calls;
  });

  const studio = result.find(item => item.save === "studio");
  const academy = result.find(item => item.save === "academy");
  const business = result.find(item => item.save === "business");
  expect(studio).toMatchObject({
    title: "CONTENT & CAMPAIGN PLANNER",
    deliverable: "article",
    brief: "DR.VAS CONTENT & CAMPAIGN PLANNER\nCampaign brief"
  });
  expect(academy).toMatchObject({
    title: "AI EVALUATION & TRAINING LAB",
    primary: "AI EVALUATION & TRAINING LAB",
    brief: "DR.VAS AI EVALUATION & TRAINING LAB\nEvaluation brief"
  });
  expect(business).toMatchObject({
    title: "BUSINESS OPERATIONS PLANNER",
    primary: "BUSINESS OPERATIONS PLANNER",
    brief: "DR.VAS BUSINESS OPERATIONS PLANNER\nOperations brief"
  });
  expect(result.filter(item => item.handoff)).toHaveLength(3);
});


test("hidden founder workbench reports a private-save failure instead of claiming success", async ({ page }) => {
  await openApp(page, "ro");
  const result = await page.evaluate(async () => {
    currentUser = { id: "e2e-founder-workbench", email: "founder@example.invalid" };
    isDrvasAdmin = true;
    const calls = [];
    selectModule = () => {};
    submitModuleBrief = prompt => calls.push({ handoff: prompt });
    saveModuleProject = async module => {
      calls.push({ saveAttempt: module });
      return false;
    };
    const notices = [];
    founderWorkbenchMessage = (message, isError = false) => notices.push({ message, isError });
    await launchFounderWorkbenchPrompt("academy", "DR.VAS AI EVALUATION & TRAINING LAB\nEvaluation brief", "Ready");
    return { calls, notices };
  });
  expect(result.calls).toContainEqual({ saveAttempt: "academy" });
  expect(result.calls).toContainEqual({ handoff: "DR.VAS AI EVALUATION & TRAINING LAB\nEvaluation brief" });
  expect(result.notices.at(-1)).toMatchObject({ isError: true });
  expect(result.notices.at(-1).message).toContain("salvarea nu a fost confirmată");
});


test("Sarah and Dr.Jan portraits load from permanent local assets in selector, presentation and Live", async ({ page }) => {
  await openApp(page, "ro");
  const expected = [
    ['[data-assistant="drvas"] .assistant-avatar', "drvas.jpeg"],
    ['[data-assistant="jan"] .assistant-avatar', "/assets/presenters/drjan.jpg"],
    ['[data-assistant="aurora"] .assistant-avatar', "/assets/presenters/Sarah23.jpg"]
  ];
  for (const [selector, source] of expected) {
    const image = page.locator(selector);
    await expect(image).toHaveAttribute("src", source);
    await expect.poll(() => image.evaluate(node => node.naturalWidth)).toBeGreaterThan(0);
  }
  const portraitIntegrity = await page.evaluate(async () => {
    const inspect = async selector => {
      const image = document.querySelector(selector);
      const response = await fetch(image.currentSrc);
      const bytes = await response.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      return {
        width: image.naturalWidth,
        hash: Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, "0")).join("")
      };
    };
    return {
      jan: await inspect('[data-assistant="jan"] .assistant-avatar'),
      sarah: await inspect('[data-assistant="aurora"] .assistant-avatar')
    };
  });
  expect(portraitIntegrity.jan.width).toBeGreaterThanOrEqual(256);
  expect(portraitIntegrity.sarah.width).toBeGreaterThanOrEqual(256);
  expect(portraitIntegrity.jan.hash).not.toBe(portraitIntegrity.sarah.hash);

  const presentation = await page.evaluate(async () => {
    const results = [];
    for (const [index, key] of [[0, "drvas"], [1, "jan"], [2, "sarah"]]) {
      updateDrvasPresentationScene(index);
      const presenter = document.querySelector("#presentationPresenter");
      presenter.classList.add("is-speaking");
      const image = document.querySelector("#presentationAvatar .presentation-photo");
      await image.decode();
      results.push({
        key,
        src: image.getAttribute("src"),
        width: image.naturalWidth,
        animation: getComputedStyle(image).animationName
      });
    }
    return results;
  });
  expect(presentation.map(item => item.key)).toEqual(["drvas", "jan", "sarah"]);
  expect(presentation[1].src).toBe("/assets/presenters/drjan.jpg");
  expect(presentation[2].src).toBe("/assets/presenters/Sarah23.jpg");
  for (const item of presentation) {
    expect(item.width).toBeGreaterThan(0);
    expect(item.animation).toContain("presenterPhotoTalk");
  }

  const live = await page.evaluate(async () => {
    const results = [];
    for (const assistant of ["jan", "aurora"]) {
      selectAssistant(assistant);
      updateLiveVoiceStage("speaking", "Test audio activ");
      const image = document.querySelector("#liveStageAvatar img");
      await image.decode();
      results.push({ assistant, src: image.getAttribute("src"), width: image.naturalWidth });
    }
    updateLiveVoiceStage("closed");
    return results;
  });
  expect(live.map(({ assistant, src }) => ({ assistant, src }))).toEqual([
    { assistant: "jan", src: "/assets/presenters/drjan.jpg" },
    { assistant: "aurora", src: "/assets/presenters/Sarah23.jpg" }
  ]);
  for (const item of live) expect(item.width).toBeGreaterThanOrEqual(256);
});

test("assistant portrait fallback appears if a local image cannot load and recovers when restored", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => document.querySelector("#chatSection").classList.remove("hidden"));
  const image = page.locator('[data-assistant="jan"] .assistant-avatar');
  const fallback = page.locator('[data-assistant="jan"] .assistant-avatar-fallback');
  await expect(image).toBeVisible();
  await image.evaluate(node => { node.src = "/assets/presenters/missing-test-image.jpg"; });
  await expect(image).toBeHidden();
  await expect(fallback).toBeVisible();
  await image.evaluate(node => { node.src = "/assets/presenters/drjan.jpg"; });
  await expect.poll(() => image.evaluate(node => node.naturalWidth)).toBeGreaterThan(0);
  await expect(image).toBeVisible();
  await expect(fallback).toBeHidden();
});

test("presenter assets do not depend on temporary Runway signed URLs", async ({ page }) => {
  await openApp(page, "ro");
  const source = await page.locator("script").evaluateAll(nodes => nodes.map(node => node.textContent || "").join("\\n"));
  expect(source).not.toContain("dnznrvs05pmza.cloudfront.net");
  expect(source).not.toContain("_jwt=");
  expect(source).toContain('/assets/presenters/drjan.jpg');
  expect(source).toContain('/assets/presenters/Sarah23.jpg');
});

test("Crypto engine filters Proof-of-Work coins strictly above one dollar and by hardware", async ({ page }) => {
  await openApp(page, "ro");
  const result = await page.evaluate(() => {
    const engine = window.DrVasCryptoEngine;
    const markets = [
      { id: "bitcoin", current_price: 65000, market_cap: 1000, price_change_percentage_24h: 2 },
      { id: "litecoin", current_price: 90, market_cap: 500, price_change_percentage_24h: -1 },
      { id: "dogecoin", current_price: 0.2, market_cap: 300 },
      { id: "ravencoin", current_price: 0.03, market_cap: 20 },
      { id: "ethereum", current_price: 3000, market_cap: 900 },
      { id: "monero", current_price: 150, market_cap: 100 }
    ];
    return {
      all: engine.eligibleCoins(markets, "all", 1).map(coin => coin.symbol),
      sha256: engine.eligibleCoins(markets, "asic-sha256", 1).map(coin => coin.symbol),
      randomx: engine.eligibleCoins(markets, "cpu-randomx", 1).map(coin => coin.symbol)
    };
  });
  expect(result.all).toEqual(["BTC", "XMR", "LTC"]);
  expect(result.sha256).toEqual(["BTC"]);
  expect(result.randomx).toEqual(["XMR"]);
});

test("Crypto profitability core subtracts pool fee, energy and maintenance", async ({ page }) => {
  await openApp(page, "ro");
  const result = await page.evaluate(() => window.DrVasCryptoEngine.calculateNetDaily({
    coinsPerDay: 0.01,
    priceUsd: 100,
    watts: 1000,
    electricityUsdPerKwh: 0.1,
    poolFeePercent: 1,
    uptimePercent: 100,
    maintenanceUsdPerDay: 0.5
  }));
  expect(result.grossUsd).toBeCloseTo(1, 8);
  expect(result.poolFeeUsd).toBeCloseTo(0.01, 8);
  expect(result.energyUsd).toBeCloseTo(2.4, 8);
  expect(result.maintenanceUsd).toBeCloseTo(0.5, 8);
  expect(result.netUsd).toBeCloseTo(-1.91, 8);
});

test("landing hero renders two animated DNA strands and emergency stop latches locally", async ({ page }) => {
  await openApp(page, "ro");
  await expect(page.locator("#heroSection .dna-helix-visual")).toHaveCount(2);
  await expect(page.locator("#heroSection .dna-helix-left")).toBeVisible();
  await expect(page.locator("#heroSection .dna-helix-right")).toBeVisible();
  await expect(page.locator("#heroSection .dna-strand")).toHaveCount(4);
  await expect(page.locator("#heroSection .dna-strand-highlight")).toHaveCount(4);
  const strandFinish = await page.locator("#heroSection .dna-strand-highlight").first().evaluate(node => getComputedStyle(node).strokeWidth);
  expect(strandFinish).toBe("2.5px");
  const dnaLayout = await page.locator("#heroSection").evaluate(hero => {
    const heroHeight = hero.getBoundingClientRect().height;
    const rails = [...hero.querySelectorAll(".dna-helix-visual")].map(node => ({
      height: node.getBoundingClientRect().height,
      animation: getComputedStyle(node.querySelector(".dna-helix-core")).animationName,
      side: node.classList.contains("dna-helix-left") ? "left" : "right"
    }));
    return { heroHeight, rails };
  });
  expect(dnaLayout.heroHeight).toBeGreaterThan(600);
  expect(dnaLayout.rails).toHaveLength(2);
  for (const rail of dnaLayout.rails) {
    expect(rail.height).toBeGreaterThanOrEqual(dnaLayout.heroHeight - 2);
    expect(rail.animation).toBe("dnaHelixTurn");
  }
  const state = await page.evaluate(() => {
    document.querySelector("#cryptoEmergencyStopButton").click();
    return {
      pressed: document.querySelector("#cryptoEmergencyStopButton").getAttribute("aria-pressed"),
      label: document.querySelector("#cryptoEmergencyStopButton").textContent.trim(),
      scanDisabled: document.querySelector("#cryptoEngineScanButton").disabled,
      status: document.querySelector("#cryptoEngineStatus").textContent
    };
  });
  expect(state.pressed).toBe("true");
  expect(state.label).toBe("STOP ACTIVAT");
  expect(state.scanDisabled).toBe(true);
  expect(state.status).toContain("OPRIRE LOCALĂ ARMATĂ");
});


test("Commerce unit economics calculates per-order margin, price floor and budget recovery and persists assumptions", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-commerce-owner", email: "admin@example.invalid" };
    isDrvasAdmin = true;
    selectModule("commerce", true);
  });
  await expect(page.locator("#commerceWorkspace")).toBeVisible();

  const result = await page.evaluate(() => {
    const values = {
      commerceProduct: "Organizatoare pentru casă",
      commercePrice: "30",
      commerceBudget: "100",
      commerceCurrency: "GBP",
      commerceUnitCost: "10",
      commerceShippingCost: "3",
      commercePackagingCost: "1",
      commercePlatformFee: "10",
      commercePaymentFee: "2.9",
      commerceMarketingCost: "2",
      commerceReturnsReserve: "5",
      commerceMonthlyOrders: "20"
    };
    Object.entries(values).forEach(([id, value]) => { document.getElementById(id).value = value; });
    const calculation = calculateCommerceUnitEconomics();
    const savedBrief = moduleProjectBrief("commerce");
    return {
      calculation,
      outputs: Object.fromEntries([
        "commerceLandedCost", "commerceFeeTotal", "commerceVariableTotal",
        "commerceContribution", "commerceMargin", "commercePriceFloor",
        "commerceBreakEvenOrders", "commerceMonthlyContribution"
      ].map(id => [id, document.getElementById(id).textContent])),
      savedBrief,
      promptReady: (() => {
        buildCommercePrompt();
        return document.getElementById("question").value;
      })()
    };
  });

  expect(result.calculation.landed).toBe(14);
  expect(result.calculation.feeTotal).toBeCloseTo(5.37, 8);
  expect(result.calculation.variableTotal).toBeCloseTo(21.37, 8);
  expect(result.calculation.contribution).toBeCloseTo(8.63, 8);
  expect(result.calculation.margin).toBe(28.8);
  expect(result.calculation.priceFloor).toBe(19.49);
  expect(result.calculation.breakEvenOrders).toBe(12);
  expect(result.calculation.monthlyContribution).toBeCloseTo(172.6, 8);
  expect(result.outputs.commerceBreakEvenOrders).toContain("12");
  expect(result.savedBrief.commerceUnitCost).toBe("10");
  expect(result.savedBrief.commercePaymentFee).toBe("2.9");
  expect(result.savedBrief.commerceMonthlyOrders).toBe("20");
  expect(result.promptReady).toContain("REZULTAT CALCULATOR");
  expect(result.promptReady).toContain('"contribution":8.63');

  const lossScenario = await page.evaluate(() => {
    document.getElementById("commercePrice").value = "10";
    const result = calculateCommerceUnitEconomics();
    return { contribution: result.contribution, breakEven: result.breakEvenOrders, status: document.getElementById("commerceEconomicsStatus").textContent };
  });
  expect(lossScenario.contribution).toBeLessThan(0);
  expect(lossScenario.breakEven).toBeNull();
  expect(lossScenario.status).toContain("contribuția pe comandă este zero sau negativă");
});


test("opening a saved Commerce project restores calculator inputs and recalculates its margin", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(async () => {
    currentUser = { id: "e2e-commerce-owner", email: "admin@example.invalid" };
    isDrvasAdmin = true;
    selectModule("commerce", true);
    const id = "e2e-saved-commerce";
    const brief = {
      commerceProduct: "Organizatoare pentru casă",
      commerceMarket: "Regatul Unit",
      commerceBudget: "100",
      commerceModel: "Dropshipping",
      commerceChannel: "Shopify",
      commercePrice: "30",
      commerceBrief: "Test proiect salvat",
      commerceCurrency: "GBP",
      commerceUnitCost: "10",
      commerceShippingCost: "3",
      commercePackagingCost: "1",
      commercePlatformFee: "10",
      commercePaymentFee: "2.9",
      commerceMarketingCost: "2",
      commerceReturnsReserve: "5",
      commerceMonthlyOrders: "20",
      latest_output: "Scenariu salvat"
    };
    const select = document.getElementById("commerceProjectList");
    select.add(new Option("Proiect salvat", id));
    select.value = id;
    supabaseClient.from = () => {
      const query = {};
      query.select = function () { return this; };
      query.eq = function () { return this; };
      query.single = async function () {
        return { data: { id, module: "commerce", title: "Proiect salvat", brief }, error: null };
      };
      return query;
    };
    await openModuleProject("commerce");
  });
  await expect(page.locator("#commercePrice")).toHaveValue("30");
  await expect(page.locator("#commerceUnitCost")).toHaveValue("10");
  await expect(page.locator("#commerceContribution")).toContainText("8.63");
  await expect(page.locator("#commerceBreakEvenOrders")).toContainText("12");
  await expect(page.locator("#commerceProjectStatus")).toContainText("Proiect încărcat");
});


test("Studio translation requires a target language and prepares a rights-aware translation brief", async ({ page }) => {
  await openApp(page, "ro");
  const result = await page.evaluate(() => {
    currentUser = { id: "e2e-studio-translation", email: "admin@example.invalid" };
    isDrvasAdmin = true;
    selectModule("studio", true);
    document.getElementById("studioDeliverable").value = "translation";
    document.getElementById("studioIdea").value = "Good morning. This is the original text.";
    document.getElementById("studioSourceLanguage").value = "en";
    document.getElementById("studioTargetLanguage").value = "";
    buildStudioPrompt();
    const blocked = document.getElementById("question").value;
    document.getElementById("studioTargetLanguage").value = "ro";
    document.getElementById("studioRights").value = "client_authorized";
    document.getElementById("studioMonetization").value = "freelance";
    document.getElementById("studioMarket").value = "Regatul Unit";
    buildStudioPrompt();
    const prompt = document.getElementById("question").value;
    const project = studioProjectData();
    return {
      blocked,
      prompt,
      brief: project.brief,
      targetOptions: Array.from(document.getElementById("studioTargetLanguage").options).map(option => option.value)
    };
  });
  expect(result.blocked).toBe("");
  expect(result.prompt).toContain("LIMBA SURSA: en");
  expect(result.prompt).toContain("LIMBA ȚINTĂ: ro");
  expect(result.prompt).toContain("Tradu integral");
  expect(result.prompt).toContain("DREPTURI ȘI AUTORIZARE: Material de client cu permisiune");
  expect(result.prompt).toContain("OBIECTIV DE VENIT: Serviciu pentru client / freelance");
  expect(result.prompt).toContain("Regatul Unit");
  expect(result.brief.source_language).toBe("en");
  expect(result.brief.target_language).toBe("ro");
  expect(result.brief.rights_status).toBe("client_authorized");
  expect(result.brief.monetization_route).toBe("freelance");
});

test("Studio imports a small subtitle or text file locally and rejects oversized files", async ({ page }) => {
  await openApp(page, "ro");
  const result = await page.evaluate(async () => {
    const input = document.getElementById("studioSourceFile");
    const valid = new File(["1\n00:00:00,000 --> 00:00:01,000\nHello world"], "captions.srt", { type: "application/x-subrip" });
    await loadStudioSourceFile(valid);
    const accepted = document.getElementById("studioIdea").value;
    const oversized = new File(["x".repeat(2 * 1024 * 1024 + 1)], "large.txt", { type: "text/plain" });
    await loadStudioSourceFile(oversized);
    return {
      accepted,
      status: document.getElementById("studioProjectStatus").textContent,
      fileInputAccept: input.accept
    };
  });
  expect(result.accepted).toContain("MATERIAL ÎNCĂRCAT LOCAL: captions.srt");
  expect(result.accepted).toContain("Hello world");
  expect(result.status).toContain("depășește limita de 2 MB");
  expect(result.fileInputAccept).toContain(".srt");
});

test("Studio monetization planner includes platform fees, rights, VAT and owner approval boundaries", async ({ page }) => {
  await openApp(page, "ro");
  const result = await page.evaluate(() => {
    currentUser = { id: "e2e-studio-monetization", email: "admin@example.invalid" };
    isDrvasAdmin = true;
    selectModule("studio", true);
    document.getElementById("studioProjectTitle").value = "Roman original";
    document.getElementById("studioDeliverable").value = "book";
    document.getElementById("studioIdea").value = "Roman original despre secrete de familie.";
    document.getElementById("studioRights").value = "original_owned";
    document.getElementById("studioMonetization").value = "ebook";
    document.getElementById("studioMarket").value = "Regatul Unit";
    buildStudioMonetizationPrompt();
    return {
      prompt: document.getElementById("question").value,
      brief: studioProjectData().brief
    };
  });
  expect(result.prompt).toContain("PLAN DE MONETIZARE ȘI PUBLICARE");
  expect(result.prompt).toContain("drepturilor de autor");
  expect(result.prompt).toContain("comisioane");
  expect(result.prompt).toContain("TVA/taxelor");
  expect(result.prompt).toContain("nu iniția plăți sau publicări");
  expect(result.brief.monetization_route).toBe("ebook");
  expect(result.brief.rights_status).toBe("original_owned");
});

test("Studio saved projects restore language, rights and monetization metadata", async ({ page }) => {
  await openApp(page, "ro");
  const restored = await page.evaluate(async () => {
    currentUser = { id: "e2e-studio-restore", email: "admin@example.invalid" };
    isDrvasAdmin = true;
    selectModule("studio", true);
    const id = "e2e-studio-saved";
    const brief = {
      idea: "Roman tradus în engleză.",
      deliverable: "translation",
      platform: "YouTube",
      tone: "cinematic realist",
      audience: "public general",
      duration: "3-5 minute",
      aspect: "orizontal 16:9",
      source_language: "ro",
      target_language: "en",
      rights_status: "original_owned",
      monetization_route: "ebook",
      target_market: "UE",
      narration: "none",
      subtitles: true,
      latest_output: "Traducere de test"
    };
    const select = document.getElementById("studioSavedProjects");
    select.add(new Option("Proiect Studio", id));
    select.value = id;
    supabaseClient.from = () => {
      const query = {};
      query.select = function () { return this; };
      query.eq = function () { return this; };
      query.single = async function () {
        return { data: { id, title: "Proiect Studio", project_type: "translation", brief }, error: null };
      };
      return query;
    };
    await openStudioProject();
    return {
      source: document.getElementById("studioSourceLanguage").value,
      target: document.getElementById("studioTargetLanguage").value,
      rights: document.getElementById("studioRights").value,
      monetization: document.getElementById("studioMonetization").value,
      market: document.getElementById("studioMarket").value,
      idea: document.getElementById("studioIdea").value
    };
  });
  expect(restored).toEqual({
    source: "ro",
    target: "en",
    rights: "original_owned",
    monetization: "ebook",
    market: "UE",
    idea: "Roman tradus în engleză."
  });
});


test("Studio builds distinct original briefs for series, songs, lyrics and books", async ({ page }) => {
  await openApp(page, "ro");
  const results = await page.evaluate(() => {
    currentUser = { id: "e2e-studio-creative", email: "admin@example.invalid" };
    isDrvasAdmin = true;
    selectModule("studio", true);
    const cases = [
      { kind: "series", marker: "două episoade distincte pe zi" },
      { kind: "music", marker: "compoziție muzicală originală" },
      { kind: "lyrics", marker: "versuri sau poezie originale" },
      { kind: "book", marker: "Construiește o carte originală" }
    ];
    return cases.map(({ kind, marker }) => {
      document.getElementById("studioDeliverable").value = kind;
      document.getElementById("studioIdea").value = "Concept original de test pentru " + kind;
      document.getElementById("studioRights").value = "needs_clearance";
      buildStudioPrompt();
      return {
        kind,
        prompt: document.getElementById("question").value,
        marker,
        rights: document.getElementById("studioRights").value
      };
    });
  });
  for (const item of results) {
    expect(item.prompt).toContain(item.marker);
    expect(item.prompt).toContain("DREPTURI ȘI AUTORIZARE:");
    expect(item.prompt).toContain("dacă statutul este «de verificat», nu recomanda publicarea");
    expect(item.rights).toBe("needs_clearance");
  }
  expect(results.find(item => item.kind === "music").prompt).toContain("Nu imita o melodie sau un artist existent");
  expect(results.find(item => item.kind === "book").prompt).toContain("un prim capitol complet");
});


test("authenticated users can always sign out from the global top header and true bottom edge", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, "ro");
  await expect(page.locator("#globalLogoutTop")).toBeHidden();
  await expect(page.locator("#globalLogoutBottom")).toBeHidden();
  await expect(page.locator("#globalBackToModules")).toBeHidden();
  await page.evaluate(() => {
    currentUser = { id: "e2e-global-logout-user", email: "user@example.invalid" };
    syncGlobalLogoutControls();
  });
  await expect(page.locator("#globalLogoutTop")).toBeVisible();
  await expect(page.locator("#globalLogoutBottom")).toBeVisible();
  await expect(page.locator("#globalBackToModules")).toBeHidden();
  const positions = await page.evaluate(() => ({
    top: document.querySelector("#globalLogoutTop").getBoundingClientRect().top,
    bottom: document.querySelector("#globalLogoutBottom").getBoundingClientRect().bottom,
    footerPosition: getComputedStyle(document.querySelector("footer")).position
  }));
  expect(positions.top).toBeLessThan(100);
  expect(positions.bottom).toBeGreaterThan(700);
  await page.evaluate(() => {
    document.body.classList.add("chat-focus-mode");
    document.documentElement.classList.add("chat-focus-document");
  });
  await expect(page.locator("#globalLogoutTop")).toBeVisible();
  await expect(page.locator("#globalLogoutBottom")).toBeVisible();
  await expect.poll(() => page.locator("footer").evaluate(node => getComputedStyle(node).position)).toBe("fixed");
  await page.evaluate(() => { currentUser = null; syncGlobalLogoutControls(); });
  await expect(page.locator("#globalLogoutTop")).toBeHidden();
  await expect(page.locator("#globalLogoutBottom")).toBeHidden();
});


test("global logout stays available while moving through all six module workspaces", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-six-module-logout-user", email: "owner@example.invalid" };
    isDrvasAdmin = true;
    syncGlobalLogoutControls();
  });

  for (const moduleName of ["free", "health", "studio", "academy", "commerce", "business"]) {
    await page.evaluate(module => selectModule(module), moduleName);
    await expect(page.locator("#globalLogoutTop"), moduleName + " top logout").toBeVisible();
    await expect(page.locator("#globalLogoutBottom"), moduleName + " bottom logout").toBeVisible();
    await expect(page.locator("#globalBackToModules"), moduleName + " back to modules").toBeVisible();
    expect(await page.evaluate(() => activeModule)).toBe(moduleName);
  }
});


test("Dr.Vas Free uses a viewport chat shell with the requested sidebar and attachment control", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-free-shell-user", email: "free@example.invalid" };
    isDrvasAdmin = false;
    showModuleSelection();
    selectModule("free", true);
  });
  await expect(page.locator("#chatSection .history-panel")).toBeVisible();
  const labels = await page.locator("[data-free-nav]").allTextContents();
  expect(labels.map(value => value.trim())).toEqual(["＋New chat","▧Images","◷Scheduled","▤Library","⌘Plugins","✧Explore","▣Projects","View all"]);
  await expect(page.locator(".free-recents-heading")).toContainText("Recents");
  await expect(page.locator("#freeChatView .input-area .chat-file-button")).toBeVisible();
  await expect(page.locator("#sendButton")).toContainText("Trimite");
  const layout = await page.evaluate(() => ({
    bodyOverflow: getComputedStyle(document.body).overflowY,
    mainHeight: document.querySelector("main").getBoundingClientRect().height,
    viewportHeight: innerHeight,
    chatOverflow: getComputedStyle(document.querySelector("#freeChatView>#chat")).overflowY,
    composerBottom: document.querySelector("#freeChatView .input-area").getBoundingClientRect().bottom,
    chatBottom: document.querySelector("#freeChatView>#chat").getBoundingClientRect().bottom
  }));
  expect(layout.bodyOverflow).toMatch(/auto|scroll/);
  expect(await page.evaluate(() => document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight)).toBeGreaterThan(0);
  expect(layout.mainHeight).toBeGreaterThan(0);
  expect(layout.chatOverflow).toBe("auto");
  expect(layout.composerBottom).toBeGreaterThan(layout.chatBottom);
});

test("Dr.Vas Free sidebar destinations open their own truthful views", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-free-nav-user", email: "free@example.invalid" };
    isDrvasAdmin = true;
    showModuleSelection();
    selectModule("free", true);
    window.__freeNavScheduledSource = freeNavLoadScheduled.toString();
    window.__freeNavPluginsSource = freeNavLoadPlugins.toString();
    window.__freeNavLibrarySource = freeNavLoadLibrary.toString();
    window.__freeNavProjectsSource = freeNavLoadProjects.toString();
    window.__freeNavProjectOpenSource = freeNavOpenProject.toString();
    freeNavLoadLibrary = async imagesOnly => { const host=freeNavPage(imagesOnly ? "Images" : "Library","Private file library"); host.append("Saved files"); };
    freeNavLoadScheduled = async () => { const host=freeNavPage("Scheduled","In-app reminders"); host.append("Scheduled reminders"); };
    freeNavLoadPlugins = async () => { const host=freeNavPage("Plugins","Integration status"); host.append("Integration status"); };
    freeNavLoadProjects = async () => { const host=freeNavPage("Projects","Test projects"); host.append("Saved projects"); };
    freeNavLoadRecents = async () => { const host=freeNavPage("Recents","Test recents"); host.append("Recent conversations"); };
  });
  for (const [key, heading] of [["images","Images"],["scheduled","Scheduled"],["library","Library"],["plugins","Plugins"],["explore","Explore"],["projects","Projects"],["recents","Recents"]]) {
    await page.locator('[data-free-nav="' + key + '"]').click();
    await expect(page.locator("#freeNavWorkspace")).toBeVisible();
    await expect(page.locator("#freeNavWorkspace h2")).toHaveText(heading);
  }
  const librarySource = await page.evaluate(() => window.__freeNavLibrarySource);
  expect(librarySource).toContain("drvas_library_items");
  expect(librarySource).toContain(".upload(");
  expect(librarySource).toContain("createSignedUrl");
  const projectsSource = await page.evaluate(() => window.__freeNavProjectsSource);
  const projectOpenSource = await page.evaluate(() => window.__freeNavProjectOpenSource);
  expect(projectsSource).toContain("drvas_projects");
  expect(projectsSource).toContain(".insert(");
  expect(projectsSource).toContain(".update(");
  expect(projectsSource).toContain(".delete(");
  expect(projectOpenSource).toContain("drvas_projects");
  expect(projectOpenSource).toContain("notes");
  await page.locator('[data-free-nav="scheduled"]').click();
  await expect(page.locator("#freeNavWorkspace")).toContainText("Scheduled reminders");
  const scheduledSource = await page.evaluate(() => window.__freeNavScheduledSource);
  expect(scheduledSource).toContain("drvas_scheduled_tasks");
  expect(scheduledSource).toContain("drvas_notifications");
  await page.locator('[data-free-nav="plugins"]').click();
  await expect(page.locator("#freeNavWorkspace")).toContainText("Integration status");
  const pluginsSource = await page.evaluate(() => window.__freeNavPluginsSource);
  expect(pluginsSource).toContain('API_URL+"/health"');
  expect(pluginsSource).toContain("studio_renderer");
  expect(pluginsSource).toContain("database");
  expect(pluginsSource).toContain("nu există încă un catalog de instalare");
});

test("Free and Health remember separate conversation IDs for the same user", async ({ page }) => {
  await openApp(page, "ro");
  const ids = await page.evaluate(() => {
    currentUser = { id: "e2e-context-user", email: "context@example.invalid" };
    isDrvasAdmin = false;
    ensureConversationMetadata = async () => {};
    activeModule = "free";
    currentConversationId = "free-thread-1";
    rememberActiveConversation(currentConversationId, "free");
    selectModule("health", true);
    const healthId = currentConversationId;
    selectModule("free", true);
    return { healthId, restoredFreeId: currentConversationId, freeStored: getRememberedConversation("free"), healthStored: getRememberedConversation("health","health-brief") };
  });
  expect(ids.healthId).not.toBe("free-thread-1");
  expect(ids.restoredFreeId).toBe("free-thread-1");
  expect(ids.freeStored).toBe("free-thread-1");
  expect(ids.healthStored).toBe(ids.healthId);
});


test("Dr.Vas Free transcript keeps its own scroll and does not yank users reading older messages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-free-scroll-user", email: "scroll@example.invalid" };
    showModuleSelection();
    selectModule("free", true);
    const chat = el("chat");
    chat.replaceChildren();
    for (let i = 0; i < 40; i++) appendMessage("assistant", "Mesaj de test " + i + " cu text pentru a umple istoricul.");
    chat.scrollTop = 0;
    appendMessage("assistant", "Mesaj nou în timp ce utilizatorul citește istoricul.");
  });
  const state = await page.locator("#freeChatView>#chat").evaluate(node => ({
    scrollTop: node.scrollTop,
    scrollHeight: node.scrollHeight,
    clientHeight: node.clientHeight,
    pageScroll: document.scrollingElement.scrollTop
  }));
  expect(state.scrollTop).toBe(0);
  expect(state.scrollHeight).toBeGreaterThan(state.clientHeight);
  expect(state.pageScroll).toBe(0);
});

test("Dr.Vas Free mobile sidebar opens as a drawer and remains usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-free-mobile-user", email: "mobile@example.invalid" };
    freeNavLoadScheduled = async () => { const host=freeNavPage("Scheduled","In-app reminders"); host.append("Scheduled reminders"); };
    showModuleSelection();
    selectModule("free", true);
  });
  await expect(page.locator("#chatSection .history-panel")).toBeHidden();
  await expect(page.locator(".chat-history-toggle")).toBeVisible();
  await page.locator(".chat-history-toggle").click();
  await expect(page.locator("#chatSection .history-panel")).toBeVisible();
  await page.locator('[data-free-nav="scheduled"]').click();
  await expect(page.locator("#freeNavWorkspace h2")).toHaveText("Scheduled");
  await expect(page.locator("#chatSection .history-panel")).toBeHidden();
});


test("Explore reflects account access and Images states that AI generation is not yet connected", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-free-explore-access", email: "free@example.invalid" };
    isDrvasAdmin = false;
    showModuleSelection();
    selectModule("free", true);
  });

  await page.locator('[data-free-nav="explore"]').click();
  await expect(page.locator("#freeNavWorkspace h2")).toHaveText("Explore");
  const cards = page.locator("#freeNavWorkspace .free-nav-card");
  await expect(cards).toHaveCount(6);
  await expect(cards.filter({ hasText: "Dr.Vas Free" }).getByRole("button", { name: "Deschide modulul" })).toBeVisible();
  await expect(cards.filter({ hasText: "Dr.Vas Health" }).getByRole("button", { name: "Deschide modulul" })).toBeVisible();
  for (const moduleName of ["Dr.Vas Studio", "Dr.Vas Academy", "Dr.Vas Commerce", "Dr.Vas Business"]) {
    const card = cards.filter({ hasText: moduleName });
    await expect(card).toContainText("Acces restricționat pentru acest cont.");
    await expect(card.getByRole("button")).toHaveCount(0);
  }

  await page.locator('[data-free-nav="images"]').click();
  await expect(page.locator("#freeNavWorkspace")).toContainText("Generarea AI de imagini în Dr.Vas nu este încă activată.");
  await expect(page.locator("#freeNavWorkspace button", { hasText: "Alege imagine" })).toBeVisible();
});


test("Dr.Vas Free mobile page scroll reaches the attachment composer beside Send", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-free-mobile-viewport", email: "mobile@example.invalid" };
    isDrvasAdmin = false;
    showModuleSelection();
    selectModule("free", true);
  });

  const layout = await page.evaluate(() => {
    const main = document.querySelector("main");
    const transcript = document.querySelector("#freeChatView>#chat");
    const composer = document.querySelector("#freeChatView .input-area");
    const attach = composer.querySelector(".chat-file-button");
    const send = composer.querySelector("#sendButton");
    return {
      rootOverflow: getComputedStyle(document.documentElement).overflowY,
      mainBottom: main.getBoundingClientRect().bottom,
      viewportHeight: innerHeight,
      transcriptOverflow: getComputedStyle(transcript).overflowY,
      pageRange: document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight,
      attachParent: attach.parentElement === send.parentElement,
      attachImmediatelyBeforeSend: attach.nextElementSibling === send,
      sendInitiallyVisible: send.getBoundingClientRect().bottom <= innerHeight
    };
  });

  expect(layout.rootOverflow).toMatch(/auto|scroll/);
  expect(layout.mainBottom).toBeGreaterThan(0);
  expect(layout.pageRange).toBeGreaterThan(0);
  expect(layout.transcriptOverflow).toBe("auto");
  expect(layout.attachParent).toBe(true);
  expect(layout.attachImmediatelyBeforeSend).toBe(true);
  await page.evaluate(() => {
    const scroller = document.scrollingElement;
    scroller.scrollTop = scroller.scrollHeight;
  });
  await expect(page.locator("#sendButton")).toBeInViewport();
});


test("Dr.Vas Health uses the same chat shell, sidebar destinations and attachment composer as Free", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-health-shell-user", email: "health@example.invalid" };
    isDrvasAdmin = false;
    showModuleSelection();
    selectModule("health", true);
  });

  await expect(page.locator("#chatSection .history-panel")).toBeVisible();
  const healthScroll = await page.evaluate(() => ({
    documentOverflow: getComputedStyle(document.documentElement).overflowY,
    bodyOverflow: getComputedStyle(document.body).overflowY,
    documentHeight: document.documentElement.scrollHeight,
    viewportHeight: document.documentElement.clientHeight,
    transcriptOverflow: getComputedStyle(document.querySelector("#freeChatView>#chat")).overflowY
  }));
  expect(healthScroll.documentOverflow).toBe("scroll");
  expect(healthScroll.bodyOverflow).toBe("visible");
  expect(healthScroll.documentHeight).toBeGreaterThan(healthScroll.viewportHeight);
  expect(healthScroll.transcriptOverflow).toBe("auto");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY > 0)).toBe(true);
  const attachment = page.locator("#freeChatView .input-area .chat-file-button");
  await expect(attachment).toBeVisible();
  await attachment.scrollIntoViewIfNeeded();
  await expect(attachment).toBeInViewport();
  await expect(page.locator("#freeSidebarBrand")).toHaveText("✚ Dr.Vas Health");
  const labels = await page.locator("[data-free-nav]").allTextContents();
  expect(labels.map(value => value.trim())).toEqual(["＋New chat","▧Images","◷Scheduled","▤Library","⌘Plugins","✧Explore","▣Projects","View all"]);
  await expect(page.locator("#freeChatView .input-area .chat-file-button")).toBeVisible();
  await expect(page.locator("#sendButton")).toContainText("Trimite");
  await expect(page.locator("#globalBackToModules")).toBeVisible();
  await expect(page.locator("#globalBackToModules")).toContainText("Înapoi la module");

  await page.locator('[data-free-nav="scheduled"]').click();
  await expect(page.locator("#freeNavWorkspace")).toBeVisible();
  await expect(page.locator("#freeNavWorkspace h2")).toHaveText("Scheduled");
  await expect(page.locator("#freeChatView")).toBeHidden();
  await page.locator('[data-free-nav="chat"]').click();
  await expect(page.locator("#freeChatView")).toBeVisible();

  const attachmentAfterNavigation = page.locator("#freeChatView .input-area .chat-file-button");
  await expect(attachmentAfterNavigation).toBeVisible();
  await attachmentAfterNavigation.scrollIntoViewIfNeeded();
  await expect(attachmentAfterNavigation).toBeInViewport();
  const layout = await page.evaluate(() => ({
    shellEnabled: document.body.classList.contains("free-module-mode"),
    bodyOverflow: getComputedStyle(document.body).overflowY,
    documentOverflow: getComputedStyle(document.documentElement).overflowY,
    transcriptOverflow: getComputedStyle(document.querySelector("#freeChatView>#chat")).overflowY
  }));
  expect(layout.shellEnabled).toBe(true);
  expect(layout.bodyOverflow).toBe("visible");
  expect(layout.documentOverflow).toBe("scroll");
  expect(layout.transcriptOverflow).toBe("auto");
});


test("Dr.Vas Health mobile page scroll reaches the attachment composer and keeps history in a drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-health-mobile-scroll", email: "health-mobile@example.invalid" };
    isDrvasAdmin = false;
    showModuleSelection();
    selectModule("health", true);
  });
  await expect(page.locator(".chat-history-toggle")).toBeVisible();
  const before = await page.evaluate(() => ({
    rootOverflow: getComputedStyle(document.documentElement).overflowY,
    pageHeight: document.documentElement.scrollHeight,
    viewportHeight: document.documentElement.clientHeight,
    transcriptOverflow: getComputedStyle(document.querySelector("#freeChatView>#chat")).overflowY
  }));
  expect(before.rootOverflow).toBe("scroll");
  expect(before.pageHeight).toBeGreaterThan(before.viewportHeight);
  expect(before.transcriptOverflow).toBe("auto");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY > 0)).toBe(true);
  const attachment = page.locator("#freeChatView .input-area .chat-file-button");
  await expect(attachment).toBeVisible();
  await attachment.scrollIntoViewIfNeeded();
  await expect(attachment).toBeInViewport();
  await page.locator(".chat-history-toggle").click();
  await expect(page.locator("#chatSection .history-panel")).toBeVisible();
  await expect(page.locator("#freeSidebarBrand")).toHaveText("✚ Dr.Vas Health");
});


test("module capabilities open dedicated feature pages instead of one crowded workspace", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-feature-pages-user", email: "owner@example.invalid" };
    isDrvasAdmin = true;
    showModuleSelection();
  });

  await page.evaluate(() => selectModule("studio", true));
  await expect(page.locator("#studioWorkspace .drvas-feature-navigation")).toBeVisible();
  await page.locator('#studioWorkspace [data-feature="book"]').click();
  await expect(page.locator('#studioWorkspace [data-feature-page="book"]')).toBeVisible();
  await expect(page.locator('#studioWorkspace [data-feature-page="book"] h3')).toHaveText("Atelier de cărți și eBookuri");
  await expect(page.locator("#studioDeliverable")).toHaveValue("book");
  await page.locator("#drvasBookStationConcept").fill("Book-only draft");
  await page.locator('#studioWorkspace [data-feature="series"]').click();
  await expect(page.locator("#studioIdea")).not.toHaveValue("Book-only draft");
  await page.locator("#studioIdea").fill("Series-only draft");
  await page.locator('#studioWorkspace [data-feature="book"]').click();
  await expect(page.locator("#drvasBookStationConcept")).toHaveValue("Book-only draft");
  await page.locator('#studioWorkspace [data-feature="video"]').click();
  await expect(page.locator('#studioWorkspace [data-feature-page="video"] #studioRenderCreateButton')).toBeVisible();
  await page.locator('#studioWorkspace [data-feature="projects"]').click();
  await expect(page.locator('#studioWorkspace [data-feature-page="projects"] #studioSavedProjects')).toBeVisible();

  await page.evaluate(() => selectModule("academy", true));
  await expect(page.locator("#academyWorkspace .drvas-feature-navigation")).toBeVisible();
  await page.locator('#academyWorkspace [data-feature="lessons"]').click();
  await expect(page.locator('#academyWorkspace [data-feature-page="lessons"]')).toBeVisible();
  await expect(page.locator("#academyWorkspace #academySubject")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.DrVasAcademyFeature)).toBe("lessons");
  await page.locator("#academySubject").fill("Lesson-only course");
  await page.locator('#academyWorkspace [data-feature="exercises"]').click();
  await expect(page.locator("#academySubject")).not.toHaveValue("Lesson-only course");
  await page.locator("#academySubject").fill("Quiz-only course");
  await page.locator('#academyWorkspace [data-feature="lessons"]').click();
  await expect(page.locator("#academySubject")).toHaveValue("Lesson-only course");
  await page.locator("#academySubject").fill("E2E course");
  await page.evaluate(() => buildAcademyPrompt());
  await expect(page.locator("#question")).toHaveValue(/FOCUS: scrie lecțiile în detaliu/);
  await page.locator('#academyWorkspace [data-feature="exercises"]').click();
  await expect.poll(() => page.evaluate(() => window.DrVasAcademyFeature)).toBe("exercises");
  await page.locator('#academyWorkspace [data-feature="learning-plan"]').click();
  await expect.poll(() => page.evaluate(() => window.DrVasAcademyFeature)).toBe("learning-plan");
  await page.locator('#academyWorkspace [data-feature="courses"]').click();
  await expect(page.locator('#academyWorkspace [data-feature-page="courses"] #academyProjectList')).toBeVisible();
  await expect(page.locator('#academyWorkspace [data-feature-page="course"]')).toBeHidden();

  await page.evaluate(() => selectModule("commerce", true));
  await expect(page.locator("#commerceWorkspace .drvas-feature-navigation")).toBeVisible();
  await page.locator('#commerceWorkspace [data-feature="suppliers"]').click();
  await expect(page.locator('#commerceWorkspace [data-feature-page="suppliers"] #commerceProduct')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.DrVasCommerceFeature)).toBe("suppliers");
  await page.locator("#commerceProduct").fill("Supplier-only product");
  await page.locator('#commerceWorkspace [data-feature="launch"]').click();
  await expect(page.locator("#commerceProduct")).not.toHaveValue("Supplier-only product");
  await page.locator("#commerceProduct").fill("Launch-only product");
  await page.locator('#commerceWorkspace [data-feature="suppliers"]').click();
  await expect(page.locator("#commerceProduct")).toHaveValue("Supplier-only product");
  await page.locator("#commerceProduct").fill("E2E product");
  await page.evaluate(() => buildCommercePrompt());
  await expect(page.locator("#question")).toHaveValue(/FOCUS: construiește o comparație de furnizori/);
  await page.locator('#commerceWorkspace [data-feature="launch"]').click();
  await expect.poll(() => page.evaluate(() => window.DrVasCommerceFeature)).toBe("launch");
  await page.locator('#commerceWorkspace [data-feature="pricing"]').click();
  await expect(page.locator('#commerceWorkspace [data-feature-page="pricing"] #commerceContribution')).toBeVisible();
  await expect(page.locator('#commerceWorkspace [data-feature-page="research"]')).toBeHidden();

  await page.evaluate(() => selectModule("business", true));
  await expect(page.locator("#businessWorkspace .drvas-feature-navigation")).toBeVisible();
  await page.locator('#businessWorkspace [data-feature="cashbook"]').click();
  await expect(page.locator('#businessWorkspace [data-feature-page="cashbook"] #businessLedgerRows')).toBeVisible();
  await page.locator('#businessWorkspace [data-feature="cashflow"]').click();
  await expect(page.locator('#businessWorkspace [data-feature-page="cashflow"] #businessCashflowRows')).toBeVisible();
  await expect(page.locator('#businessWorkspace [data-feature-page="plan"]')).toBeHidden();
});


test("Health information desk opens as its own feature page while the shared chat remains available", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-health-feature-page", email: "health@example.invalid" };
    isDrvasAdmin = false;
    showModuleSelection();
    selectModule("health", true);
  });
  await expect(page.locator("#healthWorkspace .drvas-feature-navigation")).toBeVisible();
  await expect(page.locator('#healthWorkspace [data-feature-page="health-brief"]')).toBeVisible();
  await expect(page.locator("#healthWorkspace #healthBrief")).toBeVisible();
  await expect(page.locator("#chatSection .history-panel")).toBeVisible();
  await expect(page.locator("#freeChatView .input-area .chat-file-button")).toBeVisible();
  await expect(page.locator("#healthDataProcessingConsentWrap")).toBeHidden();
});


test("all six module chats share the same sidebar destinations and attachment composer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-all-chat-shells", email: "owner@example.invalid" };
    isDrvasAdmin = true;
    showModuleSelection();
  });
  const expected = ["＋New chat","▧Images","◷Scheduled","▤Library","⌘Plugins","✧Explore","▣Projects","View all"];
  const defaultFeatures = { free:"", health:"health-brief", studio:"video", academy:"course", commerce:"research", business:"plan" };
  for (const moduleName of ["free","health","studio","academy","commerce","business"]) {
    await page.evaluate(name => selectModule(name, true), moduleName);
    const activeFeature = await page.evaluate(() => activeFeatureKey);
    expect(activeFeature, moduleName + " default feature context").toBe(defaultFeatures[moduleName]);
    await expect(page.locator("#chatSection .history-panel"), moduleName + " sidebar").toBeVisible();
    if (moduleName !== "free") await expect(page.locator("#" + moduleName + "Workspace [data-feature='general']"), moduleName + " general history tab").toBeVisible();
    const shellModes = await page.evaluate(() => ({ free: document.body.classList.contains("free-module-mode"), health: document.body.classList.contains("health-module-mode"), shared: document.body.classList.contains("shared-chat-sidebar-mode") }));
    if (moduleName === "free") expect(shellModes.free).toBe(true);
    else if (moduleName === "health") { expect(shellModes.free).toBe(true); expect(shellModes.health).toBe(true); await expect(page.locator("#healthWorkspace")).toBeVisible(); }
    else expect(shellModes.shared).toBe(true);
    const labels = await page.locator("[data-free-nav]").allTextContents();
    expect(labels.map(value => value.trim()), moduleName + " navigation").toEqual(expected);
    await expect(page.locator("#freeChatView .input-area .chat-file-button"), moduleName + " attachment").toBeVisible();
    await expect(page.locator("#sendButton"), moduleName + " send").toContainText("Trimite");
    await expect(page.locator("#globalLogoutTop")).toBeVisible();
    await expect(page.locator("#globalLogoutBottom")).toBeVisible();
    await page.locator('[data-free-nav="scheduled"]').click();
    await expect(page.locator("#freeNavWorkspace h2")).toHaveText("Scheduled");
    await expect(page.locator("#freeChatView")).toBeHidden();
    await page.locator('[data-free-nav="chat"]').click();
    await expect(page.locator("#freeChatView")).toBeVisible();
  }
  await page.locator("#globalBackToModules").click();
  await expect(page.locator("#globalBackToModules")).toBeHidden();
  await expect(page.locator("#moduleSelectionShell")).toBeVisible();
});

test("module pages expose the page scrollbar and presenter portraits visibly react while speaking", async ({ page }) => {
  await openApp(page, "ro");
  const styles = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const avatar = document.querySelector("#presentationAvatar");
    const presenter = document.querySelector("#presentationPresenter");
    presenter?.classList.add("is-speaking");
    // Reproduce the legacy fitted-chat document lock together with an open module page.
    document.documentElement.classList.add("chat-focus-document");
    document.body.classList.add("chat-focus-mode", "module-workspace-mode");
    const workspaceScroll = getComputedStyle(document.body).overflowY;
    const documentScroll = getComputedStyle(document.documentElement).overflowY;
    const documentHeight = document.documentElement.scrollHeight;
    const viewportHeight = document.documentElement.clientHeight;
    document.body.classList.remove("chat-focus-mode", "module-workspace-mode");
    document.documentElement.classList.remove("chat-focus-document");
    document.body.classList.add("free-module-mode");
    const freeScroll = getComputedStyle(document.body).overflowY;
    return {
      pageScrollbar: root.scrollbarWidth,
      scrollbarColor: root.scrollbarColor,
      workspaceScroll,
      documentScroll,
      documentCanScroll: documentHeight > viewportHeight,
      freeScroll,
      haloAnimation: getComputedStyle(avatar, "::after").animationName
    };
  });
  expect(styles.pageScrollbar).toBe("thin");
  expect(styles.scrollbarColor).toContain("77, 135, 149");
  expect(styles.workspaceScroll).toBe("visible");
  expect(styles.documentScroll).toBe("scroll");
  expect(styles.documentCanScroll).toBe(true);
  expect(styles.freeScroll).toMatch(/auto|scroll/);
  expect(styles.haloAnimation).toBe("presenterVoiceHalo");
});


test("voice accessibility controls remain available in Health and every module workspace", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-module-voice-access", email: "owner@example.invalid" };
    isDrvasAdmin = true;
    showModuleSelection();
  });
  for (const moduleName of ["health", "studio", "academy", "commerce", "business"]) {
    await page.evaluate(name => selectModule(name, true), moduleName);
    await expect(page.locator("#" + moduleName + "Workspace .drvas-module-voice-access"), moduleName + " voice access panel").toBeVisible();
    await expect(page.locator("#" + moduleName + "Workspace .drvas-module-voice-access #voiceMicButton")).toBeVisible();
    await expect(page.locator("#" + moduleName + "Workspace .drvas-module-voice-access #voiceAutoButton")).toBeVisible();
    await expect(page.locator("#" + moduleName + "Workspace .drvas-module-voice-access #liveVoiceButton")).toBeVisible();
    await expect(page.locator(".voice-toolbar")).toHaveCount(1);
  }
  await page.evaluate(() => selectModule("free", true));
  await expect(page.locator("#chatSection .voice-toolbar #voiceMicButton")).toBeVisible();
  await expect(page.locator(".drvas-module-voice-access")).toHaveCount(0);
  await expect(page.locator(".voice-toolbar")).toHaveCount(1);
});


test("landing DNA rails mount independent WebGL 3D geometry with graceful SVG fallback", async ({ page }) => {
  await openApp(page, "ro");
  const rails = page.locator("#heroSection .dna-helix-visual");
  await expect(rails).toHaveCount(2);
  await expect(page.locator("#heroSection .dna-webgl-canvas")).toHaveCount(2);
  await page.waitForFunction(() => [...document.querySelectorAll("#heroSection .dna-helix-visual")]
    .every(node => ["webgl2-or-webgl", "svg-fallback"].includes(node.dataset.dnaRenderer)), null, { timeout: 5000 });
  const state = await rails.evaluateAll(nodes => nodes.map(node => ({
    renderer: node.dataset.dnaRenderer,
    canvasWidth: node.querySelector("canvas").width,
    canvasHeight: node.querySelector("canvas").height,
    fallbackVisible: getComputedStyle(node.querySelector("svg")).visibility !== "hidden"
  })));
  expect(state).toHaveLength(2);
  for (const rail of state) {
    expect(rail.canvasWidth).toBeGreaterThan(0);
    expect(rail.canvasHeight).toBeGreaterThan(0);
    if (rail.renderer === "webgl2-or-webgl") expect(rail.fallbackVisible).toBe(false);
    else expect(rail.fallbackVisible).toBe(true);
  }
  const engine = await page.locator("#drvas-dna-webgl-engine").textContent();
  expect(engine).toContain("drawArrays");
  expect(engine).toContain("createBuffer");
  expect(engine).toContain("cylinder");
  expect(engine).toContain("sphere");
});

test("both landing DNA helices use shaded molecular rails and detailed base pairs", async ({ page }) => {
  await openApp(page, "ro");
  const helices = page.locator("#heroSection .dna-helix-visual");
  await expect(helices).toHaveCount(2);
  for (let index = 0; index < 2; index++) {
    const helix = helices.nth(index);
    await expect(helix.locator(".dna-strand-shadow")).toHaveCount(2);
    await expect(helix.locator(".dna-strand-highlight")).toHaveCount(2);
    await expect(helix.locator(".dna-base-pair")).toHaveCount(19);
    await expect(helix.locator(".dna-base-pair-bead")).toHaveCount(38);
  }
});


test("Studio exposes dedicated Book, Translation, Crypto and Online Income workspaces", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-studio-special-workspaces", email: "owner@example.invalid" };
    isDrvasAdmin = true;
    showModuleSelection();
    selectModule("studio", true);
    const adminPanel = document.getElementById("adminPanel");
    if (adminPanel) { adminPanel.classList.remove("hidden"); adminPanel.hidden = false; }
  });
  for (const feature of ["book", "translation", "crypto", "income-lab"]) {
    await expect(page.locator('#studioWorkspace [data-feature="' + feature + '"]')).toBeVisible();
  }
  await page.locator('#studioWorkspace [data-feature="book"]').click();
  await expect(page.locator("#drvasBookStationConcept")).toBeVisible();
  await expect(page.locator('#studioWorkspace [data-feature-page="book"] .studio-station-submit')).toContainText("Creează și salvează");
  await page.locator('#studioWorkspace [data-feature="translation"]').click();
  await expect(page.locator("#drvasTranslationText")).toBeVisible();
  await expect(page.locator("#drvasTranslationTarget")).toBeVisible();
  await page.locator('#studioWorkspace [data-feature="crypto"]').click();
  await expect(page.locator('#studioWorkspace [data-feature-page="crypto"] .studio-founder-shortcut button')).toBeVisible();
  await expect(page.locator("#cryptoEngineStatus")).toContainText("Mining-ul real rămâne oprit");
  await expect(page.locator("#cryptoEngineScanButton")).toHaveCount(1);
  await page.locator('#studioWorkspace [data-feature="income-lab"]').click();
  await expect(page.locator('#studioWorkspace [data-feature-page="income-lab"] .studio-founder-shortcut button')).toBeVisible();
  await expect(page.locator("#founderDigitalTitle")).toHaveCount(1);
  await expect(page.locator("#founderBookTitle")).toHaveCount(1);
});


test("voice replies remain replayable when auto-read is off and replay with their original assistant voice", async ({ page }) => {
  await openApp(page, "ro");
  const result = await page.evaluate(async () => {
    currentUser = { id: "e2e-voice-replay-owner" };
    voiceAutoRead = false;
    activeAssistant = "jan";
    await speakDrVas("Acesta este răspunsul scris de Dr.Jan.");
    const storedText = lastSpokenAnswer;
    const storedSpeaker = lastSpokenAssistant;
    window.__replaySpeaker = "";
    window.playAssistantVoice = async (_text, _force, speaker) => {
      window.__replaySpeaker = speaker;
      return true;
    };
    activeAssistant = "aurora";
    replayLastAnswer();
    voiceAutoRead = false;
    currentUser = { id: "e2e-voice-preference-owner" };
    toggleVoiceOutput();
    const preference = localStorage.getItem("drvas_voice_auto_read_e2e-voice-preference-owner");
    return { storedText, storedSpeaker, replaySpeaker: window.__replaySpeaker, preference };
  });
  expect(result.storedText).toContain("Dr.Jan");
  expect(result.storedSpeaker).toBe("jan");
  expect(result.replaySpeaker).toBe("jan");
  expect(result.preference).toBe("true");
});


test("all six modules keep independent conversation IDs and restore their own thread", async ({ page }) => {
  await openApp(page, "ro");
  const state = await page.evaluate(() => {
    currentUser = { id: "e2e-six-module-thread-isolation", email: "threads@example.invalid" };
    isDrvasAdmin = true;
    ensureConversationMetadata = async () => {};
    loadConversationList = async () => [];
    openConversation = async () => {};
    activeModule = "free";
    currentConversationId = "thread-free";
    rememberActiveConversation(currentConversationId, "free");
    const modules = ["free", "health", "studio", "academy", "commerce", "business"];
    const firstPass = { free: currentConversationId };
    for (const moduleName of modules.slice(1)) {
      selectModule(moduleName, true);
      firstPass[moduleName] = currentConversationId;
    }
    const restored = {};
    for (const moduleName of modules) {
      selectModule(moduleName, true);
      restored[moduleName] = currentConversationId;
    }
    return { firstPass, restored, ids: Object.values(firstPass) };
  });
  expect(new Set(state.ids).size).toBe(6);
  for (const moduleName of ["free", "health", "studio", "academy", "commerce", "business"]) {
    expect(state.restored[moduleName], moduleName + " restores only its own thread").toBe(state.firstPass[moduleName]);
  }
});


test("feature workspaces keep separate chat threads within each module", async ({ page }) => {
  await openApp(page, "ro");
  const result = await page.evaluate(() => {
    currentUser = { id: "e2e-feature-thread-isolation", email: "features@example.invalid" };
    ensureConversationMetadata = async () => {};
    loadConversationList = async () => [];
    const contexts = [
      ["studio", "book"], ["studio", "translation"], ["studio", "video"],
      ["academy", "course"], ["academy", "lessons"],
      ["commerce", "research"], ["commerce", "suppliers"],
      ["business", "cashbook"], ["business", "cashflow"], ["business", "break-even"],
      ["health", "health-brief"]
    ];
    const first = {};
    for (const [moduleName, featureKey] of contexts) {
      activeModule = moduleName;
      drvasSetFeatureContext(moduleName, featureKey);
      first[moduleName + ":" + featureKey] = currentConversationId;
    }
    const restored = {};
    for (const [moduleName, featureKey] of contexts) {
      activeModule = moduleName;
      drvasSetFeatureContext(moduleName, "");
      drvasSetFeatureContext(moduleName, featureKey);
      restored[moduleName + ":" + featureKey] = currentConversationId;
    }
    return { first, restored, ids: Object.values(first) };
  });
  expect(new Set(result.ids).size).toBe(11);
  for (const key of Object.keys(result.first)) expect(result.restored[key], key + " restores its own feature thread").toBe(result.first[key]);
});


test("sidebar history is filtered by both module and feature without hiding general legacy module threads", async ({ page }) => {
  await openApp(page, "ro");
  const result = await page.evaluate(async () => {
    currentUser = { id: "e2e-feature-history-filter", email: "history@example.invalid" };
    getConversationIds = async () => [
      { id:"studio-book", module:"studio", feature_key:"book", title:"Book", date:new Date().toISOString() },
      { id:"studio-translation", module:"studio", feature_key:"translation", title:"Translation", date:new Date().toISOString() },
      { id:"studio-general", module:"studio", feature_key:null, title:"General", date:new Date().toISOString() },
      { id:"health-brief", module:"health", feature_key:"health-brief", title:"Health", date:new Date().toISOString() },
      { id:"legacy-unknown", module:null, feature_key:null, title:"Legacy", date:new Date().toISOString() }
    ];
    activeModule="studio"; activeFeatureKey="book";
    await loadConversationList();
    const book=[...document.querySelectorAll("#conversationList .conversation-item")].map(node=>node.dataset.id);
    activeFeatureKey="";
    await loadConversationList();
    const general=[...document.querySelectorAll("#conversationList .conversation-item")].map(node=>node.dataset.id);
    activeModule="health"; activeFeatureKey="health-brief";
    await loadConversationList();
    const health=[...document.querySelectorAll("#conversationList .conversation-item")].map(node=>node.dataset.id);
    activeModule="free"; activeFeatureKey="";
    await loadConversationList();
    const free=[...document.querySelectorAll("#conversationList .conversation-item")].map(node=>node.dataset.id);
    return {book,general,health,free};
  });
  expect(result.book).toEqual(["studio-book"]);
  expect(result.general).toEqual(["studio-general"]);
  expect(result.health).toEqual(["health-brief"]);
  expect(result.free).toEqual(["legacy-unknown"]);
});


test("Free and Health provide independent document and transcript scrollbars with a persistent desktop sidebar", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, "ro");
  for (const moduleName of ["free", "health"]) {
    await page.evaluate(name => {
      currentUser = { id: "e2e-independent-scroll-" + name, email: "scroll@example.invalid" };
      isDrvasAdmin = true;
      showModuleSelection();
      selectModule(name, true);
      const transcript = document.querySelector("#freeChatView>#chat");
      transcript.innerHTML = Array.from({ length: 24 }, (_, index) =>
        '<div class="msg assistant" style="min-height:74px;margin:10px 0;padding:12px">Independent transcript scroll test ' + index + '</div>'
      ).join("");
      window.scrollTo(0, 0);
      transcript.scrollTop = 0;
    }, moduleName);

    const initial = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      const transcript = document.querySelector("#freeChatView>#chat");
      const sidebar = document.querySelector("#chatSection .history-panel");
      return {
        rootOverflowY: getComputedStyle(root).overflowY,
        bodyOverflowY: getComputedStyle(body).overflowY,
        rootHeight: root.scrollHeight,
        rootClient: root.clientHeight,
        pageMax: document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight,
        transcriptOverflowY: getComputedStyle(transcript).overflowY,
        transcriptHeight: transcript.clientHeight,
        transcriptScrollHeight: transcript.scrollHeight,
        sidebarDisplay: getComputedStyle(sidebar).display,
        sidebarWidth: sidebar.getBoundingClientRect().width
      };
    });
    expect(initial.rootOverflowY, moduleName + " document root overflow").toMatch(/auto|scroll/);
    expect(initial.bodyOverflowY, moduleName + " body overflow may be visible while the document root scrolls").toMatch(/auto|scroll|visible/);
    expect(initial.pageMax, moduleName + " page must have a real scroll range").toBeGreaterThan(0);
    expect(initial.transcriptOverflowY, moduleName + " transcript overflow").toMatch(/auto|scroll/);
    expect(initial.transcriptScrollHeight, moduleName + " transcript must overflow independently").toBeGreaterThan(initial.transcriptHeight);
    expect(initial.sidebarDisplay, moduleName + " desktop sidebar display").not.toBe("none");
    expect(initial.sidebarWidth, moduleName + " desktop sidebar width").toBeGreaterThan(180);

    const independent = await page.evaluate(() => {
      const transcript = document.querySelector("#freeChatView>#chat");
      const scroller = document.scrollingElement;
      const beforeChat = transcript.scrollTop;
      scroller.scrollTop = Math.min(120, scroller.scrollHeight - scroller.clientHeight);
      const pageMovedWithoutChat = scroller.scrollTop > 0 && transcript.scrollTop === beforeChat;
      const beforePage = scroller.scrollTop;
      transcript.scrollTop = Math.min(120, transcript.scrollHeight - transcript.clientHeight);
      return {
        pageMovedWithoutChat,
        chatMovedWithoutPage: transcript.scrollTop > 0 && scroller.scrollTop === beforePage
      };
    });
    expect(independent.pageMovedWithoutChat, moduleName + " page scrolling must not move chat").toBe(true);
    expect(independent.chatMovedWithoutPage, moduleName + " chat scrolling must not move page").toBe(true);
  }
});

test("mobile Free and Health retain page scrolling and expose history in the sidebar drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page, "ro");
  for (const moduleName of ["free", "health"]) {
    await page.evaluate(name => {
      currentUser = { id: "e2e-mobile-independent-scroll-" + name, email: "mobile-scroll@example.invalid" };
      isDrvasAdmin = true;
      showModuleSelection();
      selectModule(name, true);
      const transcript = document.querySelector("#freeChatView>#chat");
      transcript.innerHTML = Array.from({ length: 18 }, (_, index) =>
        '<div class="msg assistant" style="min-height:70px;margin:8px 0;padding:10px">Mobile transcript scroll test ' + index + '</div>'
      ).join("");
      window.scrollTo(0, 0);
    }, moduleName);
    const state = await page.evaluate(() => ({
      pageRange: document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight,
      transcriptOverflow: document.querySelector("#freeChatView>#chat").scrollHeight >
        document.querySelector("#freeChatView>#chat").clientHeight,
      sidebarInitiallyHidden: getComputedStyle(document.querySelector("#chatSection .history-panel")).display === "none"
    }));
    expect(state.pageRange, moduleName + " mobile page scroll range").toBeGreaterThan(0);
    expect(state.transcriptOverflow, moduleName + " mobile transcript scroll").toBe(true);
    expect(state.sidebarInitiallyHidden, moduleName + " mobile history starts as a drawer").toBe(true);
    await page.evaluate(() => document.body.classList.add("history-open"));
    await expect(page.locator("#chatSection .history-panel")).toBeVisible();
  }
});


test("changing the selected language localizes the Dr.Vas, Dr.Jan and Sarah welcome UI", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-language-user" };
    // Keep the synthetic E2E user stable while testing language changes; the
    // auth lifecycle is covered by dedicated session-restoration tests.
    checkSession = () => {};
    activeModule = "free";
    activeAssistant = "drvas";
    document.querySelector("#chatSection").classList.remove("hidden");
    renderWelcome();
    selectAssistant("drvas");
  });

  await page.locator("#languageGate").evaluate(node => node.classList.add("hidden"));
  await page.locator("#languageSwitch").click();
  await page.getByRole("button", { name: /English/ }).click();

  await expect(page.locator("#heroChatCta")).toContainText("Talk to Dr.Vas");
  await expect(page.locator("#assistantIntro")).toHaveText("Main assistant for analysis, clear answers and practical help.");
  await expect(page.locator("#chat .msg.bot").first()).toContainText("Welcome! I'm Dr.Vas.");
  await expect(page.locator("#chat .msg.bot").first()).toContainText("New messages and replies are saved automatically to your account.");
  await expect(page.locator("#languageSwitch")).toContainText("Language");

  const localized = await page.evaluate(() => {
    const result = {};
    for (const assistant of ["drvas", "jan", "aurora"]) {
      activeAssistant = assistant;
      renderWelcome();
      result[assistant] = document.querySelector("#chat .msg.bot")?.textContent || "";
    }
    return result;
  });
  expect(localized.drvas).toContain("Welcome! I'm Dr.Vas.");
  expect(localized.jan).toContain("Hello! I'm Dr.Jan.");
  expect(localized.aurora).toContain("Welcome! I'm Sarah.");
});


test("shared navigation and presentation controls localize across all supported languages", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => { checkSession = () => {}; });

  const cases = [
    ["en", "Language", "Talk to Dr.Vas", "Open presentation", "TALK TO DR.VAS"],
    ["it", "Lingua", "Parla con Dr.Vas", "Apri la presentazione", "PARLA CON DR.VAS"],
    ["tr", "Dil", "Dr.Vas ile konuş", "Tanıtımı aç", "DR.VAS İLE KONUŞ"],
    ["de", "Sprache", "Sprich mit Dr.Vas", "Präsentation öffnen", "MIT DR.VAS SPRECHEN"],
    ["fr", "Langue", "Parler à Dr.Vas", "Ouvrir la présentation", "PARLER À DR.VAS"],
    ["es", "Idioma", "Habla con Dr.Vas", "Abrir presentación", "HABLA CON DR.VAS"],
    ["ru", "Язык", "Поговорить с Dr.Vas", "Открыть презентацию", "ПОГОВОРИТЕ С DR.VAS"]
  ];

  for (const [language, languageLabel, chatLabel, presentationLabel, headerLabel] of cases) {
    await page.evaluate(code => chooseLanguage(code), language);
    await expect(page.locator("#languageSwitch")).toContainText(languageLabel);
    await expect(page.locator("#heroChatCta")).toContainText(chatLabel);
    await expect(page.locator("#heroPresentationOpenButton")).toContainText(presentationLabel);
    await expect(page.locator("#headerChatCta")).toContainText(headerLabel);
  }
});

test("Dr.Vas Free navigation and Health workspace localize in all supported languages", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => { checkSession = () => {}; });

  const cases = [
    ["en", "Images", "New chat", "GENERAL INFORMATION", "Informational support, not a diagnosis.", "Understanding a medical test result", "Understand the terms and explanations", "Chat with Dr.Vas Health"],
    ["it", "Immagini", "Nuova chat", "INFORMAZIONI GENERALI", "Un supporto informativo, non una diagnosi.", "Spiegazione di un risultato medico", "Comprendere i termini e le spiegazioni", "Chatta con Dr.Vas Health"],
    ["tr", "Görseller", "Yeni sohbet", "GENEL BİLGİLER", "Bilgilendirici destek; teşhis değildir.", "Tıbbi test sonucunu açıklama", "Terimleri ve açıklamaları anlamak", "Dr.Vas Health ile sohbet et"],
    ["de", "Bilder", "Neuer Chat", "ALLGEMEINE INFORMATIONEN", "Informative Unterstützung, keine Diagnose.", "Einen medizinischen Befund erklären", "Begriffe und Erklärungen verstehen", "Mit Dr.Vas Health chatten"],
    ["fr", "Images", "Nouvelle discussion", "INFORMATIONS GÉNÉRALES", "Un soutien informatif, pas un diagnostic.", "Comprendre un résultat médical", "Comprendre les termes et les explications", "Discuter avec Dr.Vas Health"],
    ["es", "Imágenes", "Nuevo chat", "INFORMACIÓN GENERAL", "Apoyo informativo, no un diagnóstico.", "Explicar un resultado médico", "Entender los términos y las explicaciones", "Chatear con Dr.Vas Health"],
    ["ru", "Изображения", "Новый чат", "ОБЩАЯ ИНФОРМАЦИЯ", "Информационная помощь, а не диагноз.", "Объяснение результата медицинского анализа", "Понять термины и объяснения", "Обсудить с Dr.Vas Health"]
  ];

  for (const [language, images, newChat, healthTag, disclaimer, topic, goal, action] of cases) {
    await page.evaluate(code => chooseLanguage(code), language);
    await expect(page.locator('[data-free-nav="images"]')).toContainText(images);
    await expect(page.locator('[data-free-nav="chat"]')).toContainText(newChat);
    await expect(page.locator("#healthWorkspace .studio-beta-label")).toContainText(healthTag);
    await expect(page.locator("#healthWorkspace .studio-production-standard strong")).toHaveText(disclaimer);
    await expect(page.locator("#healthTopic option").first()).toHaveText(topic);
    await expect(page.locator("#healthGoal option").first()).toHaveText(goal);
    await expect(page.locator('#healthWorkspace button[onclick="window.buildHealthPrompt()"]')).toContainText(action);
  }
});


test("Dr.Vas Studio production workspace localizes its core controls in all supported languages", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => { checkSession = () => {}; });

  const cases = [
    ["en", "Production studio for scripts, vertical videos, subtitles and digital assets.", "CREATIVE WORKSPACE", "VPC founder's voice — being configured", "Drama series / episode", "Realistic cinematic", "General audience", "30–60 seconds", "Vertical 9:16", "Render MP4 video"],
    ["it", "Studio di produzione per sceneggiature, video verticali, sottotitoli e contenuti digitali.", "SPAZIO CREATIVO", "Voce del fondatore VPC — in configurazione", "Serie / episodio drammatico", "Cinematografico realistico", "Pubblico generale", "30–60 secondi", "Verticale 9:16", "Crea video MP4"],
    ["tr", "Senaryolar, dikey videolar, altyazılar ve dijital içerikler için prodüksiyon stüdyosu.", "YARATICI ÇALIŞMA ALANI", "VPC kurucusunun sesi — yapılandırılıyor", "Dizi / dramatik bölüm", "Gerçekçi sinematik", "Genel kitle", "30–60 saniye", "Dikey 9:16", "MP4 video oluştur"],
    ["de", "Produktionsstudio für Drehbücher, Hochkantvideos, Untertitel und digitale Inhalte.", "KREATIVER ARBEITSBEREICH", "Stimme des VPC-Gründers — wird eingerichtet", "Dramaserie / Episode", "Realistisch-kinematografisch", "Allgemeines Publikum", "30–60 Sekunden", "Hochformat 9:16", "MP4-Video rendern"],
    ["fr", "Studio de production pour scénarios, vidéos verticales, sous-titres et contenus numériques.", "ESPACE CRÉATIF", "Voix du fondateur VPC — en cours de configuration", "Série / épisode dramatique", "Cinématographique réaliste", "Grand public", "30–60 secondes", "Vertical 9:16", "Rendre la vidéo MP4"],
    ["es", "Estudio de producción para guiones, vídeos verticales, subtítulos y contenidos digitales.", "ESPACIO CREATIVO", "Voz del fundador de VPC — en configuración", "Serie / episodio dramático", "Cinematográfico realista", "Público general", "30–60 segundos", "Vertical 9:16", "Renderizar vídeo MP4"],
    ["ru", "Студия производства сценариев, вертикальных видео, субтитров и цифровых материалов.", "ТВОРЧЕСКОЕ ПРОСТРАНСТВО", "Голос основателя VPC — настраивается", "Драматический сериал / эпизод", "Реалистичный кинематографичный", "Широкая аудитория", "30–60 секунд", "Вертикальный 9:16", "Создать видео MP4"]
  ];

  for (const [language, description, workspace, voice, deliverable, style, audience, duration, aspect, render] of cases) {
    await page.evaluate(code => chooseLanguage(code), language);
    await expect(page.locator("#studioWorkspace .studio-workspace-head p")).toHaveText(description);
    await expect(page.locator("#studioWorkspace > .studio-workspace-head .studio-beta-label")).toHaveText(workspace);
    await expect(page.locator("#studioNarration option").first()).toHaveText(voice);
    await expect(page.locator("#studioDeliverable option").first()).toHaveText(deliverable);
    await expect(page.locator("#studioTone option").first()).toHaveText(style);
    await expect(page.locator("#studioAudience option").first()).toHaveText(audience);
    await expect(page.locator("#studioDuration option").first()).toHaveText(duration);
    await expect(page.locator("#studioAspect option").first()).toHaveText(aspect);
    await expect(page.locator("#studioRenderCreateButton")).toContainText(render);
  }
});


test("Academy and Commerce workspaces localize their core controls in all supported languages", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => { checkSession = () => {}; });

  const cases = [
    ["en", "Build courses and learning paths with lessons, exercises and practical projects.", "PILOT · ADMIN ACCESS", "Course subject", "Beginner", "5-lesson mini-course", "Romanian", "Build course", "Analyse products, suppliers, costs and margins before investing money.", "United Kingdom", "Dropshipping", "Shopify", "Analyse opportunity", "Currency", "Product cost / unit"],
    ["it", "Crea corsi e percorsi di apprendimento con lezioni, esercizi e progetti pratici.", "PILOTA · ACCESSO AMMINISTRATORE", "Argomento del corso", "Principiante", "Mini-corso di 5 lezioni", "Rumeno", "Crea il corso", "Analizza prodotti, fornitori, costi e margini prima di investire denaro.", "Regno Unito", "Dropshipping", "Shopify", "Analizza l'opportunità", "Valuta", "Costo prodotto / unità"],
    ["tr", "Dersler, alıştırmalar ve uygulamalı projelerle kurslar ve öğrenme yolları oluşturun.", "PİLOT · YÖNETİCİ ERİŞİMİ", "Kurs konusu", "Başlangıç", "5 derslik mini kurs", "Romence", "Kursu oluştur", "Para yatırmadan önce ürünleri, tedarikçileri, maliyetleri ve kâr marjlarını analiz edin.", "Birleşik Krallık", "Dropshipping", "Shopify", "Fırsatı analiz et", "Para birimi", "Ürün maliyeti / birim"],
    ["de", "Erstelle Kurse und Lernpfade mit Lektionen, Übungen und praktischen Projekten.", "PILOT · ADMIN-ZUGANG", "Kursthema", "Anfänger", "Mini-Kurs mit 5 Lektionen", "Rumänisch", "Kurs erstellen", "Analysiere Produkte, Lieferanten, Kosten und Margen, bevor du Geld investierst.", "Vereinigtes Königreich", "Dropshipping", "Shopify", "Möglichkeit analysieren", "Währung", "Produktkosten / Stück"],
    ["fr", "Créez des cours et des parcours d’apprentissage avec des leçons, des exercices et des projets pratiques.", "PILOTE · ACCÈS ADMINISTRATEUR", "Sujet du cours", "Débutant", "Mini-cours de 5 leçons", "Roumain", "Créer le cours", "Analysez les produits, fournisseurs, coûts et marges avant d’investir de l’argent.", "Royaume-Uni", "Dropshipping", "Shopify", "Analyser l’opportunité", "Devise", "Coût du produit / unité"],
    ["es", "Crea cursos y rutas de aprendizaje con lecciones, ejercicios y proyectos prácticos.", "PILOTO · ACCESO DE ADMINISTRADOR", "Tema del curso", "Principiante", "Minicurso de 5 lecciones", "Rumano", "Crear curso", "Analiza productos, proveedores, costes y márgenes antes de invertir dinero.", "Reino Unido", "Dropshipping", "Shopify", "Analizar oportunidad", "Moneda", "Coste del producto / unidad"],
    ["ru", "Создавайте курсы и учебные программы с уроками, упражнениями и практическими проектами.", "ПИЛОТ · ДОСТУП АДМИНИСТРАТОРА", "Тема курса", "Начальный", "Мини-курс из 5 уроков", "Румынский", "Создать курс", "Анализируйте товары, поставщиков, расходы и маржу до вложения денег.", "Великобритания", "Дропшиппинг", "Shopify", "Анализировать возможность", "Валюта", "Стоимость товара / единица"]
  ];
  for (const [language, academyDescription, pilotLabel, subject, level, format, courseLanguage, academyAction, commerceDescription, market, model, channel, commerceAction, currency, unitCost] of cases) {
    await page.evaluate(code => chooseLanguage(code), language);

    await expect(page.locator("#academyWorkspace .studio-workspace-head > div > p")).toHaveText(academyDescription);
    await expect(page.locator("#academyWorkspace .studio-workspace-head > .studio-beta-label")).toHaveText(pilotLabel);
    await expect(page.locator("#academySubject").locator("xpath=..")).toContainText(subject);
    await expect(page.locator("#academyLevel option").first()).toHaveText(level);
    await expect(page.locator("#academyFormat option").first()).toHaveText(format);
    await expect(page.locator("#academyLanguage option").first()).toHaveText(courseLanguage);
    await expect(page.locator('#academyWorkspace button[onclick="buildAcademyPrompt()"]')).toContainText(academyAction);

    await expect(page.locator("#commerceWorkspace .studio-workspace-head > div > p")).toHaveText(commerceDescription);
    await expect(page.locator("#commerceWorkspace .studio-workspace-head > .studio-beta-label")).toHaveText(pilotLabel);
    await expect(page.locator("#commerceMarket option").first()).toHaveText(market);
    await expect(page.locator("#commerceModel option").first()).toHaveText(model);
    await expect(page.locator("#commerceChannel option").first()).toHaveText(channel);
    await expect(page.locator("#commerceWorkspace .crypto-calculator h5")).toContainText("Commerce");
    await expect(page.locator("#commerceCurrency").locator("xpath=..")).toContainText(currency);
    await expect(page.locator("#commerceUnitCost").locator("xpath=..")).toContainText(unitCost);
    await expect(page.locator('#commerceWorkspace button[onclick="buildCommercePrompt()"]')).toContainText(commerceAction);
  }
});

test("Business workspace localizes its plan, cashbook, cashflow, break-even and Student Desk in all supported languages", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    checkSession = () => {};
    selectModule("business", true);
  });

  const cases = [
    ["en", "Turn an idea into a business plan, budget and implementation steps.", "PILOT · ADMIN ACCESS", "Business idea / sector", "Create business plan", "Dr.Vas Books — Income and expense ledger", "Cashflow — period report", "Check the assumptions: price must be higher than variable cost, and costs cannot be negative.", "Review draft and create feedback", "Sign in to access the private ledger.", "Save"],
    ["it", "Trasforma un'idea in un piano aziendale, un budget e fasi di attuazione.", "PILOTA · ACCESSO AMMINISTRATORE", "Idea / settore aziendale", "Crea il piano aziendale", "Dr.Vas Books — Registro di entrate e uscite", "Cashflow — rapporto per periodo", "Verifica le ipotesi: il prezzo deve essere superiore al costo variabile e i costi non possono essere negativi.", "Analizza la bozza e crea un feedback", "Accedi per accedere al registro privato.", "Salva"],
    ["tr", "Bir fikri iş planına, bütçeye ve uygulama adımlarına dönüştür.", "PİLOT · YÖNETİCİ ERİŞİMİ", "İş fikri / sektör", "İş planı oluştur", "Dr.Vas Books — Gelir ve gider defteri", "Nakit akışı — dönem raporu", "Varsayımları kontrol edin: fiyat değişken maliyetten yüksek olmalı ve maliyetler negatif olamaz.", "Taslağı analiz et ve geri bildirim oluştur", "Özel deftere erişmek için giriş yapın.", "Kaydet"],
    ["de", "Verwandle eine Idee in einen Geschäftsplan, ein Budget und Umsetzungsschritte.", "PILOT · ADMIN-ZUGANG", "Geschäftsidee / Branche", "Geschäftsplan erstellen", "Dr.Vas Books — Einnahmen- und Ausgabenbuch", "Cashflow — Zeitraumbericht", "Überprüfe die Annahmen: Der Preis muss über den variablen Kosten liegen, und Kosten dürfen nicht negativ sein.", "Entwurf analysieren und Feedback erstellen", "Melde dich an, um auf das private Kassenbuch zuzugreifen.", "Speichern"],
    ["fr", "Transformez une idée en plan d'affaires, budget et étapes de mise en œuvre.", "PILOTE · ACCÈS ADMINISTRATEUR", "Idée / secteur d'activité", "Créer le plan d'affaires", "Dr.Vas Books — Registre des recettes et dépenses", "Trésorerie — rapport par période", "Vérifiez les hypothèses : le prix doit être supérieur au coût variable et les coûts ne peuvent pas être négatifs.", "Analyser le brouillon et créer un retour", "Connectez-vous pour accéder au registre privé.", "Enregistrer"],
    ["es", "Convierte una idea en un plan de negocio, presupuesto y pasos de implementación.", "PILOTO · ACCESO DE ADMINISTRADOR", "Idea / sector empresarial", "Crear plan de negocio", "Dr.Vas Books — Registro de ingresos y gastos", "Flujo de caja — informe por período", "Comprueba las hipótesis: el precio debe ser superior al coste variable y los costes no pueden ser negativos.", "Analizar el borrador y generar comentarios", "Inicia sesión para acceder al registro privado.", "Guardar"],
    ["ru", "Превратите идею в бизнес-план, бюджет и этапы реализации.", "ПИЛОТ · ДОСТУП АДМИНИСТРАТОРА", "Бизнес-идея / сфера деятельности", "Создать бизнес-план", "Dr.Vas Books — Учёт доходов и расходов", "Денежный поток — отчёт за период", "Проверьте исходные данные: цена должна быть выше переменных затрат, а расходы не могут быть отрицательными.", "Проанализировать черновик и подготовить отзыв", "Войдите, чтобы открыть личный журнал.", "Сохранить"]
  ];

  for (const [language, description, pilot, ideaLabel, planAction, cashbookTitle, cashflowTitle, breakEvenError, studentAction, ledgerStatus, saveLabel] of cases) {
    await page.evaluate(code => chooseLanguage(code), language);

    await expect(page.locator("#businessWorkspace .studio-workspace-head > div > p")).toHaveText(description);
    await expect(page.locator("#businessWorkspace .studio-workspace-head > .studio-beta-label")).toHaveText(pilot);
    await expect(page.locator("#businessIdea").locator("xpath=..")).toContainText(ideaLabel);
    await expect(page.locator('#businessWorkspace button[onclick="buildBusinessPrompt()"]')).toHaveText(planAction);
    await expect(page.locator("#businessCashbookTitle")).toContainText(cashbookTitle);
    await expect(page.locator("#businessCashflowTitle")).toContainText(cashflowTitle);
    await expect(page.locator('#businessWorkspace button[onclick="buildStudentAssessmentPrompt()"]')).toHaveText(studentAction);
    await expect(page.locator('#businessWorkspace button[onclick="saveStudentAssessmentProject()"]')).toHaveText(saveLabel);

    await page.evaluate(() => {
      document.getElementById("businessUnitPrice").value = "10";
      document.getElementById("businessVariableCost").value = "10";
      calculateBusinessBreakEven();
      businessLedgerStatus("Conectează-te pentru a accesa registrul privat.", true);
    });
    await expect(page.locator("#businessBreakEvenStatus")).toHaveText(breakEvenError);
    await expect(page.locator("#businessLedgerStatus")).toHaveText(ledgerStatus);
  }
});

test("all module feature-navigation labels, headings and descriptions localize in every supported language", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    checkSession = () => {};
    currentUser = { id: "e2e-feature-navigation-i18n", email: "admin@example.invalid" };
    isDrvasAdmin = true;
  });
  for (const moduleName of ["health", "studio", "academy", "commerce", "business"]) {
    await page.evaluate(name => selectModule(name, true), moduleName);
  }

  for (const moduleName of ["health", "studio", "academy", "commerce", "business"]) {
    await expect(page.locator(`#${moduleName}Workspace .drvas-feature-navigation`)).toHaveCount(1);
    await expect(page.locator(`#${moduleName}Workspace .drvas-feature-page-heading`).first()).toHaveCount(1);
  }

  const languages = ["en", "it", "tr", "de", "fr", "es", "ru"];
  const unchangedRomanianWithoutDiacritics = [
    "Plan de afaceri",
    "Contabilitate / registru",
    "Raport Cashflow",
    "Prag de rentabilitate",
    "Calculator Business",
    "Proiectele mele",
    "Proiecte Studio",
    "Scrie serial / scenariu",
    "Venituri online & produse",
    "Cursurile mele",
    "Constructor de cursuri",
    "Scrie lecțiile",
    "Atelier de lecții",
    "Traseu de învățare",
    "Proiectele mele Academy",
    "Cercetează produsul",
    "Compară furnizorii",
    "Verificarea furnizorilor",
    "Plan de lansare magazin",
    "Calculează prețul și marja",
    "Calculator de preț și profitabilitate",
    "Analizele mele",
    "Proiecte Commerce salvate"
  ];

  for (const language of languages) {
    await page.evaluate(code => chooseLanguage(code), language);
    const copy = await page.evaluate(() => {
      const roots = ["health", "studio", "academy", "commerce", "business"]
        .map(name => document.getElementById(name + "Workspace"))
        .filter(Boolean);
      return roots.flatMap(root => [
        ...root.querySelectorAll(".drvas-feature-navigation button"),
        ...root.querySelectorAll(".drvas-feature-page-heading h3, .drvas-feature-page-heading p")
      ]).map(node => node.textContent.trim()).filter(Boolean);
    });
    const untranslatedRomanian = copy.filter(value => /[ăâîșțĂÂÎȘȚ]/.test(value));
    expect(untranslatedRomanian, `Romanian navigation copy remains in ${language}: ${untranslatedRomanian.join(" | ")}`).toEqual([]);
    const unchangedLabels = copy.filter(value => unchangedRomanianWithoutDiacritics.includes(value));
    expect(unchangedLabels, `Romanian labels remain in ${language}: ${unchangedLabels.join(" | ")}`).toEqual([]);
  }
});
