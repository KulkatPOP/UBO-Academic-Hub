import assert from "node:assert/strict";
import { clearCurrentDemoIdentity, getCurrentDemoIdentity, resolveLegacyStudentIdentity, setCurrentDemoIdentity } from "../core/demo-identity-session.js";
import { evaluateDemoRouteGuard } from "../core/demo-route-guard.js";
import { demoUsers } from "../data/users.js";

const byRole = role => demoUsers.find(user => user.role === role);
const student = byRole("STUDENT");
const teacher = byRole("TEACHER");
const admin = byRole("ADMIN");

assert.deepEqual(resolveLegacyStudentIdentity({
  loggedIn: true,
  username: "sofia.martinez",
  studentData: { email: student.email }
}), { id: student.id, role: "STUDENT" });
assert.equal(resolveLegacyStudentIdentity({ loggedIn: true, studentData: { email: "not-found@ubo.cl" } }), null);

assert.deepEqual(setCurrentDemoIdentity(student), { id: student.id, role: "STUDENT" });
assert.deepEqual(getCurrentDemoIdentity(), { id: student.id, role: "STUDENT" });
assert.equal(evaluateDemoRouteGuard("STUDENT", student).allowed, true);
assert.equal(evaluateDemoRouteGuard("TEACHER", student).allowed, false);
assert.equal(evaluateDemoRouteGuard("ADMIN", student).allowed, false);
console.log("STUDENT_ROUTE_GUARDS_OK");

assert.deepEqual(setCurrentDemoIdentity(teacher), { id: teacher.id, role: "TEACHER" });
assert.equal(evaluateDemoRouteGuard("TEACHER", teacher).allowed, true);
assert.equal(evaluateDemoRouteGuard("ADMIN", teacher).allowed, false);
console.log("TEACHER_ROUTE_GUARDS_OK");

assert.deepEqual(setCurrentDemoIdentity(admin), { id: admin.id, role: "ADMIN" });
assert.equal(evaluateDemoRouteGuard("ADMIN", admin).allowed, true);
assert.equal(evaluateDemoRouteGuard("TEACHER", admin).allowed, false);
console.log("ADMIN_ROUTE_GUARDS_OK");

clearCurrentDemoIdentity();
assert.equal(evaluateDemoRouteGuard("TEACHER", null).reason, "UNAUTHENTICATED");
assert.equal(evaluateDemoRouteGuard("ADMIN", null).allowed, false);
assert.equal(evaluateDemoRouteGuard("ADMIN", { id: "unknown", role: "UNKNOWN" }).allowed, false);
assert.equal(evaluateDemoRouteGuard("ADMIN", { id: student.id, role: "ADMIN" }).reason, "INVALID_IDENTITY");
assert.equal(setCurrentDemoIdentity({ id: "admin-ubo", role: "UNKNOWN" }), null);
console.log("ROUTE_GUARD_NEGATIVE_CASES_OK");

const firstDecision = evaluateDemoRouteGuard("ADMIN", admin);
const secondDecision = evaluateDemoRouteGuard("ADMIN", admin);
assert.deepEqual(firstDecision, secondDecision);
console.log("ROUTE_GUARD_DETERMINISTIC_OK");
console.log("demo-route-guards.test.js: OK");
