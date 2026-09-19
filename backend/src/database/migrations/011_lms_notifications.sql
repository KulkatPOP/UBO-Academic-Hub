-- Notificaciones propias del LMS complementario. No son avisos académicos oficiales UBO.
CREATE TABLE IF NOT EXISTS lms_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_reference UUID NOT NULL REFERENCES users_reference(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('MESSAGE')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1000),
  severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'SUCCESS', 'ERROR')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('MESSAGE')),
  resource_reference TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  UNIQUE (user_reference, type, resource_type, resource_reference)
);

CREATE INDEX IF NOT EXISTS lms_notifications_user_read_created_idx
  ON lms_notifications(user_reference, is_read, created_at DESC);
