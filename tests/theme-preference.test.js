import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  THEME_PREFERENCE_STORAGE_KEY,
  applyThemePreference,
  getThemePreference,
  hydrateThemePreferenceFromApi,
  setThemePreference,
  toggleThemePreference
} from "../services/theme-preference-service.js";

class MemoryStorage {
  #values = new Map();
  getItem(key) { return this.#values.get(key) ?? null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
}

const storage = new MemoryStorage();
const documentRoot = { documentElement: { dataset: {} } };

assert.equal(getThemePreference({ storage, mediaQuery: { matches: true } }), "dark");
assert.equal(applyThemePreference({ storage, documentRoot, mediaQuery: { matches: true } }), "dark");
assert.equal(documentRoot.documentElement.dataset.theme, "dark");
assert.equal(setThemePreference("light", { storage, documentRoot }), "light");
assert.equal(storage.getItem(THEME_PREFERENCE_STORAGE_KEY), "light");
assert.equal(documentRoot.documentElement.dataset.theme, "light");
assert.equal(toggleThemePreference({ storage, documentRoot }), "dark");
assert.equal(setThemePreference("invalid", { storage, documentRoot }), null);
assert.equal(getThemePreference({ storage }), "dark");
const hydrated = await hydrateThemePreferenceFromApi({
  storage,
  documentRoot,
  getPreferences: async () => ({ available: true, source: "LMS", preferences: { theme: "light" } })
});
assert.deepEqual(hydrated, { theme: "light", source: "LMS" });
assert.equal(storage.getItem(THEME_PREFERENCE_STORAGE_KEY), "light");
const fallback = await hydrateThemePreferenceFromApi({ storage, documentRoot, getPreferences: async () => ({ available: false, source: "demo-fallback" }) });
assert.equal(fallback.source, "demo-fallback");
console.log("THEME_PREFERENCE_PERSISTENCE_OK");

const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const teacher = readFileSync(new URL("../modules/professor/teacher-dashboard.js", import.meta.url), "utf8");
const teacherHtml = readFileSync(new URL("../modules/professor/teacher-dashboard.html", import.meta.url), "utf8");
const admin = readFileSync(new URL("../modules/admin/admin-dashboard.js", import.meta.url), "utf8");
const adminHtml = readFileSync(new URL("../modules/admin/admin-dashboard.html", import.meta.url), "utf8");

assert.match(app, /applyThemePreference\(\)/);
assert.match(app, /toggleThemePreference\(\)/);
assert.match(index, /id="theme-toggle"/);
assert.match(index, /id="theme-preference-state"/);
assert.match(index, /id="loginUsername"[^>]*placeholder="Ej\.: usuario\.institucional"/);
assert.match(index, /id="loginPassword"[^>]*placeholder="Ingresa tu contraseña"/);
assert.match(styles, /html\[data-theme="dark"\] \.student-lms-course-detail/);
assert.match(styles, /\.profile-session-card \.logout:focus-visible/);
assert.match(teacher, /syncTeacherThemeButton/);
assert.match(teacherHtml, /id="teacher-theme-toggle"/);
assert.match(admin, /syncAdminThemeButton/);
assert.match(adminHtml, /id="admin-theme-toggle"/);
console.log("THEME_ROLE_UI_OK");
