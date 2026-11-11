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


test("Commerce supplier comparison accounts for MOQ, order shipping and extra stock", async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(() => {
    document.getElementById("commerceSupplierQuantity").value = "100";
    Object.entries({
      commerceSupplier1Name: "Furnizor A",
      commerceSupplier1UnitPrice: "10",
      commerceSupplier1Shipping: "60",
      commerceSupplier1Moq: "120",
      commerceSupplier1LeadDays: "12",
      commerceSupplier2Name: "Furnizor B",
      commerceSupplier2UnitPrice: "11",
      commerceSupplier2Shipping: "20",
      commerceSupplier2Moq: "50",
      commerceSupplier2LeadDays: "8"
    }).forEach(([id, value]) => { document.getElementById(id).value = value; });
    const comparison = calculateCommerceSupplierComparison();
    document.getElementById("commerceProduct").value = "Demo product";
    window.submitModuleBrief = prompt => { window.__commercePrompt = prompt; };
    buildCommercePrompt();
    return { ...comparison, prompt: window.__commercePrompt };
  });
  expect(result.quantity).toBe(100);
  expect(result.suppliers).toHaveLength(2);
  expect(result.suppliers[0].name).toBe("Furnizor A");
  expect(result.suppliers[0].orderUnits).toBe(120);
  expect(result.suppliers[0].upfrontCost).toBe(1260);
  expect(result.suppliers[0].landedUnitCost).toBe(10.5);
  expect(result.suppliers[0].excessUnits).toBe(20);
  expect(result.suppliers[1].name).toBe("Furnizor B");
  expect(result.suppliers[1].upfrontCost).toBe(1120);
  expect(result.suppliers[1].landedUnitCost).toBe(11.2);
  expect(result.prompt).toContain("Furnizor A");
  expect(result.prompt).toContain("date furnizate de utilizator, neverificate");
});

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
  test(`${scenario.module} project can be saved, listed and reopened with its original fields`, async ({ page }) => {
    await openApp(page);
    await page.evaluate(() => {
      const rows = [];
      const calls = [];
      window.__DRVAS_ROUNDTRIP_CALLS__ = calls;
      supabaseClient.from = table => {
        const query = { filters: [], payload: null };
        query.select = function () { return this; };
        query.eq = function (key, value) { this.filters.push([key, value]); return this; };
        query.order = function () { return this; };
        query.insert = function (payload) {
          this.payload = payload;
          calls.push({ operation: "insert", table, payload });
          const row = { ...payload, id: "e2e-roundtrip-" + payload.module };
          rows.push(row);
          return this;
        };
        query.single = async function () {
          const row = rows.find(item => this.filters.every(([key, value]) => item[key] === value)) || rows[rows.length - 1];
          return { data: row ? { id: row.id, module: row.module, title: row.title, brief: row.brief } : null, error: null };
        };
        query.limit = async function () {
          const result = rows.filter(row => this.filters.every(([key, value]) => row[key] === value));
          return { data: result.map(row => ({ id: row.id, title: row.title, updated_at: row.updated_at })), error: null };
        };
        return query;
      };
    });
    await page.evaluate(async ({ primary, title, value, module }) => {
      document.getElementById(primary).value = value;
      document.getElementById(title).value = value + " — titlu";
      if (module === "commerce") {
        document.getElementById("commerceSupplierQuantity").value = "100";
        document.getElementById("commerceSupplier1Name").value = "Furnizor A";
        document.getElementById("commerceSupplier1UnitPrice").value = "10";
        document.getElementById("commerceSupplier1Shipping").value = "60";
        document.getElementById("commerceSupplier1Moq").value = "120";
        document.getElementById("commerceSupplier1LeadDays").value = "12";
        document.getElementById("commerceSupplier1Returns").value = "30 zile";
        document.getElementById("commerceSupplier1Source").value = "https://supplier-a.example/quote";
        calculateCommerceSupplierComparison();
      }
      await saveModuleProject(module);
      document.getElementById(primary).value = "Valoare modificată temporar";
      document.getElementById(title).value = "Titlu temporar";
      if (module === "commerce") {
        document.getElementById("commerceSupplierQuantity").value = "5";
        document.getElementById("commerceSupplier1Name").value = "Furnizor temporar";
        document.getElementById("commerceSupplier1Moq").value = "2";
        calculateCommerceSupplierComparison();
      }
      document.getElementById(module + "ProjectList").value = "e2e-roundtrip-" + module;
      await openModuleProject(module);
    }, scenario);
    const restored = await page.evaluate(({ primary, title }) => ({
      primary: document.getElementById(primary).value,
      title: document.getElementById(title).value,
      supplierName: document.getElementById("commerceSupplier1Name")?.value || "",
      supplierQuantity: document.getElementById("commerceSupplierQuantity")?.value || "",
      supplierMoq: document.getElementById("commerceSupplier1Moq")?.value || "",
      supplierResults: document.getElementById("commerceSupplierResults")?.textContent || "",
      calls: window.__DRVAS_ROUNDTRIP_CALLS__
    }), scenario);
    expect(restored.primary).toBe(scenario.value);
    expect(restored.title).toBe(scenario.value + " — titlu");
    expect(restored.calls).toHaveLength(1);
    expect(restored.calls[0].payload.user_id).toBe("e2e-module-owner");
    expect(restored.calls[0].payload.module).toBe(scenario.module);
    if (scenario.module === "commerce") {
      expect(restored.supplierName).toBe("Furnizor A");
      expect(restored.supplierQuantity).toBe("100");
      expect(restored.supplierMoq).toBe("120");
      expect(restored.supplierResults).toContain("Furnizor A");
    }
  });
}


