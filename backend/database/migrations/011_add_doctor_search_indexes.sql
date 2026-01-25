-- Optional performance indexes for doctor search (ILIKE %term%)
-- Requires pg_trgm extension for fast substring search

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_doctors_first_name_trgm
  ON doctors USING gin (lower(first_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_doctors_last_name_trgm
  ON doctors USING gin (lower(last_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_doctors_specialty_trgm
  ON doctors USING gin (lower(specialty) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_doctors_email_trgm
  ON doctors USING gin (lower(email) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_doctors_phone_trgm
  ON doctors USING gin (lower(phone) gin_trgm_ops);
