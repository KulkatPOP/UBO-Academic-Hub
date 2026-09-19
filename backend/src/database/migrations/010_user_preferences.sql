-- Preferencias propias del LMS complementario Academic Hub.
-- No representan identidad institucional ni información académica oficial UBO.

CREATE TABLE IF NOT EXISTS user_preferences (
  user_reference UUID NOT NULL REFERENCES users_reference(id) ON DELETE CASCADE,
  theme TEXT NULL CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT NULL,
  notifications_enabled BOOLEAN NULL,
  email_notifications BOOLEAN NULL,
  tutor_preferences JSONB NULL,
  accessibility_preferences JSONB NULL,
  learning_preferences JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_reference)
);

COMMENT ON TABLE user_preferences IS
  'Preferencias opt-in del LMS Academic Hub. No contiene credenciales, identidad institucional ni datos académicos oficiales.';
