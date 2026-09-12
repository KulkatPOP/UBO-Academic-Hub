ALTER TABLE users_reference
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS password_demo TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_reference_username_unique_idx
  ON users_reference (username)
  WHERE username IS NOT NULL;

COMMENT ON COLUMN users_reference.password_demo IS
  'Credential only for local demo environments. Production must use password_hash or institutional federation.';
