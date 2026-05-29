-- Add UNIQUE constraint to user_profiles.email
-- SQLite requires recreating the table to add a constraint
-- First clean up any existing duplicates (keep the oldest)
DELETE FROM user_profiles WHERE id NOT IN (
  SELECT MIN(id) FROM user_profiles GROUP BY email
);
-- Add unique index (SQLite way to enforce uniqueness without full table recreate)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email_unique ON user_profiles(email);
