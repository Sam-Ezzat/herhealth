-- Update existing appointments to have calendar_id values
-- This script assigns the doctor's first active calendar to appointments that have NULL calendar_id

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update appointments with NULL calendar_id
  -- Assign them to the doctor's first active calendar
  WITH doctor_default_calendars AS (
    SELECT DISTINCT ON (doctor_id) 
      doctor_id,
      id as calendar_id
    FROM doctor_calendars
    WHERE is_active = true
    ORDER BY doctor_id, created_at ASC
  )
  UPDATE appointments a
  SET calendar_id = ddc.calendar_id
  FROM doctor_default_calendars ddc
  WHERE a.doctor_id = ddc.doctor_id
    AND a.calendar_id IS NULL;
  
  -- Get the count of updated rows
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Updated % appointments with calendar_id', updated_count;
END $$;

-- Verify the update
SELECT 
  COUNT(*) as appointments_without_calendar
FROM appointments
WHERE calendar_id IS NULL;

-- Show updated appointments
SELECT 
  doctor_id,
  COUNT(*) as total_appointments,
  COUNT(calendar_id) as with_calendar_id,
  COUNT(*) - COUNT(calendar_id) as without_calendar_id
FROM appointments
GROUP BY doctor_id
ORDER BY doctor_id;
