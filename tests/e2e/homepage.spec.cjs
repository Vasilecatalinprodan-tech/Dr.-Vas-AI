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
  await expect(page.locator(".chat-back-button")).toContainText("Înapoi la module");
  await expect(page.locator(".chat-logout-button")).toBeVisible();
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
    await expect(page.locator("#chatSection .history-panel")).toBeHidden();
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
  await expect(page.locator("#chatSection .history-panel")).toBeHidden();
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
  expect(layout.count, `Expected one grid track, received "${layout.value}"`).toBe(1);
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

test("non-admin users can open public Free and Health but not the four future paid workspaces", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    currentUser = { id: "e2e-standard-user", email: "standard@example.invalid" };
    isDrvasAdmin = false;
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

  // The Business workspace is already active after the project loop; avoid re-entering it while its project list refresh is still resolving.
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
  await expect(page.locator("#cryptoCalcNotice")).toContainText("nu sunt predicții");
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

test("Dr.Vas presentation covers all six modules in all eight supported languages and narrates in the selected language", async ({ page }) => {
  await openApp(page, "ro");
  await page.evaluate(() => {
    checkSession = async () => {};
    showModuleSelection();
    openDrvasPresentation();
  });

  await expect(page.locator("#drvasPresentation")).toBeVisible();
  await expect(page.locator("#presentationModuleGrid .presentation-module")).toHaveCount(6);
  await expect(page.locator("#drvasPresentationDisclaimer")).toContainText("în dezvoltare");

  const languages = [
    ["ro", "ro-RO", "Deschide prezentarea", "Închide prezentarea"],
    ["en", "en-GB", "Open presentation", "Close presentation"],
    ["it", "it-IT", "Apri la presentazione", "Chiudi la presentazione"],
    ["tr", "tr-TR", "Tanıtımı aç", "Tanıtımı kapat"],
    ["de", "de-DE", "Präsentation öffnen", "Präsentation schließen"],
    ["fr", "fr-FR", "Ouvrir la présentation", "Fermer la présentation"],
    ["es", "es-ES", "Abrir presentación", "Cerrar presentación"],
    ["ru", "ru-RU", "Открыть презентацию", "Закрыть презентацию"]
  ];
  const controlLabels = {
    ro: ["Deschide prezentarea", "Închide prezentarea"],
    en: ["Open presentation", "Close presentation"],
    it: ["Apri la presentazione", "Chiudi la presentazione"],
    tr: ["Tanıtımı aç", "Tanıtımı kapat"],
    de: ["Präsentation öffnen", "Präsentation schließen"],
    fr: ["Ouvrir la présentation", "Fermer la présentation"],
    es: ["Abrir presentación", "Cerrar presentación"],
    ru: ["Открыть презентацию", "Закрыть презентацию"]
  };

  for (const [language, locale] of languages) {
    await page.evaluate(code => chooseLanguage(code), language);
    await expect(page.locator("#presentationModuleGrid .presentation-module")).toHaveCount(6);
    await expect(page.locator("#presentationOpenButton")).toContainText(controlLabels[language][0]);
    await expect(page.locator("#presentationCloseButton")).toHaveAttribute("aria-label", controlLabels[language][1]);
    const title = await page.locator("#drvasPresentationTitle").textContent();
    expect(title.trim().length).toBeGreaterThan(3);
    const narration = await page.evaluate(() => {
      let spoken = null;
      const synth = {
        getVoices: () => [],
        addEventListener() {},
        removeEventListener() {},
        cancel() {},
        resume() {},
        speak: utterance => { spoken = { text: utterance.text, lang: utterance.lang }; }
      };
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: synth });
      window.SpeechSynthesisUtterance = function (text) { this.text = text; };
      speakDrvasPresentation();
      return spoken;
    });
    expect(narration.text).toContain(title.trim());
    expect(narration.lang).toBe(locale);
  }

  await page.evaluate(() => closeDrvasPresentation());
  await expect(page.locator("#drvasPresentation")).toBeHidden();
});
