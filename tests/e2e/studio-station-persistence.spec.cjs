const { test, expect } = require("@playwright/test");

const SUPABASE_STUB = `
window.supabase = {
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
    },
    from() { return {}; }
  })
};
`;

async function openStudio(page) {
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", route =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: SUPABASE_STUB })
  );
  await page.addInitScript(() => localStorage.setItem("drvas_language", "ro"));
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.lang === "ro" &&
    !document.querySelector("#appMain")?.classList.contains("language-pending"));
  await page.evaluate(() => {
    currentUser = { id: "e2e-studio-owner", email: "studio@example.invalid" };
    isDrvasAdmin = true;
    selectModule("studio", true);
  });
  await page.waitForFunction(() => document.querySelector("#studioWorkspace [data-feature='book']") &&
    document.getElementById("drvasBookStationTitle"));
}

async function installProjectStore(page) {
  await page.evaluate(() => {
    let row = null;
    window.__DRVAS_STUDIO_ROW__ = () => row;
    supabaseClient.from = table => ({
      select() { return this; },
      eq() { return this; },
      order() { return this; },
      insert(payload) {
        row = { ...payload, id: "e2e-studio-station-project" };
        return this;
      },
      update(payload) {
        row = { ...row, ...payload };
        return this;
      },
      single: async () => ({ data: row, error: null }),
      limit: async () => ({
        data: row ? [{ id: row.id, title: row.title, project_type: row.project_type, updated_at: row.updated_at }] : [],
        error: null
      })
    });
  });
}

test("Book Studio station metadata survives save, new draft and reopen", async ({ page }) => {
  await openStudio(page);
  await installProjectStore(page);
  await page.locator("#studioWorkspace [data-feature='book']").click();

  await page.locator("#drvasBookStationTitle").fill("Povestea curajului");
  await page.locator("#drvasBookStationGenre").selectOption("Thriller / mister");
  await page.locator("#drvasBookStationLanguage").selectOption("Engleză");
  await page.locator("#drvasBookStationAudience").fill("Adulți interesați de ficțiune");
  await page.locator("#drvasBookStationLength").selectOption("Roman amplu · 20–30 capitole");
  await page.locator("#drvasBookStationConcept").fill("O poveste originală despre curaj, familie și alegeri dificile.");
  await page.locator("#drvasBookStationSubtitle").fill("O alegere poate schimba trei generații.");
  await page.locator("#drvasBookStationStyleGuide").fill("Persoana a treia, trecut, ton realist, dialog natural.");
  await page.locator("#drvasBookStationCharacterBible").fill("Mara: protagonistă, caută adevărul. Ilie: tatăl ei, ascunde o scrisoare.");
  await page.locator("#drvasBookStationSettingBible").fill("Acțiunea are loc în Botoșani și Leeds, între 2008 și 2026.");
  await page.locator("#drvasBookStationChapterOutline").fill("1. Întoarcerea — Mara găsește scrisoarea.\n2. Martorul — Ilie explică tăcerea.");
  await page.locator("#drvasBookStationChapterStatus").selectOption("revising");
  await page.locator("#drvasBookStationManuscriptDraft").fill("Capitolul întâi\n\nMara a deschis plicul și a recunoscut scrisul.");
  await page.locator("#drvasBookStationRevisionNotes").fill("Păstrează cronologia; nu dezvălui încă motivul plecării lui Ilie.");

  await page.locator("#studioWorkspace [data-feature-page='book'] .studio-station-submit").click();
  await expect(page.locator("#studioIdea")).toHaveValue(/Capitolul întâi/);
  await page.waitForFunction(() => document.getElementById("studioProjectStatus")?.textContent.includes("Proiect salvat"));
  const saved = await page.evaluate(() => window.__DRVAS_STUDIO_ROW__());
  expect(saved.project_type).toBe("book");
  expect(saved.brief.station).toMatchObject({
    kind: "book",
    fields: {
      title: "Povestea curajului",
      genre: "Thriller / mister",
      language: "Engleză",
      audience: "Adulți interesați de ficțiune",
      length: "Roman amplu · 20–30 capitole",
      concept: "O poveste originală despre curaj, familie și alegeri dificile.",
      subtitle: "O alegere poate schimba trei generații.",
      styleGuide: "Persoana a treia, trecut, ton realist, dialog natural.",
      characterBible: "Mara: protagonistă, caută adevărul. Ilie: tatăl ei, ascunde o scrisoare.",
      settingBible: "Acțiunea are loc în Botoșani și Leeds, între 2008 și 2026.",
      chapterOutline: "1. Întoarcerea — Mara găsește scrisoarea.\n2. Martorul — Ilie explică tăcerea.",
      chapterStatus: "revising",
      manuscriptDraft: "Capitolul întâi\n\nMara a deschis plicul și a recunoscut scrisul.",
      revisionNotes: "Păstrează cronologia; nu dezvălui încă motivul plecării lui Ilie."
    }
  });

  await page.evaluate(async () => {
    newStudioProject();
    document.getElementById("studioSavedProjects").value = "e2e-studio-station-project";
    await openStudioProject();
  });
  await expect(page.locator("#drvasBookStationTitle")).toHaveValue("Povestea curajului");
  await expect(page.locator("#drvasBookStationGenre")).toHaveValue("Thriller / mister");
  await expect(page.locator("#drvasBookStationLanguage")).toHaveValue("Engleză");
  await expect(page.locator("#drvasBookStationAudience")).toHaveValue("Adulți interesați de ficțiune");
  await expect(page.locator("#drvasBookStationLength")).toHaveValue("Roman amplu · 20–30 capitole");
  await expect(page.locator("#drvasBookStationConcept")).toHaveValue("O poveste originală despre curaj, familie și alegeri dificile.");
  await expect(page.locator("#drvasBookStationSubtitle")).toHaveValue("O alegere poate schimba trei generații.");
  await expect(page.locator("#drvasBookStationStyleGuide")).toHaveValue("Persoana a treia, trecut, ton realist, dialog natural.");
  await expect(page.locator("#drvasBookStationCharacterBible")).toHaveValue("Mara: protagonistă, caută adevărul. Ilie: tatăl ei, ascunde o scrisoare.");
  await expect(page.locator("#drvasBookStationSettingBible")).toHaveValue("Acțiunea are loc în Botoșani și Leeds, între 2008 și 2026.");
  await expect(page.locator("#drvasBookStationChapterOutline")).toHaveValue("1. Întoarcerea — Mara găsește scrisoarea.\n2. Martorul — Ilie explică tăcerea.");
  await expect(page.locator("#drvasBookStationChapterStatus")).toHaveValue("revising");
  await expect(page.locator("#drvasBookStationManuscriptDraft")).toHaveValue("Capitolul întâi\n\nMara a deschis plicul și a recunoscut scrisul.");
  await expect(page.locator("#drvasBookStationRevisionNotes")).toHaveValue("Păstrează cronologia; nu dezvălui încă motivul plecării lui Ilie.");
  const downloadPromise = page.waitForEvent("download");
  await page.evaluate(() => exportStudioProject());
  const download = await downloadPromise;
  const exportedPath = await download.path();
  const exportedText = require("fs").readFileSync(exportedPath, "utf8");
  expect(exportedText).toContain("## Book Studio — continuitate și manuscris");
  expect(exportedText).toContain("Mara: protagonistă, caută adevărul.");
  expect(exportedText).toContain("Capitolul întâi");
});


