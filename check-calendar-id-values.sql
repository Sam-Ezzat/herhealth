-- Check if appointments have calendar_id values

-- 1. Check column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments' 
AND column_name = 'calendar_id';

-- 2. Count total appointments
SELECT COUNT(*) as total_appointments FROM appointments;

-- 3. Count appointments WITH calendar_id
SELECT COUNT(*) as with_calendar_id 
FROM appointments 
WHERE calendar_id IS NOT NULL;

-- 4. Count appointments WITHOUT calendar_id
SELECT COUNT(*) as without_calendar_id 
FROM appointments 
WHERE calendar_id IS NULL;

-- 5. Show sample appointments with their calendar_id status
SELECT 
  id,
  doctor_id,
  calendar_id,
  patient_id,
  start_at,
  status,
  CASE 
    WHEN calendar_id IS NULL THEN 'NO CALENDAR'
    ELSE 'HAS CALENDAR'
  END as calendar_status
FROM appointments
ORDER BY created_at DESC
LIMIT 20;

-- 6. Check if there are active appointments with NULL calendar_id
SELECT 
  COUNT(*) as active_appointments_without_calendar
FROM appointments
WHERE calendar_id IS NULL
AND status NOT IN ('cancelled', 'completed', 'no-show')
AND start_at >= CURRENT_DATE;
