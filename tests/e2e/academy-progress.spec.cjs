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

async function openApp(page) {
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", route =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: SUPABASE_STUB })
  );
  await page.addInitScript(() => localStorage.setItem("drvas_language", "ro"));
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.lang === "ro" &&
    !document.querySelector("#appMain")?.classList.contains("language-pending"));
  await page.evaluate(() => {
    currentUser = { id: "e2e-academy-owner", email: "academy@example.invalid" };
    isDrvasAdmin = true;
  });
}

test("Academy lesson checklist derives progress from individual lesson completion", async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(() => {
    const titles = document.getElementById("academyLessonTitles");
    titles.value = "Introducere\\nBuget și planificare\\nMarketing";
    titles.dispatchEvent(new Event("input", { bubbles: true }));
    const lessons = [...document.querySelectorAll("#academyLessonChecklist input[type=checkbox]")];
    lessons[0].checked = true;
    lessons[0].dispatchEvent(new Event("change", { bubbles: true }));
    lessons[2].checked = true;
    lessons[2].dispatchEvent(new Event("change", { bubbles: true }));
    return {
      total: document.getElementById("academyLessonsTotal").value,
      completed: document.getElementById("academyLessonsCompleted").value,
      summary: document.getElementById("academyProgressSummary").textContent,
      aria: document.getElementById("academyProgressBar").getAttribute("aria-valuenow")
    };
  });
  expect(result.total).toBe("3");
  expect(result.completed).toBe("2");
  expect(result.summary).toContain("2 din 3 lecții finalizate");
  expect(result.aria).toBe("67");
});
test("Academy lesson checklist labels and progress summary localize", async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(() => {
    currentLanguage = "en";
    translatePage(document.body);
    const titles = document.getElementById("academyLessonTitles");
    titles.value = "Introduction\\nBudget";
    titles.dispatchEvent(new Event("input", { bubbles: true }));
    return {
      label: titles.parentElement.textContent,
      heading: document.querySelector(".academy-lesson-checklist-wrap h4").textContent,
      summary: document.getElementById("academyProgressSummary").textContent,
      placeholder: titles.getAttribute("placeholder")
    };
  });
  expect(result.label).toContain("Lesson titles (one per line)");
  expect(result.heading).toBe("Lesson checklist");
  expect(result.summary).toContain("0 of 2 lessons completed");
  expect(result.placeholder).toContain("Introduction");
});
test("Academy progress tracker calculates percentages and clamps completed lessons", async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(() => {
    document.getElementById("academyLessonsTotal").value = "8";
    document.getElementById("academyLessonsCompleted").value = "3";
    const first = updateAcademyProgress();
    const firstSummary = document.getElementById("academyProgressSummary").textContent;
    const firstAria = document.getElementById("academyProgressBar").getAttribute("aria-valuenow");

    document.getElementById("academyLessonsCompleted").value = "99";
    const clamped = updateAcademyProgress();
    return {
      first, firstSummary, firstAria,
      clamped,
      completedInput: document.getElementById("academyLessonsCompleted").value,
      finalSummary: document.getElementById("academyProgressSummary").textContent
    };
  });

  expect(result.first).toEqual({ total: 8, completed: 3, percent: 38 });
  expect(result.firstSummary).toContain("3 din 8 lecții finalizate");
  expect(result.firstAria).toBe("38");
  expect(result.clamped).toEqual({ total: 8, completed: 8, percent: 100 });
  expect(result.completedInput).toBe("8");
  expect(result.finalSummary).toContain("100%");
});

test("Academy progress and notes persist with a saved course and restore when reopened", async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    let savedRow = null;
    supabaseClient.from = table => {
      const filters = [];
      const query = {
        select() { return this; },
        eq(key, value) { filters.push([key, value]); return this; },
        order() { return this; },
        insert(payload) {
          savedRow = { ...payload, id: "e2e-academy-progress-project" };
          return this;
        },
        single: async () => ({ data: savedRow, error: null }),
        limit: async () => ({ data: savedRow ? [{ id: savedRow.id, title: savedRow.title, updated_at: savedRow.updated_at }] : [], error: null })
      };
      return query;
    };

    document.getElementById("academySubject").value = "Curs de antreprenoriat";
    document.getElementById("academyProjectTitle").value = "Curs cu progres";
    document.getElementById("academyLessonsTotal").value = "8";
    document.getElementById("academyLessonsCompleted").value = "3";
    document.getElementById("academyProgressNotes").value = "Am parcurs bugetarea; urmează marketingul.";
    document.getElementById("academyLessonTitles").value = "Introducere\nBuget\nMarketing";
    renderAcademyLessonChecklist();
    const lessonChecks = document.querySelectorAll("#academyLessonChecklist input[type=checkbox]");
    lessonChecks[0].checked = true;
    lessonChecks[0].dispatchEvent(new Event("change", { bubbles: true }));
    lessonChecks[1].checked = true;
    lessonChecks[1].dispatchEvent(new Event("change", { bubbles: true }));
    updateAcademyProgress();
    const saved = await saveModuleProject("academy");

    document.getElementById("academyLessonsTotal").value = "5";
    document.getElementById("academyLessonsCompleted").value = "1";
    document.getElementById("academyProgressNotes").value = "Draft temporar";
    document.getElementById("academyLessonTitles").value = "Temporar";
    renderAcademyLessonChecklist();
    updateAcademyProgress();
    document.getElementById("academyProjectList").value = savedRow.id;
    await openModuleProject("academy");

    return {
      saved,
      owner: savedRow.user_id,
      module: savedRow.module,
      savedTotal: savedRow.brief.academyLessonsTotal,
      savedCompleted: savedRow.brief.academyLessonsCompleted,
      savedNotes: savedRow.brief.academyProgressNotes,
      savedLessonTitles: savedRow.brief.academyLessonTitles,
      savedLessonChecklist: savedRow.brief.academyLessonChecklistData,
      restoredLessonTitles: document.getElementById("academyLessonTitles").value,
      restoredLessonChecklist: document.getElementById("academyLessonChecklistData").value,
      restoredCheckedLessons: [...document.querySelectorAll("#academyLessonChecklist input[type=checkbox]")].filter(input => input.checked).length,
      restoredTotal: document.getElementById("academyLessonsTotal").value,
      restoredCompleted: document.getElementById("academyLessonsCompleted").value,
      restoredNotes: document.getElementById("academyProgressNotes").value,
      summary: document.getElementById("academyProgressSummary").textContent,
      aria: document.getElementById("academyProgressBar").getAttribute("aria-valuenow")
    };
  });

  expect(result.saved).toBe(true);
  expect(result.owner).toBe("e2e-academy-owner");
  expect(result.module).toBe("academy");
  expect(result.savedTotal).toBe("3");
  expect(result.savedCompleted).toBe("2");
  expect(result.savedNotes).toContain("urmează marketingul");
  expect(result.restoredTotal).toBe("3");
  expect(result.restoredCompleted).toBe("2");
  expect(result.restoredNotes).toContain("urmează marketingul");
  expect(result.savedLessonTitles).toContain("Buget");
  expect(JSON.parse(result.savedLessonChecklist).filter(item => item.completed)).toHaveLength(2);
  expect(result.restoredLessonTitles).toContain("Marketing");
  expect(JSON.parse(result.restoredLessonChecklist).filter(item => item.completed)).toHaveLength(2);
  expect(result.restoredCheckedLessons).toBe(2);
  expect(result.summary).toContain("2 din 3 lecții finalizate");
  expect(result.aria).toBe("67");
});