test("saving an already-open Academy project updates the same owner-scoped row and preserves the latest AI output", async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    const operations = [];
    window.__DRVAS_UPDATE_OPERATIONS__ = operations;
    moduleProjectState.academy = "e2e-existing-academy";
    moduleProjectOutputs.academy = "Ultimul răspuns Dr.Vas";
    document.getElementById("academySubject").value = "Curs actualizat";
    document.getElementById("academyProjectTitle").value = "Plan de curs actualizat";

    supabaseClient.from = table => {
      const query = { operation: null, payload: null, filters: [] };
      query.select = function () { return this; };
      query.update = function (payload) { this.operation = "update"; this.payload = payload; return this; };
      query.eq = function (key, value) { this.filters.push([key, value]); return this; };
      query.order = function () { return this; };
      query.single = async function () {
        operations.push({ table, operation: this.operation, payload: this.payload, filters: this.filters });
        return { data: { id: "e2e-existing-academy" }, error: null };
      };
      query.limit = async function () {
        return { data: [{ id: "e2e-existing-academy", title: "Plan de curs actualizat", updated_at: new Date().toISOString() }], error: null };
      };
      return query;
    };

    await saveModuleProject("academy");
  });

  const operations = await page.evaluate(() => window.__DRVAS_UPDATE_OPERATIONS__);
  expect(operations).toHaveLength(1);
  expect(operations[0].table).toBe("drvas_module_projects");
  expect(operations[0].operation).toBe("update");
  expect(operations[0].payload.user_id).toBe("e2e-module-owner");
  expect(operations[0].payload.module).toBe("academy");
  expect(operations[0].payload.title).toBe("Plan de curs actualizat");
  expect(operations[0].payload.brief.latest_output).toBe("Ultimul răspuns Dr.Vas");
  expect(operations[0].filters).toEqual([
    ["id", "e2e-existing-academy"],
    ["user_id", "e2e-module-owner"],
    ["module", "academy"]
  ]);
});


