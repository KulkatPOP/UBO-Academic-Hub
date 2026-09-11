import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "modules/admin/admin-dashboard.js",
  "modules/professor/teacher-dashboard.js",
  "modules/professor/teacher-course-detail.js",
  "modules/demo/demo-selector-ui.js"
];

files.forEach(file => {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  assert.equal(/\.innerHTML\s*=/.test(source), false, `${file} must not render data through innerHTML`);
  assert.match(source, /createElement|createSummaryElement|replaceChildren/, `${file} must use safe DOM construction`);
});

const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const remainingAssignments = appSource.match(/\.innerHTML\s*=/g) || [];

// This test is an audit baseline, not a ban on static markup. Dynamic cases are
// tracked in docs/AUDIT/INNERHTML_FINAL_REMAINING_CLASSIFICATION.md for later migration.
assert.equal(remainingAssignments.length, 2, "app.js innerHTML inventory must match the documented hardening baseline");

const allowedStaticAssignments = [
  {
    marker: "function ensureSimulatorQuickAccess()",
    fragment: 'button.innerHTML="<span>🧮</span><b>Simulador de notas</b><small>Proyecta tu promedio</small>"'
  }
];

allowedStaticAssignments.forEach(({ marker, fragment }) => {
  const start = appSource.indexOf(marker);
  const end = appSource.indexOf("\n", start);
  assert.ok(start >= 0, `${marker} must exist`);
  assert.ok(appSource.slice(start, end).includes(fragment), `${marker} must remain static-only markup`);
});

const controlledTemplateAssignments = [
  "function renderBenefits()"
];

controlledTemplateAssignments.forEach(marker => {
  const start = appSource.indexOf(marker);
  const end = appSource.indexOf("\n", start);
  assert.ok(start >= 0, `${marker} must exist`);
  assert.ok(appSource.slice(start, end).includes(".innerHTML"), `${marker} must remain documented as a controlled template`);
});
assert.equal(controlledTemplateAssignments.length, 1, "the final audit must retain one controlled template assignment");

const documentedDynamicRiskMarkers = [];

documentedDynamicRiskMarkers.forEach(marker => {
  const start = appSource.indexOf(marker);
  const end = appSource.indexOf("\n", start);
  assert.ok(start >= 0, `${marker} must remain documented`);
  assert.ok(appSource.slice(start, end).includes(".innerHTML"), `${marker} must remain listed as a pending dynamic renderer`);
});

const documentedRiskAssignments = documentedDynamicRiskMarkers.reduce((count, marker) => {
  const start = appSource.indexOf(marker);
  const end = appSource.indexOf("\n", start);
  return count + (appSource.slice(start, end).match(/\.innerHTML\s*=/g) || []).length;
}, 0);
assert.equal(documentedRiskAssignments, 0, "the documented dynamic-risk inventory must contain no dynamic assignments");

const getFunctionSource = marker => {
  const start = appSource.indexOf(marker);
  const end = appSource.indexOf("\n", start);
  assert.ok(start >= 0, `${marker} must exist`);
  return appSource.slice(start, end);
};

