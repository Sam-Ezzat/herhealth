-- Fix for production Neon database
-- Issue: calculate_pregnancy_week function fails with EXTRACT(EPOCH FROM integer) error
-- Solution: Use simple date arithmetic instead

-- Fix calculate_pregnancy_week function
CREATE OR REPLACE FUNCTION calculate_pregnancy_week(
  lmp_date DATE,
  check_date DATE DEFAULT CURRENT_DATE
) RETURNS INTEGER AS $$
BEGIN
  -- Simple date subtraction divided by 7 to get weeks
  -- In PostgreSQL, subtracting two dates returns an integer (number of days)
  RETURN FLOOR((check_date - lmp_date) / 7);
END;
$$ LANGUAGE plpgsql;

-- Verify the fix by testing the function
SELECT 
  'Test calculate_pregnancy_week' as test_name,
  calculate_pregnancy_week('2025-10-01'::DATE, '2026-01-21'::DATE) as weeks_result,
  'Should be approximately 16 weeks' as expected;

-- Check if the view exists and recreate it if needed
DROP VIEW IF EXISTS active_pregnancies_view;

CREATE VIEW active_pregnancies_view AS
SELECT 
  p.*,
  calculate_pregnancy_week(p.lmp) as current_week,
  CONCAT(pt.first_name, ' ', pt.last_name) as patient_name,
  pt.phone as patient_phone
FROM pregnancies p
JOIN patients pt ON p.patient_id = pt.id
WHERE p.status = 'active';

-- Grant permissions on the view
GRANT SELECT ON active_pregnancies_view TO PUBLIC;

SELECT 'Fix applied successfully!' as status;