test("deleting a saved Commerce project removes only the selected owner-scoped row", async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    const operations = [];
    window.__DRVAS_DELETE_OPERATIONS__ = operations;
    moduleProjectState.commerce = "e2e-existing-commerce";
    moduleProjectOutputs.commerce = "Draft de eliminat";
    const select = document.getElementById("commerceProjectList");
    select.add(new Option("Proiect test", "e2e-existing-commerce"));
    select.value = "e2e-existing-commerce";
    window.confirm = () => true;

    supabaseClient.from = table => {
      const query = { operation: null, filters: [] };
      query.select = function () { return this; };
      query.delete = function () { this.operation = "delete"; return this; };
      query.eq = function (key, value) { this.filters.push([key, value]); return this; };
      query.order = function () { return this; };
      query.limit = async function () { return { data: [], error: null }; };
      query.then = function (resolve, reject) {
        operations.push({ table, operation: this.operation, filters: this.filters });
        return Promise.resolve({ error: null }).then(resolve, reject);
      };
      return query;
    };

    await deleteModuleProject("commerce");
  });

  const result = await page.evaluate(() => ({
    operations: window.__DRVAS_DELETE_OPERATIONS__,
    activeId: moduleProjectState.commerce,
    latestOutput: moduleProjectOutputs.commerce,
    title: document.getElementById("commerceProjectTitle").value,
    selectedProject: document.getElementById("commerceProjectList").value
  }));
  expect(result.operations).toHaveLength(1);
  expect(result.operations[0].table).toBe("drvas_module_projects");
  expect(result.operations[0].operation).toBe("delete");
  expect(result.operations[0].filters).toEqual([
    ["id", "e2e-existing-commerce"],
    ["user_id", "e2e-module-owner"],
    ["module", "commerce"]
  ]);
  expect(result.activeId).toBeNull();
  expect(result.latestOutput).toBe("");
  expect(result.title).toBe("");
  expect(result.selectedProject).toBe("");
});


test("exporting a saved Academy project includes its brief and latest Dr.Vas output", async ({ page }) => {
  await openApp(page);
  const exported = await page.evaluate(async () => {
    document.getElementById("academySubject").value = "Antreprenoriat pentru începători";
    document.getElementById("academyLevel").value = "Începător";
    document.getElementById("academyProjectTitle").value = "Curs practic de antreprenoriat";
    moduleProjectOutputs.academy = "Planul cursului cu 5 module și exerciții.";

    window.__DRVAS_EXPORTED_FILE__ = null;
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: blob => {
        window.__DRVAS_EXPORTED_FILE__ = { blob, href: "blob:e2e-project-export" };
        return "blob:e2e-project-export";
      }
    });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: () => {} });
    HTMLAnchorElement.prototype.click = function () {
      window.__DRVAS_EXPORT_CLICK__ = { href: this.href, download: this.download };
    };

    exportModuleProject("academy");
    const file = window.__DRVAS_EXPORTED_FILE__;
    return {
      text: await file.blob.text(),
      href: window.__DRVAS_EXPORT_CLICK__?.href,
      download: window.__DRVAS_EXPORT_CLICK__?.download,
      status: document.getElementById("academyProjectStatus").textContent
    };
  });

  expect(exported.text).toContain("# Curs practic de antreprenoriat");
  expect(exported.text).toContain("Modul: academy");
  expect(exported.text).toContain("Antreprenoriat pentru începători");
  expect(exported.text).toContain("Planul cursului cu 5 module și exerciții.");
  expect(exported.href).toBe("blob:e2e-project-export");
  expect(exported.download).toMatch(/Curs-practic-de-antreprenoriat\.md$/);
  expect(exported.status).toContain("pregătit");
});


