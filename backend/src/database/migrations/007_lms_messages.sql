-- Mensajería privada del LMS complementario. No es comunicación institucional oficial.
CREATE TABLE IF NOT EXISTS lms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
  sender_reference UUID NOT NULL REFERENCES users_reference(id) ON DELETE RESTRICT,
  recipient_reference UUID NOT NULL REFERENCES users_reference(id) ON DELETE RESTRICT,
  message_type TEXT NOT NULL DEFAULT 'COURSE' CHECK (message_type IN ('COURSE','DIRECT')),
  subject TEXT NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 120),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS lms_messages_recipient_created_idx ON lms_messages(recipient_reference, created_at DESC);
CREATE INDEX IF NOT EXISTS lms_messages_sender_course_idx ON lms_messages(sender_reference, course_id, created_at DESC);
