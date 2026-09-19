// Preferencias visuales locales con sincronización API-first reversible para el LMS.
// La copia local se conserva como fallback cuando el backend no está disponible.
import { getUserPreferences, updateUserPreferences } from "./api/user-preferences-api-service.js";
export const THEME_PREFERENCE_STORAGE_KEY = "uboThemePreference";

const THEMES = new Set(["light", "dark", "system"]);

function getStorage(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage; } catch { return null; }
}

function safeRead(storage) {
  try { return storage?.getItem(THEME_PREFERENCE_STORAGE_KEY); } catch { return null; }
}

function systemTheme(mediaQuery) {
  const query = mediaQuery ?? globalThis.matchMedia?.("(prefers-color-scheme: dark)");
  return query?.matches ? "dark" : "light";
}

function applyToRoot(theme, documentRoot) {
  const root = documentRoot ?? globalThis.document;
  if (root?.documentElement) root.documentElement.dataset.theme = theme;
  return theme;
}

export function getThemePreference({ storage, mediaQuery } = {}) {
  const savedTheme = safeRead(getStorage(storage));
  return savedTheme === "system" ? systemTheme(mediaQuery) : THEMES.has(savedTheme) ? savedTheme : systemTheme(mediaQuery);
}

export function applyThemePreference(options = {}) {
  return applyToRoot(getThemePreference(options), options.documentRoot);
}

export function setThemePreference(theme, { storage, documentRoot, mediaQuery, sync = true } = {}) {
  if (!THEMES.has(theme)) return null;
  try { getStorage(storage)?.setItem(THEME_PREFERENCE_STORAGE_KEY, theme); } catch { /* La interfaz sigue pudiendo aplicar el tema en esta sesión. */ }
  const appliedTheme = theme === "system" ? systemTheme(mediaQuery) : theme;
  if (sync) void updateUserPreferences({ theme }, { storage });
  return applyToRoot(appliedTheme, documentRoot);
}

export function toggleThemePreference(options = {}) {
  const nextTheme = getThemePreference(options) === "dark" ? "light" : "dark";
  return setThemePreference(nextTheme, options);
}

/** Lee el valor LMS sólo cuando existe una sesión backend; ante error mantiene el fallback local. */
export async function hydrateThemePreferenceFromApi({ storage, documentRoot, mediaQuery, getPreferences = getUserPreferences } = {}) {
  const result = await getPreferences({ storage });
  const storedTheme = result.available && THEMES.has(result.preferences?.theme) ? result.preferences.theme : null;
  if (!storedTheme) return { theme: getThemePreference({ storage, mediaQuery }), source: "demo-fallback" };
  return { theme: setThemePreference(storedTheme, { storage, documentRoot, mediaQuery, sync: false }), source: "LMS" };
}
