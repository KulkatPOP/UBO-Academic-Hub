import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const worker = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");

assert.equal(manifest.name, "Ubo Academic Hub");
assert.equal(manifest.short_name, "UBO Hub");
assert.equal(manifest.description, "Plataforma académica institucional UBO");
assert.equal(manifest.start_url, "./");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.orientation, "portrait");
assert.equal(manifest.lang, "es-CL");
assert.deepEqual(manifest.icons.map(icon => icon.sizes).sort(), ["192x192", "512x512"]);
assert.ok(manifest.icons.every(icon => icon.purpose.includes("any") && icon.purpose.includes("maskable")));
assert.match(index, /id="pwa-install-button"/);
assert.match(index, /id="pwa-install-state"/);
assert.match(app, /beforeinstallprompt/);
assert.match(app, /appinstalled/);
assert.match(app, /UBO Academic Hub instalada correctamente/);
assert.match(worker, /ubo-academic-hub-v200/);
assert.match(worker, /cache:'no-store'/);
assert.doesNotMatch(app.match(/function setupPwaInstallation\(\)[\s\S]*?function init/)?.[0] || "", /innerHTML/);
console.log("PWA_INSTALLATION_UPGRADE_OK");
