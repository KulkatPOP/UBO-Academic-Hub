// Configuración institucional pasiva de UboAcademicHub.
// No contiene datos académicos, sesión, almacenamiento, DOM ni integraciones.

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function copy(value) {
  if (Array.isArray(value)) return value.map(copy);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)]));
  }
  return value;
}

const institutionConfig = deepFreeze({
  // REQUIERE DEFINICIÓN INSTITUCIONAL: no existe un identificador oficial en el proyecto actual.
  institutionId: null,
  institutionIdStatus: "REQUIERE DEFINICIÓN INSTITUCIONAL",
  institutionName: "Universidad Bernardo O'Higgins",
  shortName: "UBO",
  applicationName: "Ubo Academic Hub",
  identity: {
    institutionalEmailDomain: "@pregrado.ubo.cl"
  },
  branding: {
    primaryColor: "#20377D",
    accentColor: "#80BBDF",
    logoPath: "./icons/icon.svg",
    iconPath: "./icons/icon-192.png"
  },
  campus: {
    // Los campus siguen en campusLocations de app.js; no se duplican aquí.
    source: "legacy-app.js:campusLocations",
    status: "DEMO / PENDIENTE DE ADAPTER INSTITUCIONAL"
  },
  featureFlags: {
    USE_CANONICAL_CAREER: false,
    USE_CANONICAL_ROOM: false
  },
  pwa: {
    manifestPath: "./manifest.json",
    status: "PENDIENTE DE EXTERNALIZACIÓN; manifest permanece UBO"
  }
});

// La copia evita que consumidores modifiquen la fuente de configuración.
export function getInstitutionConfig() {
  return copy(institutionConfig);
}
