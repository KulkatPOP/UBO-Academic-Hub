import assert from "node:assert/strict";
import { request } from "node:http";
import { CORE_DEV_SERVER_CONFIG, startCoreDevServer } from "../tools/core-dev-server.mjs";

function requestCore(origin, pathname, requestOrigin = CORE_DEV_SERVER_CONFIG.allowedOrigin) {
  return new Promise((resolveRequest, rejectRequest) => {
    const target = new URL(pathname, origin);
    const clientRequest = request(target, { headers: { Origin: requestOrigin } }, response => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", chunk => { body += chunk; });
      response.on("end", () => resolveRequest({ statusCode: response.statusCode, headers: response.headers, body }));
    });
    clientRequest.once("error", rejectRequest);
    clientRequest.end();
  });
}

const runtime = await startCoreDevServer({ port: 0 });
try {
  assert.equal(runtime.host, "127.0.0.1");
  assert.match(runtime.origin, /^http:\/\/127\.0\.0\.1:\d+$/);

  const moduleResponse = await requestCore(runtime.origin, CORE_DEV_SERVER_CONFIG.modulePathname);
  assert.equal(moduleResponse.statusCode, 200);
  assert.equal(moduleResponse.headers["access-control-allow-origin"], "http://localhost:3000");
  assert.equal(moduleResponse.headers["access-control-allow-credentials"], undefined);
  assert.match(moduleResponse.headers["content-type"], /^text\/javascript/);
  assert.match(moduleResponse.body, /createIdentitySnapshot/);
  console.log("IDENTITY_SNAPSHOT_BROWSER_ENDPOINT_OK");

  const deniedOrigin = await requestCore(runtime.origin, CORE_DEV_SERVER_CONFIG.modulePathname, "http://example.invalid");
  assert.equal(deniedOrigin.statusCode, 403);
  assert.equal(deniedOrigin.headers["access-control-allow-origin"], undefined);
  console.log("CORE_CORS_RESTRICTED_TO_UBO_LOCALHOST");

  for (const pathname of ["/", "/package.json", "/../", "/../../Desktop/"]) {
    const response = await requestCore(runtime.origin, pathname);
    assert.equal(response.statusCode, 404);
  }
  console.log("CORE_SERVER_TRAVERSAL_AND_OUTSIDE_ACCESS_DENIED");

  const unavailableOrigin = "http://127.0.0.1:3102";
  await assert.rejects(() => requestCore(unavailableOrigin, CORE_DEV_SERVER_CONFIG.modulePathname));
  console.log("CORE_BROWSER_UNAVAILABLE_NON_BLOCKING_FIXTURE_OK");

  const source = await import("node:fs").then(({ readFileSync }) => readFileSync(new URL("../tools/core-dev-server.mjs", import.meta.url), "utf8"));
  assert.doesNotMatch(source, /SessionPort|InMemorySession|AuthorizationContext|localStorage|sessionStorage/);
  console.log("NO_SESSION_OR_AUTHORIZATION_IN_CORE_SERVER");
  console.log("core-browser-consumption.test.js: OK");
} finally {
  await new Promise(resolveClose => runtime.server.close(resolveClose));
}
