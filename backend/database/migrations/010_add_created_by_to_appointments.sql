-- Add created_by column to appointments table to track who reserved the appointment
ALTER TABLE appointments 
ADD COLUMN created_by uuid REFERENCES users(id);

-- Add index for better query performance
CREATE INDEX idx_appointments_created_by ON appointments(created_by);

-- Update existing appointments to set created_by to admin (optional)
-- You can comment this out if you don't want to set a default
-- UPDATE appointments SET created_by = (SELECT id FROM users WHERE email = 'admin@herhealth.com' LIMIT 1) WHERE created_by IS NULL;
