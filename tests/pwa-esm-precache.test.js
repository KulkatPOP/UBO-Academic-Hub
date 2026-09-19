import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const serviceWorkerPath = resolve(projectRoot, "service-worker.js");
const shellDefinitions = [
  {
    name: "SELECTOR",
    html: "modules/demo/demo-selector.html",
    entry: "modules/demo/demo-selector-ui.js",
    css: "modules/demo/demo-selector.css"
  },
  {
    name: "PROFESSOR",
    html: "modules/professor/teacher-dashboard.html",
    entry: "modules/professor/teacher-dashboard.js",
    css: "modules/professor/teacher-dashboard.css"
  },
  {
    name: "PROFESSOR_COURSE_DETAIL",
    html: "modules/professor/teacher-course-detail.html",
    entry: "modules/professor/teacher-course-detail.js",
    css: "modules/professor/teacher-course-detail.css"
  },
  {
    name: "ADMIN",
    html: "modules/admin/admin-dashboard.html",
    entry: "modules/admin/admin-dashboard.js",
    css: "modules/admin/admin-dashboard.css"
  }
];

function toProjectPath(value) {
  const normalized = normalize(String(value).replace(/[?#].*$/, "").replace(/\\/g, "/"));
  return normalized.replace(/^([.][\\/])+/, "").replace(/^[\\/]+/, "").replace(/\\/g, "/");
}

function isInsideProject(filePath) {
  const projectRelative = relative(projectRoot, filePath);
  return projectRelative && !projectRelative.startsWith("..") && !projectRelative.includes(":");
}

function isLocalSpecifier(specifier) {
  return specifier.startsWith(".") || specifier.startsWith("/");
}

function findSpecifierOccurrences(source) {
  const patterns = [
    /\bimport\s+(?:[\w*$\s{},]*\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+(?:[\w*$\s{},]*\s+from\s+)["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
  ];

  return patterns.flatMap(pattern => [...source.matchAll(pattern)].map(match => match[1]));
}

function resolveLocalImport(importerPath, specifier) {
  const cleanSpecifier = specifier.replace(/[?#].*$/, "");
  const basePath = cleanSpecifier.startsWith("/")
    ? resolve(projectRoot, `.${cleanSpecifier}`)
    : resolve(dirname(importerPath), cleanSpecifier);
  const candidates = extname(basePath)
    ? [basePath]
    : [basePath, `${basePath}.js`, resolve(basePath, "index.js")];
  const existing = candidates.find(candidate => existsSync(candidate));

  return existing && isInsideProject(existing) ? existing : null;
}

function isExternalCoreSpecifier(specifier) {
  return specifier.includes("UniEcosystemCore");
}

function isDevelopmentOnlyCanarySpecifier(specifier) {
  return specifier.includes("core-identity-canary-runtime.js");
}

function collectImportGraph(entryPath) {
  const modules = new Set();
  const missingImports = [];
  const externalImports = [];
  const duplicateImports = [];
  const cycles = [];
  const visited = new Set();
  const visiting = [];

  function visit(filePath) {
    const normalizedPath = resolve(filePath);
    if (visiting.includes(normalizedPath)) {
      const cycleStart = visiting.indexOf(normalizedPath);
      cycles.push([...visiting.slice(cycleStart), normalizedPath].map(file => toProjectPath(relative(projectRoot, file))));
      return;
    }
    if (visited.has(normalizedPath)) return;

    visited.add(normalizedPath);
    visiting.push(normalizedPath);
    modules.add(toProjectPath(relative(projectRoot, normalizedPath)));

    const localSpecifiers = findSpecifierOccurrences(readFileSync(normalizedPath, "utf8"))
      .filter(isLocalSpecifier);
    const occurrenceCount = new Map();

    for (const specifier of localSpecifiers) {
      occurrenceCount.set(specifier, (occurrenceCount.get(specifier) || 0) + 1);
      if (isDevelopmentOnlyCanarySpecifier(specifier)) {
        externalImports.push({
          importer: toProjectPath(relative(projectRoot, normalizedPath)),
          specifier
        });
        continue;
      }
      const importedPath = resolveLocalImport(normalizedPath, specifier);
      if (!importedPath) {
        if (isExternalCoreSpecifier(specifier) || isDevelopmentOnlyCanarySpecifier(specifier)) {
          externalImports.push({
            importer: toProjectPath(relative(projectRoot, normalizedPath)),
            specifier
          });
          continue;
        }
        missingImports.push({
          importer: toProjectPath(relative(projectRoot, normalizedPath)),
          specifier
        });
        continue;
      }
      visit(importedPath);
    }

    for (const [specifier, count] of occurrenceCount) {
      if (count > 1) {
        duplicateImports.push({
          importer: toProjectPath(relative(projectRoot, normalizedPath)),
          specifier,
          count
        });
      }
    }
    visiting.pop();
  }

  const absoluteEntry = resolve(projectRoot, entryPath);
  if (!existsSync(absoluteEntry)) {
    missingImports.push({ importer: "ENTRYPOINT", specifier: entryPath });
  } else {
    visit(absoluteEntry);
  }

  return { modules, missingImports, externalImports, duplicateImports, cycles };
}

function extractPrecacheCollection() {
  const source = readFileSync(serviceWorkerPath, "utf8");
  const collectionPattern = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\[([\s\S]*?)\];/g;
  const collections = [...source.matchAll(collectionPattern)].map(([, name, body]) => ({
    name,
    assets: [...body.matchAll(/["']([^"']+)["']/g)].map(([, asset]) => toProjectPath(asset))
  }));
  const requiredEntrypoints = new Set(shellDefinitions.map(shell => shell.entry));
  const collection = collections.find(candidate => requiredEntrypoints.size === [...requiredEntrypoints]
    .filter(entry => candidate.assets.includes(entry)).length);

  assert.ok(
    collection,
    "PWA_PRECACHE_COLLECTION_UNDETERMINED: no se encontró una colección explícita con los entrypoints Selector, Profesor y Admin."
  );

  const appAssets = collections.find(candidate => candidate.name === "APP_ASSETS")?.assets || [];
  return { ...collection, assets: unique([...collection.assets, ...appAssets]) };
}

function extractOfflineDocumentMap() {
  const source = readFileSync(serviceWorkerPath, "utf8");
  const match = source.match(/(?:const|let|var)\s+OFFLINE_DOCUMENTS\s*=\s*\{([\s\S]*?)\};/);
  assert.ok(match, "PWA_OFFLINE_DOCUMENTS_UNDETERMINED: no se encontró el mapa documental explícito.");

  return new Map(
    [...match[1].matchAll(/["']([^"']+)["']\s*:\s*["']([^"']+)["']/g)]
      .map(([, pathname, asset]) => [pathname, toProjectPath(asset)])
  );
}

function getDirectShellAssets(htmlPath) {
  const absoluteHtmlPath = resolve(projectRoot, htmlPath);
  const source = readFileSync(absoluteHtmlPath, "utf8");
  const directAssets = { html: [toProjectPath(htmlPath)], css: [], javascript: [], assets: [] };
  const tagPattern = /<(script|link|img)\b[^>]*(?:src|href)\s*=\s*["']([^"']+)["'][^>]*>/gi;

  for (const match of source.matchAll(tagPattern)) {
    const [tag, rawSpecifier] = [match[1].toLowerCase(), match[2]];
    if (!isLocalSpecifier(rawSpecifier)) continue;
    const assetPath = resolveLocalImport(absoluteHtmlPath, rawSpecifier);
    if (!assetPath) continue;
    const asset = toProjectPath(relative(projectRoot, assetPath));
    if (tag === "script") directAssets.javascript.push(asset);
    else if (tag === "link") directAssets.css.push(asset);
    else directAssets.assets.push(asset);
  }

  for (const cssPath of directAssets.css) {
    const absoluteCssPath = resolve(projectRoot, cssPath);
    const cssSource = readFileSync(absoluteCssPath, "utf8");
    for (const match of cssSource.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
      const rawSpecifier = match[1].trim();
      if (!isLocalSpecifier(rawSpecifier)) continue;
      const assetPath = resolveLocalImport(absoluteCssPath, rawSpecifier);
      if (assetPath) directAssets.assets.push(toProjectPath(relative(projectRoot, assetPath)));
    }
  }

  return directAssets;
}

function unique(items) {
  return [...new Set(items)];
}

function listMissing(expected, precacheAssets) {
  return unique(expected.filter(asset => !precacheAssets.has(asset)));
}

function formatList(items) {
  return items.length ? items.map(item => `- ${item}`).join("\n") : "- Ninguno";
}

function verifyRegressionDetection(graphAssets, precacheAssets, futureModule, marker) {
  const simulatedGraph = new Set([...graphAssets, futureModule]);
  const simulatedMissing = listMissing([...simulatedGraph], precacheAssets);

  assert.ok(simulatedMissing.includes(futureModule), "La simulación debe detectar un nuevo import fuera del precache.");
  console.log(marker);
}

const precacheCollection = extractPrecacheCollection();
const precacheAssets = new Set(precacheCollection.assets);
const offlineDocuments = extractOfflineDocumentMap();
const serviceWorkerSource = readFileSync(serviceWorkerPath, "utf8");
assert.match(
  serviceWorkerSource,
  /const PRECACHE_ASSETS\s*=\s*\[\.\.\.new Set\(\[\.\.\.APP_ASSETS, \.\.\.DEMO_SHELL_ASSETS\]\)\];/,
  "El precache combinado debe deduplicar APP_ASSETS y DEMO_SHELL_ASSETS antes de Cache.addAll()."
);
const duplicatePrecacheAssets = precacheCollection.assets.filter((asset, index) => precacheCollection.assets.indexOf(asset) !== index);
const allGraphAssets = new Set();
const allExpectedShellAssets = new Set();
const failures = [];

console.log(`PWA_PRECACHE_COLLECTION=${precacheCollection.name}`);

for (const shell of shellDefinitions) {
  const graph = collectImportGraph(shell.entry);
  const shellAssets = getDirectShellAssets(shell.html);
  const graphAssets = [...graph.modules];
  const shellDirectAssets = unique([
    ...shellAssets.html,
    ...shellAssets.css,
    ...shellAssets.javascript,
    ...shellAssets.assets
  ]);
  const missingGraphAssets = listMissing(graphAssets, precacheAssets);
  const missingShellAssets = listMissing(shellDirectAssets, precacheAssets);
  const offlineFallbackPath = `/${shell.html}`;
  const offlineFallbackAsset = offlineDocuments.get(offlineFallbackPath);

  graphAssets.forEach(asset => allGraphAssets.add(asset));
  [...graphAssets, ...shellDirectAssets].forEach(asset => allExpectedShellAssets.add(asset));

  console.log(`${shell.name}_GRAPH_MODULES=${graphAssets.length}`);
  console.log(`${shell.name}_SHELL_HTML=${formatList(shellAssets.html)}`);
  console.log(`${shell.name}_SHELL_CSS=${formatList(shellAssets.css)}`);
  console.log(`${shell.name}_SHELL_JS=${formatList(shellAssets.javascript)}`);
  console.log(`${shell.name}_SHELL_ASSETS=${formatList(shellAssets.assets)}`);

  if (graph.missingImports.length) {
    failures.push(`IMPORT_MISSING (${shell.name})\n${graph.missingImports.map(item => `- ${item.importer} -> ${item.specifier}`).join("\n")}`);
  }
  if (missingGraphAssets.length || missingShellAssets.length) {
    failures.push(`PWA_PRECACHE_MISSING_ASSETS (${shell.name})\n${formatList(unique([...missingGraphAssets, ...missingShellAssets]))}`);
  }
  if (offlineFallbackAsset !== shell.html) {
    failures.push(`PWA_DOCUMENT_FALLBACK_MISSING (${shell.name})\n- ${offlineFallbackPath} debe devolver ${shell.html}`);
  }
  if (graph.cycles.length) {
    console.warn(`IMPORT_GRAPH_CYCLES_WARNING (${shell.name})\n${graph.cycles.map(cycle => `- ${cycle.join(" -> ")}`).join("\n")}`);
  } else {
    console.log(`${shell.name}_IMPORT_GRAPH_CYCLE_FREE`);
  }
  if (graph.duplicateImports.length) {
    console.warn(`IMPORT_DUPLICATES_WARNING (${shell.name})\n${graph.duplicateImports.map(item => `- ${item.importer} -> ${item.specifier} (${item.count})`).join("\n")}`);
  }

  if (!graph.missingImports.length && !missingGraphAssets.length && !missingShellAssets.length) {
    console.log(`${shell.name}_GRAPH_OK`);
  }
}

verifyRegressionDetection(allGraphAssets, precacheAssets, "modules/demo/future-selector-module.js", "PWA_PRECACHE_REGRESSION_SIMULATION_OK");

const adapterEntry = "services/adapters/core-identity-adapter.js";
const adapterGraph = collectImportGraph(adapterEntry);
const adapterGraphAssets = [...adapterGraph.modules];
const missingAdapterAssets = listMissing(adapterGraphAssets, precacheAssets);
const unexpectedAdapterExternals = adapterGraph.externalImports.filter(item => !isExternalCoreSpecifier(item.specifier));
const coreAssetsInPrecache = [...precacheAssets].filter(asset => /UniEcosystemCore|127\.0\.0\.1|identity-snapshot\.js/.test(asset));

adapterGraphAssets.forEach(asset => allExpectedShellAssets.add(asset));
console.log(`ADAPTER_GRAPH_MODULES=${adapterGraphAssets.length}`);
console.log(`ADAPTER_GRAPH_UBO_ASSETS=${formatList(adapterGraphAssets)}`);
console.log(`ADAPTER_GRAPH_EXTERNAL_CORE_IMPORTS=${formatList(adapterGraph.externalImports.map(item => `${item.importer} -> ${item.specifier}`))}`);

if (adapterGraph.missingImports.length) {
  failures.push(`IMPORT_MISSING (ADAPTER)\n${adapterGraph.missingImports.map(item => `- ${item.importer} -> ${item.specifier}`).join("\n")}`);
}
if (missingAdapterAssets.length) {
  failures.push(`PWA_PRECACHE_MISSING_ADAPTER_ASSETS\n${formatList(missingAdapterAssets)}`);
}
if (unexpectedAdapterExternals.length) {
  failures.push(`ADAPTER_UNEXPECTED_EXTERNAL_IMPORTS\n${formatList(unexpectedAdapterExternals.map(item => `${item.importer} -> ${item.specifier}`))}`);
}
if (coreAssetsInPrecache.length) {
  failures.push(`CORE_INCLUDED_IN_PWA\n${formatList(coreAssetsInPrecache)}`);
}
if (adapterGraph.cycles.length) {
  failures.push(`IMPORT_GRAPH_CYCLES (ADAPTER)\n${adapterGraph.cycles.map(cycle => `- ${cycle.join(" -> ")}`).join("\n")}`);
} else {
  console.log("ADAPTER_IMPORT_GRAPH_CYCLE_FREE");
}
if (adapterGraph.duplicateImports.length) {
  console.warn(`IMPORT_DUPLICATES_WARNING (ADAPTER)\n${adapterGraph.duplicateImports.map(item => `- ${item.importer} -> ${item.specifier} (${item.count})`).join("\n")}`);
}
if (!adapterGraph.missingImports.length && !missingAdapterAssets.length && !unexpectedAdapterExternals.length && !coreAssetsInPrecache.length && !adapterGraph.cycles.length) {
  console.log("ADAPTER_GRAPH_OK");
  console.log("CORE_NOT_INCLUDED_IN_PWA_OK");
}

verifyRegressionDetection(adapterGraphAssets, precacheAssets, "services/adapters/future-adapter-module.js", "ADAPTER_PRECACHE_REGRESSION_SIMULATION_OK");

const precacheExtras = [...precacheAssets].filter(asset => !allExpectedShellAssets.has(asset));
if (duplicatePrecacheAssets.length) {
  console.warn(`PRECACHE_DUPLICATES_WARNING\n${formatList(unique(duplicatePrecacheAssets))}`);
}
if (precacheExtras.length) {
  console.warn(`PRECACHE_EXTRA_ASSETS_WARNING\n${formatList(precacheExtras)}`);
}

if (failures.length) {
  console.error("PWA_PRECACHE_COVERAGE_FAILED");
  console.error(failures.join("\n\n"));
  process.exitCode = 1;
} else {
  console.log("PWA_PRECACHE_COVERAGE_OK");
}