test("Book Studio keeps a private ten-version chapter history and restores a selected draft", async ({ page }) => {
  await openStudio(page);
  await installProjectStore(page);
  await page.locator("#studioWorkspace [data-feature='book']").click();
  await page.locator("#drvasBookStationTitle").fill("Jurnalul Marei");
  await page.locator("#drvasBookStationConcept").fill("O poveste originală despre memorie și familie.");
  await page.locator("#drvasBookStationChapterOutline").fill("1. Scrisoarea\n2. Întoarcerea");
  await page.locator("#drvasBookStationChapterStatus").selectOption("draft");
  await page.locator("#drvasBookStationManuscriptDraft").fill("Versiunea 1 — primul manuscris.");
  await page.locator("#studioWorkspace [data-feature-page='book'] .studio-station-submit").click();
  await page.waitForFunction(() => document.getElementById("studioProjectStatus")?.textContent.includes("Proiect salvat"));

  await page.locator("#drvasBookStationManuscriptDraft").fill("Versiunea 2 — dialog și cronologie revizuite.");
  await page.locator("#drvasBookSaveRevision").click();
  await expect(page.locator(".studio-station-status")).toContainText("Versiunea capitolului a fost salvată");
  let saved = await page.evaluate(() => window.__DRVAS_STUDIO_ROW__());
  expect(saved.brief.station.fields.revisions).toHaveLength(1);
  expect(saved.brief.station.fields.revisions[0].fields.manuscriptDraft).toBe("Versiunea 2 — dialog și cronologie revizuite.");

  await page.locator("#drvasBookStationManuscriptDraft").fill("Versiunea 3 — editare ulterioară.");
  await page.locator("#drvasBookRevisionSelect").selectOption({ index: 1 });
  await page.locator("#drvasBookRestoreRevision").click();
  await expect(page.locator(".studio-station-status")).toContainText("Versiunea selectată a fost restaurată");
  await expect(page.locator("#drvasBookStationManuscriptDraft")).toHaveValue("Versiunea 2 — dialog și cronologie revizuite.");
  saved = await page.evaluate(() => window.__DRVAS_STUDIO_ROW__());
  expect(saved.brief.station.fields.manuscriptDraft).toBe("Versiunea 2 — dialog și cronologie revizuite.");
  expect(saved.brief.station.fields.revisions).toHaveLength(1);

  await page.evaluate(async () => {
    newStudioProject();
    document.getElementById("studioSavedProjects").value = "e2e-studio-station-project";
    await openStudioProject();
  });
  await expect(page.locator("#drvasBookStationManuscriptDraft")).toHaveValue("Versiunea 2 — dialog și cronologie revizuite.");
  const history = await page.locator("#drvasBookRevisionSelect option").evaluateAll(options => options.map(option => option.value).filter(Boolean));
  expect(history).toHaveLength(1);
});