assert.match(getFunctionSource("function renderMarketplace(filter=\"Todos\")"), /dataset\.marketplaceFilter/);
assert.match(getFunctionSource("function renderMarketplace(filter=\"Todos\")"), /dataset\.marketplace=/);
assert.match(getFunctionSource("function marketplaceDetail(id)"), /dataset\.marketplaceSave=/);
assert.match(getFunctionSource("function renderCommunity(filter=\"Todas\")"), /dataset\.communityFilter/);
assert.match(getFunctionSource("function renderCommunity(filter=\"Todas\")"), /dataset\.community=/);
assert.match(getFunctionSource("function communityDetail(id)"), /dataset\.communityLike=/);
assert.match(getFunctionSource("function communityDetail(id)"), /dataset\.communityCommentId=/);
assert.match(getFunctionSource("function renderTrajectory()"), /dataset\.goalToggle=/);
assert.match(getFunctionSource("function renderHomeEvents()"), /dataset\.campusEvent|dataset\.calendarEvent/);
assert.match(getFunctionSource("function renderCampusEvents(filter=\"Todos\")"), /dataset\.campusFilter/);
assert.match(getFunctionSource("function renderCampusEvents(filter=\"Todos\")"), /dataset\.campusEvent=/);
assert.match(getFunctionSource("function campusEventDetail(id)"), /dataset\.campusRegister=/);
assert.match(getFunctionSource("function renderLibrary(filter=libraryFilter,search=librarySearch)"), /dataset\.libraryFilter/);
assert.match(getFunctionSource("function renderLibrary(filter=libraryFilter,search=librarySearch)"), /dataset\.libraryBook=/);
assert.match(getFunctionSource("function libraryBookDetail(id)"), /dataset\.libraryReminder=/);
assert.match(getFunctionSource("function renderCampusMap(filter=campusLocationFilter,search=campusLocationSearch)"), /dataset\.campusLocationFilter/);
assert.match(getFunctionSource("function campusLocationDetail(id)"), /dataset\.campusLocationReminder=/);
assert.match(getFunctionSource("function calendarEventDetail(key)"), /dataset\.calendarCourse=/);
assert.match(getFunctionSource("function renderEvaluations()"), /dataset\.evaluation=/);
assert.match(getFunctionSource("function evaluationDetail(id)"), /dataset\.evaluationCourse=/);
assert.match(getFunctionSource("function evaluationDetail(id)"), /dataset\.evaluationReminder=/);
assert.match(getFunctionSource("function renderWeeklySchedule()"), /dataset\.class=/);
assert.match(getFunctionSource("function renderWeeklySchedule()"), /dataset\.classDay=/);
assert.match(getFunctionSource("function classDetail(subjectId,day)"), /dataset\.classVirtual=/);
assert.match(getFunctionSource("function classVirtual(subjectId)"), /dataset\.toast=/);
assert.match(getFunctionSource("function renderVirtual()"), /dataset\.virtual=/);
assert.match(getFunctionSource("function virtualDetail(id)"), /dataset\.toast=/);
assert.match(getFunctionSource("function notificationDetail(id)"), /dataset\.notificationRead=/);
assert.match(getFunctionSource("function renderHomeDeliveries()"), /dataset\[item\.actionType\]/);
assert.match(getFunctionSource("function renderHelpCenter(search=helpSearch)"), /dataset\.help=/);
assert.match(getFunctionSource("function helpDetail(id)"), /dataset\.helpGo=/);
assert.match(getFunctionSource("function renderInternationalization()"), /dataset\.international=/);
assert.match(getFunctionSource("function internationalDetail(id)"), /dataset\.internationalReminder=/);
assert.match(getFunctionSource("function renderOpportunities(filter=\"Todas\")"), /dataset\.opportunityFilter=/);
assert.match(getFunctionSource("function renderOpportunities(filter=\"Todas\")"), /dataset\.opportunity=/);
assert.match(getFunctionSource("function opportunityDetail(id)"), /dataset\.opportunitySave=/);

[
  "function renderOnboarding()",
  "function renderHomeNotifications()",
  "function renderNotifications(filter",
  "function renderHomeAttention()",
  "function renderToday()",
  "function renderHomeMail()",
  "function renderMail()",
  "function renderMailDetail()",
  "function renderCalendarEvents(items)",
  "function renderCalendar(selectedDay",
  "function renderDae()",
  "function renderAssignments(filter",
  "function assignmentDetail(id)",
  "function renderDocuments()",
  "function documentDetail(id)",
  "function renderCourses()",
  "function courseDetail(id)",
  "function renderAttendance()",
  "function calculateAttendance()",
  "function renderAlerts()",
  "function renderCertificates()",
  "function renderAiAssistant(messages=[])",
  "function renderAiWidget(messages=[])",
  "function documentPreview(id)",
  "function renderGradeSimulator(courseId=gradeSimulatorCourseId)",
  "function renderPersonal()",
  "function renderStudentCard()",
  "function renderMarketplace(filter=\"Todos\")",
  "function marketplaceDetail(id)",
  "function renderCommunity(filter=\"Todas\")",
  "function communityDetail(id)",
  "function renderTrajectory()",
  "function renderHomeEvents()",
  "function renderCampusEvents(filter=\"Todos\")",
  "function campusEventDetail(id)",
  "function renderLibrary(filter=libraryFilter,search=librarySearch)",
  "function libraryBookDetail(id)",
  "function renderCampusMap(filter=campusLocationFilter,search=campusLocationSearch)",
  "function campusLocationDetail(id)",
  "function calendarEventDetail(key)"
  ,"function renderEvaluations()"
  ,"function evaluationDetail(id)"
  ,"function renderWeeklySchedule()"
  ,"function classDetail(subjectId,day)"
  ,"function classVirtual(subjectId)"
  ,"function renderVirtual()"
  ,"function virtualDetail(id)"
  ,"function renderSummary()"
  ,"function notificationDetail(id)"
  ,"function renderHomeDeliveries()"
  ,"function renderHelpCenter(search=helpSearch)"
  ,"function helpDetail(id)"
  ,"function renderInternationalization()"
  ,"function internationalDetail(id)"
  ,"function renderOpportunities(filter=\"Todas\")"
  ,"function opportunityDetail(id)"
].forEach(marker => {
  const start = appSource.indexOf(marker);
  const end = appSource.indexOf("\n", start);
  assert.ok(start >= 0, `${marker} must exist`);
  assert.equal(appSource.slice(start, end).includes(".innerHTML"), false, `${marker} must not use innerHTML`);
});

console.log("INNERHTML_HARDENING_TARGETS_OK");
