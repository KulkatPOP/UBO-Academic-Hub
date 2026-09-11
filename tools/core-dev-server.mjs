// DEVELOPMENT_ONLY: expone un único módulo ESM real de UniEcosystemCore.
// No forma parte del runtime UBO, no escribe archivos y no sirve directorios.

import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const toolDirectory = dirname(fileURLToPath(import.meta.url));
const coreRoot = resolve(toolDirectory, "../../UniEcosystemCore");
const modulePathname = "/core/identity-snapshot.js";
const identitySnapshotPath = resolve(coreRoot, ".", "core", "identity-snapshot.js");

export const CORE_DEV_SERVER_CONFIG = Object.freeze({
  host: "127.0.0.1",
  port: 3101,
  allowedOrigin: "http://localhost:3000",
  modulePathname,
  coreRoot,
  identitySnapshotPath
});

function writeResponse(response, statusCode, headers = {}, body = "") {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...headers
  });
  response.end(body);
}

function isAllowedOrigin(request) {
  return request.headers.origin === CORE_DEV_SERVER_CONFIG.allowedOrigin;
}

export function createCoreDevServer() {
  return createServer((request, response) => {
    if (!isAllowedOrigin(request)) {
      writeResponse(response, 403, {}, "Origin not allowed");
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      writeResponse(response, 405, { Allow: "GET, HEAD" }, "Method not allowed");
      return;
    }

    const pathname = new URL(request.url || "/", "http://localhost").pathname;
    if (pathname !== CORE_DEV_SERVER_CONFIG.modulePathname || !existsSync(CORE_DEV_SERVER_CONFIG.identitySnapshotPath)) {
      writeResponse(response, 404, {}, "Not found");
      return;
    }

    const body = request.method === "HEAD" ? "" : readFileSync(CORE_DEV_SERVER_CONFIG.identitySnapshotPath, "utf8");
    writeResponse(response, 200, {
      "Access-Control-Allow-Origin": CORE_DEV_SERVER_CONFIG.allowedOrigin,
      Vary: "Origin",
      "Content-Type": "text/javascript; charset=utf-8"
    }, body);
  });
}

export function startCoreDevServer({ port = CORE_DEV_SERVER_CONFIG.port, host = CORE_DEV_SERVER_CONFIG.host } = {}) {
  const server = createCoreDevServer();
  return new Promise((resolveStart, rejectStart) => {
    server.once("error", rejectStart);
    server.listen(port, host, () => {
      server.off("error", rejectStart);
      const address = server.address();
      resolveStart(Object.freeze({ server, host, port: address.port, origin: `http://${host}:${address.port}` }));
    });
  });
}

const isMainModule = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  startCoreDevServer()
    .then(({ origin }) => console.log(`CORE_DEV_SERVER_READY ${origin}${CORE_DEV_SERVER_CONFIG.modulePathname}`))
    .catch(error => {
      console.error(`CORE_DEV_SERVER_ERROR ${error instanceof Error ? error.message : "Unknown error"}`);
      process.exitCode = 1;
    });
}