test("Book Studio manuscript controls follow the selected interface language", async ({ page }) => {
  await openStudio(page);
  await page.evaluate(() => {
    currentLanguage = "en";
    translatePage(document.body);
  });
  await expect(page.locator("#drvasBookStationSubtitle").locator("xpath=..")).toContainText("Book subtitle / promise");
  await expect(page.locator("#drvasBookStationManuscriptDraft").locator("xpath=..")).toContainText("Manuscript / current chapter");
  await expect(page.locator("#drvasBookStationManuscriptDraft")).toHaveAttribute("placeholder", "Write or continue the current chapter here. Save the project before moving to another chapter.");
  await expect(page.locator("#drvasBookStationChapterStatus option[value='revising']")).toHaveText("In revision");
  await expect(page.locator("#drvasBookSaveRevision")).toHaveText("Save current version");
  await expect(page.locator("#drvasBookRestoreRevision")).toHaveText("Restore selected version");
  await expect(page.locator(".studio-station-revision-tools")).toContainText("Chapter version history");
  await expect(page.locator("#drvasBookRevisionSelect option").first()).toHaveText("Choose a saved version");
});

test("Translation Station glossary and source text survive save and reopen", async ({ page }) => {
  await openStudio(page);
  await installProjectStore(page);
  await page.locator("#studioWorkspace [data-feature='translation']").click();

  await page.locator("#drvasTranslationSource").selectOption("en");
  await page.locator("#drvasTranslationTarget").selectOption("ro");
  await page.locator("#drvasTranslationStyle").selectOption("Tehnică — cu glosar");
  await page.locator("#drvasTranslationFormat").selectOption("Document cu tabel sursă–traducere");
  await page.locator("#drvasTranslationGlossary").fill("patient pathway = traseul pacientului\ncare plan = plan de îngrijire");
  await page.locator("#drvasTranslationText").fill("The patient pathway must preserve the original clinical meaning.");

  await page.locator("#studioWorkspace [data-feature-page='translation'] .studio-station-card button").click();
  await page.waitForFunction(() => document.getElementById("studioProjectStatus")?.textContent.includes("Proiect salvat"));
  const saved = await page.evaluate(() => window.__DRVAS_STUDIO_ROW__());
  expect(saved.project_type).toBe("translation");
  expect(saved.brief.station).toMatchObject({
    kind: "translation",
    fields: {
      source: "en",
      target: "ro",
      style: "Tehnică — cu glosar",
      format: "Document cu tabel sursă–traducere",
      glossary: "patient pathway = traseul pacientului\ncare plan = plan de îngrijire",
      text: "The patient pathway must preserve the original clinical meaning."
    }
  });

  await page.evaluate(async () => {
    newStudioProject();
    document.getElementById("studioSavedProjects").value = "e2e-studio-station-project";
    await openStudioProject();
  });
  await expect(page.locator("#drvasTranslationSource")).toHaveValue("en");
  await expect(page.locator("#drvasTranslationTarget")).toHaveValue("ro");
  await expect(page.locator("#drvasTranslationStyle")).toHaveValue("Tehnică — cu glosar");
  await expect(page.locator("#drvasTranslationFormat")).toHaveValue("Document cu tabel sursă–traducere");
  await expect(page.locator("#drvasTranslationGlossary")).toHaveValue("patient pathway = traseul pacientului\ncare plan = plan de îngrijire");
  await expect(page.locator("#drvasTranslationText")).toHaveValue("The patient pathway must preserve the original clinical meaning.");
});
