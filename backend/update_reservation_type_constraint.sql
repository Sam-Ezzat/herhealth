-- First, update any existing 'phone' values to 'samar_phone'
UPDATE appointments
SET reservation_type = 'samar_phone'
WHERE reservation_type = 'phone';

-- Update any NULL or invalid values to 'Clinic'
UPDATE appointments
SET reservation_type = 'Clinic'
WHERE reservation_type IS NULL 
   OR reservation_type NOT IN ('Clinic', 'samar_phone', 'Habiba_phone', 'Doctor', 'website');

-- Drop the existing constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS check_reservation_type;

-- Add the updated constraint with new phone types
ALTER TABLE appointments
ADD CONSTRAINT check_reservation_type
CHECK (reservation_type IN ('Clinic', 'samar_phone', 'Habiba_phone', 'Doctor', 'website'));
