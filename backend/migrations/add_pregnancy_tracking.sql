-- Add pregnancy tracking fields to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS is_pregnant BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lmp DATE, -- Last Menstrual Period
ADD COLUMN IF NOT EXISTS edd DATE, -- Expected Delivery Date
ADD COLUMN IF NOT EXISTS pregnancy_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS current_pregnancy_week INTEGER,
ADD COLUMN IF NOT EXISTS gravida INTEGER, -- Number of pregnancies
ADD COLUMN IF NOT EXISTS para INTEGER, -- Number of births
ADD COLUMN IF NOT EXISTS abortion INTEGER, -- Number of abortions/miscarriages
ADD COLUMN IF NOT EXISTS living INTEGER; -- Number of living children

-- Add index for quick filtering of pregnant patients
CREATE INDEX IF NOT EXISTS idx_patients_is_pregnant ON patients(is_pregnant);

-- Add comment
COMMENT ON COLUMN patients.is_pregnant IS 'Whether patient is currently pregnant';
COMMENT ON COLUMN patients.lmp IS 'Last Menstrual Period date';
COMMENT ON COLUMN patients.edd IS 'Expected Delivery Date';
COMMENT ON COLUMN patients.pregnancy_status IS 'Status: active, delivered, terminated, etc.';
COMMENT ON COLUMN patients.current_pregnancy_week IS 'Current week of pregnancy';
COMMENT ON COLUMN patients.gravida IS 'Total number of pregnancies (G)';
COMMENT ON COLUMN patients.para IS 'Number of deliveries after 20 weeks (P)';
COMMENT ON COLUMN patients.abortion IS 'Number of pregnancy losses before 20 weeks (A)';
COMMENT ON COLUMN patients.living IS 'Number of living children (L)';
