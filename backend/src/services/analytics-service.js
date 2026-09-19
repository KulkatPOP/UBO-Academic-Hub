import {databasePool} from "../config/database.js";
import {canUserAccessCourse,getCourseById,getCoursesForStudent,getCoursesForTeacher} from "./course-service.js";
import {getPublicUserById} from "./user-service.js";
const source="LMS", u=(id,q)=>getPublicUserById(id,{query:q});
export function calculateLmsRisk({pendingEvaluations,averageScore,attendanceRate}={}){const enough=[pendingEvaluations,averageScore,attendanceRate].some(v=>v!==null&&v!==undefined);if(!enough)return{risk:"INSUFFICIENT_DATA",dataSource:source,reasons:[],metrics:{}};const reasons=[];if(pendingEvaluations>=2)reasons.push(`${pendingEvaluations} evaluaciones LMS pendientes`);if(averageScore!==null&&averageScore<4)reasons.push("Promedio LMS bajo 4,0");if(attendanceRate!==null&&attendanceRate<75)reasons.push("Asistencia LMS bajo 75%");return{risk:reasons.length?"HIGH":pendingEvaluations>0||averageScore!==null&&averageScore<5?"MEDIUM":"LOW",dataSource:source,reasons,metrics:{pendingEvaluations,averageScore,attendanceRate},trend:"INSUFFICIENT_DATA"}}
async function student(id,courseId,query){const actor=await u(id,query);if(!actor||actor.role!=="STUDENT")return{authorized:false,code:actor?"STUDENT_ROLE_REQUIRED":"USER_NOT_FOUND"};const courses=courseId?[await getCourseById(courseId,{query})].filter(Boolean):await getCoursesForStudent(actor.id,{query});if(courseId&&(!courses[0]||!await canUserAccessCourse(actor,courses[0],{query})))return{authorized:false,code:"COURSE_ACCESS_DENIED"};const scope=courseId?" AND e.course_id=$2":"",params=courseId?[actor.id,courses[0].id]:[actor.id];const e=await query(`SELECT e.id,e.course_id FROM lms_evaluations e JOIN lms_course_members m ON m.course_id=e.course_id WHERE m.student_reference=$1 AND e.status='PUBLISHED'${scope}`,params);const submissionScope=courseId?" AND e.course_id=$2":"",submissionParams=courseId?[actor.id,courses[0].id]:[actor.id];const s=await query(`SELECT s.score,s.auto_grade FROM lms_submissions s INNER JOIN lms_evaluations e ON e.id=s.evaluation_id WHERE s.student_reference=(SELECT external_id FROM users_reference WHERE id=$1)${submissionScope}`,submissionParams);const attendanceScope=courseId?" AND session.course_id=$2":"",attendanceParams=courseId?[actor.id,courses[0].id]:[actor.id];const a=await query(`SELECT COUNT(*)::int AS count FROM lms_attendance_records record INNER JOIN lms_attendance_sessions session ON session.id=record.session_id WHERE record.student_reference=$1${attendanceScope}`,attendanceParams);const scores=s.rows.map(x=>Number(x.score)).filter(Number.isFinite),pending=Math.max(0,e.rows.length-s.rows.length),average=scores.length?Number((scores.reduce((x,y)=>x+y,0)/scores.length).toFixed(1)):null,attendance=Number(a.rows[0]?.count||0);return{authorized:true,source,student:actor,courses:courses.map(c=>({id:c.id,name:c.name})),evaluations:{publishedEvaluations:e.rows.length||null,submittedEvaluations:s.rows.length||null,pendingEvaluations:e.rows.length?pending:null,averageScore:average,averagePercentage:null},attendance:{status:attendance?"available":"insufficient_data",availableSessions:null,attendedSessions:attendance||null,attendanceRate:null},risk:calculateLmsRisk({pendingEvaluations:e.rows.length?pending:null,averageScore:average,attendanceRate:null}),recommendations:[]}}
export const getStudentAnalytics=(id,{query=databasePool.query.bind(databasePool)}={})=>student(id,null,query);export const getStudentCourseAnalytics=(id,courseId,{query=databasePool.query.bind(databasePool)}={})=>student(id,courseId,query);
export async function getTeacherAnalytics(id,courseId=null,{query=databasePool.query.bind(databasePool)}={}){const actor=await u(id,query);if(!actor||actor.role!=="TEACHER")return{authorized:false,code:actor?"TEACHER_ROLE_REQUIRED":"USER_NOT_FOUND"};const courses=courseId?[await getCourseById(courseId,{query})].filter(c=>c?.teacherReference===actor.id):await getCoursesForTeacher(actor.id,{query});return courses.length||!courseId?{authorized:true,source,courses:courses.map(c=>({id:c.id,name:c.name,weakTopics:[],trend:"INSUFFICIENT_DATA"}))}:{authorized:false,code:"COURSE_ACCESS_DENIED"}}
export async function getAdminOverview(id,{query=databasePool.query.bind(databasePool)}={}){
  const actor=await u(id,query);
  if(!actor||actor.role!=="ADMIN")return{authorized:false,code:actor?"ADMIN_ROLE_REQUIRED":"USER_NOT_FOUND"};
  const r=await query(`SELECT
    (SELECT COUNT(*)::int FROM users_reference) AS users_total,
    (SELECT COUNT(*)::int FROM users_reference WHERE role='STUDENT') AS students_total,
    (SELECT COUNT(*)::int FROM users_reference WHERE role='TEACHER') AS teachers_total,
    (SELECT COUNT(*)::int FROM lms_courses) AS courses_total,
    (SELECT COUNT(*)::int FROM lms_course_members) AS enrollments_total,
    (SELECT COUNT(*)::int FROM learning_materials) AS materials_total,
    (SELECT COUNT(*)::int FROM lms_evaluations) AS evaluations_total,
    (SELECT COUNT(*)::int FROM lms_evaluations WHERE status='PUBLISHED') AS evaluations_published,
    (SELECT COUNT(*)::int FROM lms_submissions) AS submissions_total,
    (SELECT COUNT(*)::int FROM lms_submissions WHERE status='GRADED') AS submissions_reviewed,
    (SELECT COUNT(*)::int FROM lms_attendance_sessions) AS attendance_sessions_total,
    (SELECT COUNT(*)::int FROM lms_attendance_records) AS attendance_records_total,
    (SELECT COUNT(*)::int FROM lms_messages) AS messages_total,
    (SELECT COUNT(*)::int FROM lms_notifications WHERE is_read=FALSE) AS notifications_unread_total,
    (SELECT COUNT(*)::int FROM analytics_events) AS activity_events_total,
    (SELECT COUNT(*)::int FROM tutor_conversations) AS tutor_queries_total,
    (SELECT COUNT(*)::int FROM recommendations) AS recommendations_total`);
  const metrics=r.rows[0]||{};
  const eventTypes=await query("SELECT event_type, COUNT(*)::int AS count FROM analytics_events GROUP BY event_type ORDER BY event_type ASC");
  const total=value=>Number.isInteger(Number(value))?Number(value):null;
  const evaluationsTotal=total(metrics.evaluations_total), submissionsTotal=total(metrics.submissions_total), reviewed=total(metrics.submissions_reviewed);
  return{authorized:true,source,overview:{
    users:{total:total(metrics.users_total),students:total(metrics.students_total),teachers:total(metrics.teachers_total)},
    courses:{total:total(metrics.courses_total),enrollments:total(metrics.enrollments_total)},
    materials:{total:total(metrics.materials_total)},
    evaluations:{total:evaluationsTotal,published:total(metrics.evaluations_published)},
    submissions:{total:submissionsTotal,reviewed,pending:submissionsTotal===null||reviewed===null?null:Math.max(0,submissionsTotal-reviewed)},
    attendance:{sessions:total(metrics.attendance_sessions_total),records:total(metrics.attendance_records_total)},
    messages:{total:total(metrics.messages_total)},
    notifications:{unread:total(metrics.notifications_unread_total)},
    activity:{total:total(metrics.activity_events_total),eventTypes:eventTypes.rows.map(item=>({type:item.event_type,count:total(item.count)}))},
    tutor:{queries:total(metrics.tutor_queries_total)},
    recommendations:{total:total(metrics.recommendations_total)}
  }};
}
