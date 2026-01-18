-- Migration: Create comprehensive pregnancy journey system
-- This allows multiple pregnancies per patient with visit tracking

-- Step 1: Add pregnancy_id to visits table to link visits to specific pregnancies
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS pregnancy_id uuid REFERENCES pregnancies(id) ON DELETE CASCADE;

-- Step 2: Add pregnancy-specific notes to visits
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS pregnancy_notes text,
ADD COLUMN IF NOT EXISTS pregnancy_week integer;

-- Step 3: Update pregnancies table with additional tracking fields
ALTER TABLE pregnancies
ADD COLUMN IF NOT EXISTS abortion integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS living integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS pregnancy_number integer,
ADD COLUMN IF NOT EXISTS delivery_date date,
ADD COLUMN IF NOT EXISTS delivery_type varchar(50),
ADD COLUMN IF NOT EXISTS baby_weight_kg numeric(5,2),
ADD COLUMN IF NOT EXISTS complications text,
ADD COLUMN IF NOT EXISTS outcome varchar(50);

-- Step 4: Add index for quick pregnancy lookups
CREATE INDEX IF NOT EXISTS idx_pregnancies_patient_id ON pregnancies(patient_id);
CREATE INDEX IF NOT EXISTS idx_pregnancies_status ON pregnancies(status);
CREATE INDEX IF NOT EXISTS idx_visits_pregnancy_id ON visits(pregnancy_id);

-- Step 5: Update ob_records with pregnancy week tracking
ALTER TABLE ob_records
ADD COLUMN IF NOT EXISTS pregnancy_week integer,
ADD COLUMN IF NOT EXISTS visit_id uuid REFERENCES visits(id) ON DELETE SET NULL;

-- Step 6: Add comments for documentation
COMMENT ON COLUMN visits.pregnancy_id IS 'Links visit to a specific pregnancy journey';
COMMENT ON COLUMN visits.pregnancy_notes IS 'Doctor notes specific to pregnancy during this visit';
COMMENT ON COLUMN visits.pregnancy_week IS 'Pregnancy week at time of visit';
COMMENT ON COLUMN pregnancies.pregnancy_number IS 'Sequential pregnancy number for this patient (1st, 2nd, etc)';
COMMENT ON COLUMN pregnancies.abortion IS 'Number of abortions/miscarriages (A in GPAL)';
COMMENT ON COLUMN pregnancies.living IS 'Number of living children from this pregnancy';
COMMENT ON COLUMN pregnancies.delivery_date IS 'Actual delivery date';
COMMENT ON COLUMN pregnancies.delivery_type IS 'Normal/C-section/Assisted/etc';
COMMENT ON COLUMN pregnancies.outcome IS 'live_birth/stillbirth/miscarriage/abortion/ongoing';

-- Step 7: Create function to automatically calculate pregnancy week
CREATE OR REPLACE FUNCTION calculate_pregnancy_week(lmp_date DATE, check_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN FLOOR(EXTRACT(EPOCH FROM (check_date - lmp_date)) / (7 * 24 * 60 * 60));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 8: Create function to calculate EDD from LMP (280 days / 40 weeks)
CREATE OR REPLACE FUNCTION calculate_edd(lmp_date DATE)
RETURNS DATE AS $$
BEGIN
  RETURN lmp_date + INTERVAL '280 days';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 9: Create view for active pregnancies with current week calculation
CREATE OR REPLACE VIEW active_pregnancies_view AS
SELECT 
  p.*,
  calculate_pregnancy_week(p.lmp) as current_week,
  CONCAT(pt.first_name, ' ', pt.last_name) as patient_name,
  pt.phone as patient_phone,
  pt.date_of_birth as patient_dob
FROM pregnancies p
JOIN patients pt ON p.patient_id = pt.id
WHERE p.status = 'active';

-- Step 10: Update existing pregnancies to set pregnancy_number
WITH numbered_pregnancies AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY created_at) as pnum
  FROM pregnancies
)
UPDATE pregnancies p
SET pregnancy_number = np.pnum
FROM numbered_pregnancies np
WHERE p.id = np.id AND p.pregnancy_number IS NULL;

COMMENT ON VIEW active_pregnancies_view IS 'View of active pregnancies with auto-calculated current week';
