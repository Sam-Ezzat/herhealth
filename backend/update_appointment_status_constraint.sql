-- Add 'no-answer' to the status enum values for appointments table
-- PostgreSQL doesn't have a simple ALTER for check constraints, so we need to drop and recreate

-- First, check if there's an existing constraint on status
-- If it exists, drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'appointments' 
        AND constraint_name LIKE '%status%'
    ) THEN
        ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
        ALTER TABLE appointments DROP CONSTRAINT IF EXISTS check_appointment_status;
    END IF;
END $$;

-- Add the new constraint with 'no-answer' included
ALTER TABLE appointments
ADD CONSTRAINT appointments_status_check
CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no-show', 'no-answer'));