for (const scenario of [
  { module: "commerce", primary: "commerceProduct", title: "commerceProjectTitle", value: "Produs cu actualizare", output: "Analiza de piață actualizată" },
  { module: "business", primary: "businessIdea", title: "businessProjectTitle", value: "Afacere cu actualizare", output: "Plan operațional actualizat" }
]) {
  test(`${scenario.module} updates its existing project with owner and module filters`, async ({ page }) => {
    await openApp(page);
    await page.evaluate(async ({ module, primary, title, value, output }) => {
      const operations = [];
      window.__DRVAS_GENERIC_UPDATE__ = operations;
      const id = "e2e-existing-" + module;
      moduleProjectState[module] = id;
      moduleProjectOutputs[module] = output;
      document.getElementById(primary).value = value;
      document.getElementById(title).value = value + " — proiect";

      supabaseClient.from = table => {
        const query = { operation: null, payload: null, filters: [] };
        query.select = function () { return this; };
        query.update = function (payload) { this.operation = "update"; this.payload = payload; return this; };
        query.eq = function (key, filterValue) { this.filters.push([key, filterValue]); return this; };
        query.order = function () { return this; };
        query.single = async function () {
          operations.push({ table, operation: this.operation, payload: this.payload, filters: this.filters });
          return { data: { id }, error: null };
        };
        query.limit = async function () {
          return { data: [{ id, title: value + " — proiect", updated_at: new Date().toISOString() }], error: null };
        };
        return query;
      };

      await saveModuleProject(module);
    }, scenario);

    const operations = await page.evaluate(() => window.__DRVAS_GENERIC_UPDATE__);
    expect(operations).toHaveLength(1);
    expect(operations[0].table).toBe("drvas_module_projects");
    expect(operations[0].operation).toBe("update");
    expect(operations[0].payload.user_id).toBe("e2e-module-owner");
    expect(operations[0].payload.module).toBe(scenario.module);
    expect(operations[0].payload.title).toBe(scenario.value + " — proiect");
    expect(operations[0].payload.brief.latest_output).toBe(scenario.output);
    expect(operations[0].filters).toEqual([
      ["id", "e2e-existing-" + scenario.module],
      ["user_id", "e2e-module-owner"],
      ["module", scenario.module]
    ]);
  });
}

for (const scenario of [
  { module: "commerce", primary: "commerceProduct", title: "commerceProjectTitle", value: "Analiză produs online", output: "Marjă estimată și plan de lansare." },
  { module: "business", primary: "businessIdea", title: "businessProjectTitle", value: "Plan companie locală", output: "Etape, costuri și obiective trimestriale." }
]) {
  test(`${scenario.module} project export includes the module brief and latest AI output`, async ({ page }) => {
    await openApp(page);
    const exported = await page.evaluate(async ({ module, primary, title, value, output }) => {
      document.getElementById(primary).value = value;
      document.getElementById(title).value = value + " — document";
      moduleProjectOutputs[module] = output;
      window.__DRVAS_EXPORTED_FILE__ = null;
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        value: blob => {
          window.__DRVAS_EXPORTED_FILE__ = { blob, href: "blob:e2e-" + module };
          return "blob:e2e-" + module;
        }
      });
      Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: () => {} });
      HTMLAnchorElement.prototype.click = function () {
        window.__DRVAS_EXPORT_CLICK__ = { href: this.href, download: this.download };
      };
      exportModuleProject(module);
      const file = window.__DRVAS_EXPORTED_FILE__;
      return {
        text: await file.blob.text(),
        href: window.__DRVAS_EXPORT_CLICK__?.href,
        download: window.__DRVAS_EXPORT_CLICK__?.download,
        status: document.getElementById(module + "ProjectStatus").textContent
      };
    }, scenario);

    expect(exported.text).toContain("# " + scenario.value + " — document");
    expect(exported.text).toContain("Modul: " + scenario.module);
    expect(exported.text).toContain(scenario.value);
    expect(exported.text).toContain(scenario.output);
    expect(exported.href).toBe("blob:e2e-" + scenario.module);
    expect(exported.download).toMatch(/\.md$/);
    expect(exported.status).toContain("pregătit");
  });
}


