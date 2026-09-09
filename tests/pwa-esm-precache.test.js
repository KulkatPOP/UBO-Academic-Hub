import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const serviceWorkerPath = resolve(projectRoot, "service-worker.js");
const shellDefinitions = [
  {
    name: "PROFESSOR",
    html: "modules/professor/teacher-dashboard.html",
    entry: "modules/professor/teacher-dashboard.js",
    css: "modules/professor/teacher-dashboard.css"
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
  const basePath = specifier.startsWith("/")
    ? resolve(projectRoot, `.${specifier}`)
    : resolve(dirname(importerPath), specifier);
  const candidates = extname(basePath)
    ? [basePath]
    : [basePath, `${basePath}.js`, resolve(basePath, "index.js")];
  const existing = candidates.find(candidate => existsSync(candidate));

  return existing && isInsideProject(existing) ? existing : null;
}

function collectImportGraph(entryPath) {
  const modules = new Set();
  const missingImports = [];
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
      const importedPath = resolveLocalImport(normalizedPath, specifier);
      if (!importedPath) {
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

  return { modules, missingImports, duplicateImports, cycles };
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
    "PWA_PRECACHE_COLLECTION_UNDETERMINED: no se encontró una colección explícita con los entrypoints Profesor y Admin."
  );

  return collection;
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

function verifyRegressionDetection(graphAssets, precacheAssets) {
  const futureModule = "modules/professor/future-module.js";
  const simulatedGraph = new Set([...graphAssets, futureModule]);
  const simulatedMissing = listMissing([...simulatedGraph], precacheAssets);

  assert.ok(simulatedMissing.includes(futureModule), "La simulación debe detectar un nuevo import fuera del precache.");
  console.log("PWA_PRECACHE_REGRESSION_SIMULATION_OK");
}

const precacheCollection = extractPrecacheCollection();
const precacheAssets = new Set(precacheCollection.assets);
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

const precacheExtras = [...precacheAssets].filter(asset => !allExpectedShellAssets.has(asset));
if (duplicatePrecacheAssets.length) {
  console.warn(`PRECACHE_DUPLICATES_WARNING\n${formatList(unique(duplicatePrecacheAssets))}`);
}
if (precacheExtras.length) {
  console.warn(`PRECACHE_EXTRA_ASSETS_WARNING\n${formatList(precacheExtras)}`);
}

verifyRegressionDetection(allGraphAssets, precacheAssets);

if (failures.length) {
  console.error("PWA_PRECACHE_COVERAGE_FAILED");
  console.error(failures.join("\n\n"));
  process.exitCode = 1;
} else {
  console.log("PWA_PRECACHE_COVERAGE_OK");
}
