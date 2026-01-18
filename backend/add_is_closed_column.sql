-- Add is_closed column to doctor_working_hours table
ALTER TABLE doctor_working_hours 
ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE;

-- Update existing records to set is_closed = FALSE
UPDATE doctor_working_hours 
SET is_closed = FALSE 
WHERE is_closed IS NULL;
