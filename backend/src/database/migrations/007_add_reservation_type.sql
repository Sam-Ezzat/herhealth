-- Add reservation_type column to appointments table
ALTER TABLE appointments
ADD COLUMN reservation_type VARCHAR(50) DEFAULT 'Clinic';

-- Add a check constraint to ensure only valid reservation types
ALTER TABLE appointments
ADD CONSTRAINT check_reservation_type
CHECK (reservation_type IN ('Clinic', 'samar_phone', 'Habiba_phone', 'Doctor', 'website'));

-- Update existing records to have default value
UPDATE appointments
SET reservation_type = 'Clinic'
WHERE reservation_type IS NULL;