for (const scenario of [
  { module: "academy", primary: "academySubject", title: "academyProjectTitle" },
  { module: "business", primary: "businessIdea", title: "businessProjectTitle" }
]) {
  test(`${scenario.module} deletion clears only the selected owner-scoped project`, async ({ page }) => {
    await openApp(page);
    await page.evaluate(async ({ module, title }) => {
      const operations = [];
      window.__DRVAS_GENERIC_DELETE__ = operations;
      const id = "e2e-delete-" + module;
      moduleProjectState[module] = id;
      moduleProjectOutputs[module] = "Output temporar";
      document.getElementById(title).value = "Proiect de șters";
      const select = document.getElementById(module + "ProjectList");
      select.add(new Option("Proiect test", id));
      select.value = id;
      window.confirm = () => true;

      supabaseClient.from = table => {
        const query = { operation: null, filters: [] };
        query.select = function () { return this; };
        query.delete = function () { this.operation = "delete"; return this; };
        query.eq = function (key, value) { this.filters.push([key, value]); return this; };
        query.order = function () { return this; };
        query.limit = async function () { return { data: [], error: null }; };
        query.then = function (resolve, reject) {
          operations.push({ table, operation: this.operation, filters: this.filters });
          return Promise.resolve({ error: null }).then(resolve, reject);
        };
        return query;
      };

      await deleteModuleProject(module);
    }, scenario);

    const result = await page.evaluate(({ module, title }) => ({
      operations: window.__DRVAS_GENERIC_DELETE__,
      activeId: moduleProjectState[module],
      latestOutput: moduleProjectOutputs[module],
      title: document.getElementById(title).value,
      selectedProject: document.getElementById(module + "ProjectList").value
    }), scenario);

    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].table).toBe("drvas_module_projects");
    expect(result.operations[0].operation).toBe("delete");
    expect(result.operations[0].filters).toEqual([
      ["id", "e2e-delete-" + scenario.module],
      ["user_id", "e2e-module-owner"],
      ["module", scenario.module]
    ]);
    expect(result.activeId).toBeNull();
    expect(result.latestOutput).toBe("");
    expect(result.title).toBe("");
    expect(result.selectedProject).toBe("");
  });
}


test("manual replay keeps dedicated assistant audio enabled when auto-read was previously off", async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => {
    currentUser = { id: "e2e-voice-owner", email: "voice@example.invalid" };
    activeAssistant = "drvas";
    voiceAutoRead = false;
    lastSpokenAnswer = "Test de redare vocală Dr.Vas";
    supabaseClient.auth.getSession = async () => ({
      data: { session: { access_token: "e2e-access-token" } },
      error: null
    });
    window.fetch = async (_url, options) => {
      const request = JSON.parse(options.body);
      window.__DRVAS_TTS_REQUEST__ = request;
      return { ok: true, blob: async () => new Blob(["mock-audio"], { type: "audio/mpeg" }) };
    };
    URL.createObjectURL = () => "blob:e2e-drvas-voice";
    URL.revokeObjectURL = () => {};
    window.__DRVAS_AUDIO_PLAY_COUNT__ = 0;
    window.Audio = class {
      play() {
        window.__DRVAS_AUDIO_PLAY_COUNT__++;
        return Promise.resolve();
      }
      pause() {}
      set src(value) {}
      set currentTime(value) {}
    };
    refreshVoiceUi = () => {};
    replayLastAnswer();
  });

  await page.waitForFunction(() => window.__DRVAS_AUDIO_PLAY_COUNT__ === 1);
  const result = await page.evaluate(() => ({
    request: window.__DRVAS_TTS_REQUEST__,
    autoReadRemainsOff: voiceAutoRead,
    playCount: window.__DRVAS_AUDIO_PLAY_COUNT__
  }));
  expect(result.request).toMatchObject({
    action: "voice_tts",
    assistant: "drvas",
    access_token: "e2e-access-token"
  });
  expect(result.autoReadRemainsOff).toBe(false);
  expect(result.playCount).toBe(1);
});


test("pending assistant TTS audio is discarded after switching assistants", async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => {
    currentUser = { id: "e2e-voice-owner", email: "voice@example.invalid" };
    activeAssistant = "drvas";
    voiceAutoRead = true;
    supabaseClient.auth.getSession = async () => ({
      data: { session: { access_token: "e2e-access-token" } },
      error: null
    });
    window.__DRVAS_AUDIO_PLAY_COUNT__ = 0;
    window.fetch = () => new Promise(resolve => {
      window.__DRVAS_FETCH_PENDING__ = true;
      window.__DRVAS_RESOLVE_TTS__ = resolve;
    });
    window.Audio = class {
      play() {
        window.__DRVAS_AUDIO_PLAY_COUNT__++;
        return Promise.resolve();
      }
      pause() {}
      set src(value) {}
      set currentTime(value) {}
    };
    window.__DRVAS_PENDING_VOICE__ = playAssistantVoice("Voice response pending");
  });

  await page.waitForFunction(() => window.__DRVAS_FETCH_PENDING__ === true);
  const result = await page.evaluate(async () => {
    activeAssistant = "jan";
    window.__DRVAS_RESOLVE_TTS__({
      ok: true,
      blob: async () => new Blob(["mock-audio"], { type: "audio/mpeg" })
    });
    await window.__DRVAS_PENDING_VOICE__;
    return {
      playCount: window.__DRVAS_AUDIO_PLAY_COUNT__,
      activeAssistant
    };
  });

  expect(result.activeAssistant).toBe("jan");
  expect(result.playCount).toBe(0);
});


