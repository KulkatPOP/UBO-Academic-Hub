CREATE TABLE IF NOT EXISTS lms_attendance_sessions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), course_id UUID NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
 teacher_reference UUID NOT NULL REFERENCES users_reference(id), token_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','EXPIRED','CLOSED')),
 starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS lms_attendance_records (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), session_id UUID NOT NULL REFERENCES lms_attendance_sessions(id) ON DELETE CASCADE,
 course_id UUID NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE, student_reference UUID NOT NULL REFERENCES users_reference(id),
 status TEXT NOT NULL DEFAULT 'PRESENT' CHECK(status='PRESENT'), recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(session_id,student_reference)
);
CREATE INDEX IF NOT EXISTS lms_attendance_student_course_idx ON lms_attendance_records(student_reference,course_id,recorded_at DESC);
