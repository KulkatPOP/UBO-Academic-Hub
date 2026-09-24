import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");

assert.match(app, /window\.history\.pushState\(/);
assert.match(app, /window\.history\.replaceState\(/);
assert.match(app, /window\.addEventListener\("popstate"/);
assert.match(app, /isAppHistoryState\(state\)/);
assert.match(app, /state\.screen==="course-detail"&&state\.courseId/);
assert.match(app, /window\.history\.back\(\)/);
assert.match(app, /courseDetail=function\(id\)\{activeCourseHistoryId=id/);
assert.match(app, /\.bottom-nav \[data-go\].*showScreen\(nav\.dataset\.go\)/);

console.log("STUDENT_HISTORY_NAVIGATION_OK");