// Opening a saved project must scope the lookup by its ID, authenticated owner and module.
for (const scenario of [
  { module: "academy", primary: "academySubject", value: "Curs privat", title: "Curs privat — salvat", briefKey: "academySubject" },
  { module: "commerce", primary: "commerceProduct", value: "Produs privat", title: "Produs privat — salvat", briefKey: "commerceProduct" },
  { module: "business", primary: "businessIdea", value: "Afacere privată", title: "Afacere privată — salvat", briefKey: "businessIdea" }
]) {
  test(`${scenario.module} opens a project only through owner-and-module scoped lookup`, async ({ page }) => {
    await openApp(page);
    const result = await page.evaluate(async ({ module, primary, value, title }) => {
      const filters = [];
      window.__DRVAS_OPEN_FILTERS__ = filters;
      const projectId = "e2e-open-" + module;
      const select = document.getElementById(module + "ProjectList");
      select.add(new Option(title, projectId));
      select.value = projectId;
      supabaseClient.from = table => ({
        select() { return this; },
        eq(key, filterValue) { filters.push([key, filterValue]); return this; },
        single: async () => ({
          data: {
            id: projectId,
            module,
            title,
            brief: { [primary]: value, latest_output: "Rezultat privat restaurat" }
          },
          error: null
        })
      });
      await openModuleProject(module);
      return {
        filters,
        primaryValue: document.getElementById(primary).value,
        titleValue: document.getElementById(module + "ProjectTitle").value,
        output: moduleProjectOutputs[module],
        status: document.getElementById(module + "ProjectStatus").textContent
      };
    }, scenario);
    expect(result.filters).toEqual([
      ["id", "e2e-open-" + scenario.module],
      ["user_id", "e2e-module-owner"],
      ["module", scenario.module]
    ]);
    expect(result.primaryValue).toBe(scenario.value);
    expect(result.titleValue).toBe(scenario.title);
    expect(result.output).toBe("Rezultat privat restaurat");
    expect(result.status).toContain("Proiect încărcat");
  });
}

test("a failed module project save never reports success or assigns a saved project ID", async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    document.getElementById("academySubject").value = "Curs care nu poate fi salvat";
    document.getElementById("academyProjectTitle").value = "Salvare eșuată";
    supabaseClient.from = table => ({
      insert() { return this; },
      select() { return this; },
      single: async () => ({ data: null, error: { message: "simulated database write failure" } })
    });
    const saved = await saveModuleProject("academy");
    return {
      saved,
      id: moduleProjectState.academy,
      status: document.getElementById("academyProjectStatus").textContent
    };
  });
  expect(result.saved).toBe(false);
  expect(result.id).toBeFalsy();
  expect(result.status).toContain("Nu am putut salva proiectul");
  expect(result.status).not.toContain("Proiect salvat privat");
});

test("a failed project lookup preserves the user's current draft and reports the error", async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    document.getElementById("commerceProduct").value = "Draft local care trebuie păstrat";
    const select = document.getElementById("commerceProjectList");
    select.add(new Option("Proiect inaccesibil", "e2e-forbidden-project"));
    select.value = "e2e-forbidden-project";
    supabaseClient.from = () => ({
      select() { return this; },
      eq() { return this; },
      single: async () => ({ data: null, error: { message: "row not found" } })
    });
    await openModuleProject("commerce");
    return {
      product: document.getElementById("commerceProduct").value,
      status: document.getElementById("commerceProjectStatus").textContent
    };
  });
  expect(result.product).toBe("Draft local care trebuie păstrat");
  expect(result.status).toContain("Nu am putut deschide proiectul");
});
