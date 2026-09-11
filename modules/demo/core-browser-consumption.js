// DEVELOPMENT_ONLY: prueba aislada, sin sesión, guards ni cambios de runtime.

const status = document.getElementById("core-browser-status");
const coreModuleUrl = "http://127.0.0.1:3101/core/identity-snapshot.js";

try {
  const { createIdentitySnapshot } = await import(coreModuleUrl);
  const snapshot = createIdentitySnapshot({ id: "teacher-carlos-perez", roles: ["TEACHER"] });
  if (snapshot.id !== "teacher-carlos-perez" || snapshot.roles.length !== 1 || snapshot.roles[0] !== "TEACHER") {
    throw new TypeError("Invalid identity snapshot");
  }
  status.textContent = "IDENTITY_SNAPSHOT_BROWSER_IMPORT_OK · teacher-carlos-perez / TEACHER";
} catch {
  status.textContent = "CORE_BROWSER_UNAVAILABLE";
}
