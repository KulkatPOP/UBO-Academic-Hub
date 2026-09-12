// Preferencias visuales locales para las interfaces UBO. No participa en la sesión ni en los servicios académicos.
export const THEME_PREFERENCE_STORAGE_KEY = "uboThemePreference";

const THEMES = new Set(["light", "dark"]);

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
  return THEMES.has(savedTheme) ? savedTheme : systemTheme(mediaQuery);
}

export function applyThemePreference(options = {}) {
  return applyToRoot(getThemePreference(options), options.documentRoot);
}

export function setThemePreference(theme, { storage, documentRoot } = {}) {
  if (!THEMES.has(theme)) return null;
  try { getStorage(storage)?.setItem(THEME_PREFERENCE_STORAGE_KEY, theme); } catch { /* La interfaz sigue pudiendo aplicar el tema en esta sesión. */ }
  return applyToRoot(theme, documentRoot);
}

export function toggleThemePreference(options = {}) {
  const nextTheme = getThemePreference(options) === "dark" ? "light" : "dark";
  return setThemePreference(nextTheme, options);
}
