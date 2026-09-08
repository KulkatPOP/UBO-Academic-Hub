import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getInstitutionConfig } from "./institution.js";

const first = getInstitutionConfig();
assert.equal(first.institutionId, null);
assert.equal(first.institutionName, "Universidad Bernardo O'Higgins");
assert.equal(first.shortName, "UBO");
assert.equal(first.applicationName, "Ubo Academic Hub");
assert.equal(first.identity.institutionalEmailDomain, "@pregrado.ubo.cl");
assert.equal(first.branding.primaryColor, "#20377D");
assert.equal(first.featureFlags.USE_CANONICAL_CAREER, false);
assert.equal(first.featureFlags.USE_CANONICAL_ROOM, false);

first.identity.institutionalEmailDomain = "@example.invalid";
first.featureFlags.USE_CANONICAL_ROOM = true;
const second = getInstitutionConfig();
assert.equal(second.identity.institutionalEmailDomain, "@pregrado.ubo.cl");
assert.equal(second.featureFlags.USE_CANONICAL_ROOM, false);

const source = readFileSync(new URL("./institution.js", import.meta.url), "utf8");
assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\s*\(|XMLHttpRequest|WebSocket|document\.|window\./);

console.log("institution.test.js: OK");
