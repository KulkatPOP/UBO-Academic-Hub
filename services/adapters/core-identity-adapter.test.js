import assert from "node:assert/strict";
import { isIdentityPort, resolveIdentity } from "../../../UniEcosystemCore/core/ports/identity-port.js";
import { demoUsers } from "../../data/users.js";
import {
  adaptLegacyStudentSessionToCoreSnapshot,
  adaptUboIdentityToCoreSnapshot,
  createUboIdentityPort
} from "./core-identity-adapter.js";

const byRole = role => demoUsers.find(user => user.role === role);
const student = byRole("STUDENT");
const teacher = byRole("TEACHER");
const admin = byRole("ADMIN");

for (const user of [student, teacher, admin]) {
  const snapshot = adaptUboIdentityToCoreSnapshot({ ...user, permissions: ["ignored"] });
  assert.deepEqual(snapshot, { id: user.id, roles: [user.role] });
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.roles), true);
  assert.throws(() => snapshot.roles.push("ADMIN"), TypeError);
}
console.log("UBO_IDENTITY_SNAPSHOTS_OK");

assert.deepEqual(
  adaptLegacyStudentSessionToCoreSnapshot({
    loggedIn: true,
    studentData: { email: student.email }
  }),
  { id: student.id, roles: ["STUDENT"] }
);
assert.equal(adaptLegacyStudentSessionToCoreSnapshot(null), null);
assert.equal(adaptLegacyStudentSessionToCoreSnapshot({ loggedIn: false }), null);
assert.equal(adaptUboIdentityToCoreSnapshot(null), null);
console.log("UBO_LEGACY_STUDENT_READ_ONLY_OK");

for (const invalid of [
  undefined,
  {},
  { id: "", role: "STUDENT" },
  { id: "unknown", role: "STUDENT" },
  { id: student.id, role: "ADMIN" },
  { id: teacher.id, role: "STUDENT" },
  { id: admin.id, role: "TEACHER" },
  { id: student.id, role: "" }
]) {
  assert.throws(() => adaptUboIdentityToCoreSnapshot(invalid), TypeError);
}
console.log("UBO_INVALID_IDENTITY_REJECTED");

const transitions = [student, teacher, admin, student].map(user =>
  adaptUboIdentityToCoreSnapshot({ id: user.id, role: user.role })
);
assert.deepEqual(transitions.map(snapshot => snapshot.roles), [["STUDENT"], ["TEACHER"], ["ADMIN"], ["STUDENT"]]);
assert.deepEqual(adaptUboIdentityToCoreSnapshot({ id: student.id, role: "STUDENT", roleClaims: ["ADMIN"] }), {
  id: student.id,
  roles: ["STUDENT"]
});
assert.deepEqual(adaptUboIdentityToCoreSnapshot({ id: admin.id, role: "ADMIN", roleClaims: ["TEACHER"] }), {
  id: admin.id,
  roles: ["ADMIN"]
});
console.log("UBO_PROFILE_SWITCH_AND_NO_ESCALATION_OK");

const port = createUboIdentityPort(() => ({ id: teacher.id, role: teacher.role }));
assert.equal(isIdentityPort(port), true);
assert.deepEqual(resolveIdentity(port), { id: teacher.id, roles: ["TEACHER"] });
assert.throws(() => createUboIdentityPort(() => ({ id: student.id, role: "ADMIN" })).resolveIdentity(), TypeError);
assert.throws(() => createUboIdentityPort(() => undefined).resolveIdentity(), TypeError);
assert.equal(resolveIdentity(createUboIdentityPort(() => null)), null);
console.log("UBO_IDENTITY_PORT_CONTRACT_OK");

console.log("core-identity-adapter.test.js: OK");
