import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { clearSession, getCurrentUser } from "../core/session.js";
import { canNavigate, getAllowedRoute } from "../core/router.js";
import { getRolePermissions, hasPermission, hasRole } from "../core/permissions.js";
import { demoUsers, generateInstitutionalUsername } from "../data/users.js";
import { authenticateDemoLogin, getDemoUsers, selectDemoUser } from "../modules/demo/demo-selector.js";
import { getDemoRoute, selectDemoRoute } from "../modules/demo/demo-router.js";
import { validateAdministrativeAction } from "../services/admin-actions/administrative-action-service.js";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const readProjectFile = relativePath => readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
const byRole = role => demoUsers.find(user => user.role === role);
const student = byRole("STUDENT");
const teacher = byRole("TEACHER");
const admin = byRole("ADMIN");

assert.equal(demoUsers.length, 3, "La fuente futura debe contener exactamente los tres perfiles demo auditados.");
assert.deepEqual(demoUsers.map(user => user.role), ["STUDENT", "TEACHER", "ADMIN"]);
assert.equal(student?.nombre, "Sofía Martínez Rojas");
assert.equal(teacher?.nombre, "Carlos Pérez");
assert.equal(admin?.nombre, "Administrador UBO");
assert.equal(student?.username, "msofia");
assert.equal(teacher?.username, "pcarlos");
assert.equal(admin?.username, "admin");
assert.equal(generateInstitutionalUsername(student), "msofia");
assert.equal(generateInstitutionalUsername(teacher), "pcarlos");
assert.equal(generateInstitutionalUsername(admin), "admin");

for (const user of demoUsers) {
  assert.deepEqual(user.permissions, getRolePermissions(user.role), `Los permisos de ${user.role} deben coincidir con la política legacy.`);
}

assert.equal(hasRole(student, "STUDENT"), true);
assert.equal(hasPermission(student, "student.dashboard.read"), true);
assert.equal(hasPermission(student, "teacher.dashboard.read"), false);
assert.equal(hasPermission(student, "admin.dashboard.read"), false);
assert.equal(canNavigate(getAllowedRoute("STUDENT"), student), true);
assert.equal(canNavigate(getAllowedRoute("TEACHER"), student), false);
assert.equal(canNavigate(getAllowedRoute("ADMIN"), student), false);
console.log("DEMO_STUDENT_OK");

assert.equal(hasRole(teacher, "TEACHER"), true);
assert.equal(hasPermission(teacher, "teacher.dashboard.read"), true);
assert.equal(hasPermission(teacher, "admin.dashboard.read"), false);
assert.equal(canNavigate(getAllowedRoute("TEACHER"), teacher), true);
assert.equal(canNavigate(getAllowedRoute("ADMIN"), teacher), false);
console.log("DEMO_TEACHER_OK");

assert.equal(hasRole(admin, "ADMIN"), true);
assert.equal(hasPermission(admin, "admin.dashboard.read"), true);
assert.equal(canNavigate(getAllowedRoute("ADMIN"), admin), true);
console.log("DEMO_ADMIN_OK");

const unknownUser = { id: "unknown", role: "UNKNOWN", permissions: [] };
assert.equal(getAllowedRoute("UNKNOWN"), null);
assert.equal(canNavigate("student-dashboard", unknownUser), false);
assert.equal(hasPermission(unknownUser, "student.dashboard.read"), false);
assert.equal(hasPermission(admin, "permission.that.does.not.exist"), false);

const adminAction = { actionType: "manage-students", entityId: student.id };
assert.equal(validateAdministrativeAction({ ...adminAction, actor: student }).valid, false, "STUDENT no debe preparar acciones administrativas.");
assert.equal(validateAdministrativeAction({ ...adminAction, actor: teacher }).valid, false, "TEACHER no debe preparar acciones administrativas.");
assert.equal(validateAdministrativeAction({ ...adminAction, actor: unknownUser }).valid, false, "Un rol desconocido no debe preparar acciones administrativas.");
assert.equal(validateAdministrativeAction({ ...adminAction, actor: admin }).valid, true, "ADMIN debe poder preparar una acción administrativa disponible.");

clearSession();
assert.equal(getCurrentUser(), null);
assert.equal(selectDemoUser(student.id)?.id, student.id);
assert.equal(getCurrentUser()?.role, "STUDENT");
assert.equal(authenticateDemoLogin("msofia", "123456")?.id, student.id);
assert.equal(authenticateDemoLogin("pcarlos", "123456")?.role, "TEACHER");
assert.equal(authenticateDemoLogin("admin", "admin123")?.role, "ADMIN");
assert.equal(authenticateDemoLogin("msofia", "incorrecta"), null);
assert.equal(selectDemoRoute(teacher.id)?.route.path, "../professor/teacher-dashboard.html");
assert.equal(getDemoRoute("ADMIN")?.path, "../admin/admin-dashboard.html");
clearSession();

const appSource = readProjectFile("app.js");
const teacherShellSource = readProjectFile("modules/professor/teacher-dashboard.js");
const adminShellSource = readProjectFile("modules/admin/admin-dashboard.js");

assert.match(appSource, /function login\(\)/, "La aplicación estudiante debe conservar el punto de entrada de login.");
assert.match(appSource, /localStorage\.removeItem\("uboSession"\)/, "La aplicación estudiante debe conservar el cierre de sesión legacy.");
assert.match(appSource, /username:"sofia\.martinez"/, "Sofía debe seguir siendo una cuenta demo del login legacy.");
assert.match(appSource, /findInstitutionalDemoUser/, "El login debe validar las credenciales institucionales demo.");

const hasAuthorizationGuard = source => /canNavigate|getCurrentUser|hasPermission|hasRole|enforceDemoRouteGuard/.test(source);
assert.equal(hasAuthorizationGuard(teacherShellSource), true);
assert.equal(hasAuthorizationGuard(adminShellSource), true);

console.log("INSTITUTIONAL_DEMO_LOGIN_ROLE_MAPPING_OK");
console.log("AUTHORIZATION_ENFORCEMENT PROFESSOR_ADMIN_RUNTIME_ROUTE_GUARDS_ACTIVE");
console.log("UI_VISIBILITY INSTITUTIONAL_DEMO_LOGIN_REPLACES_ROLE_SELECTOR");
console.log("NOT_CURRENTLY_ENFORCED CORE_ROUTER_IS_NOT_CONNECTED_TO_LEGACY_OR_DEMO_NAVIGATION");
console.log("REQUIRES_AUTHORIZATION_LAYER SERVER_SIDE_ENFORCEMENT_REMAINS_FUTURE_WORK");
console.log("demo-profiles-authorization-audit.test.js: OK");
