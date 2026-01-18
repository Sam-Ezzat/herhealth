-- Fix calculate_pregnancy_week function
CREATE OR REPLACE FUNCTION calculate_pregnancy_week(
  lmp_date DATE,
  check_date DATE DEFAULT CURRENT_DATE
) RETURNS INTEGER AS $$
BEGIN
  -- Simple date subtraction divided by 7 to get weeks
  RETURN FLOOR((check_date - lmp_date) / 7);
END;
$$ LANGUAGE plpgsql;

-- Recreate active_pregnancies_view
CREATE OR REPLACE VIEW active_pregnancies_view AS
SELECT 
  p.*,
  calculate_pregnancy_week(p.lmp) as current_week,
  CONCAT(pt.first_name, ' ', pt.last_name) as patient_name,
  pt.phone as patient_phone
FROM pregnancies p
JOIN patients pt ON p.patient_id = pt.id
WHERE p.status = 'active';
