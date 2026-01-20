-- Run this SQL in your database to add calendar color features
-- You can use pgAdmin, DBeaver, or any PostgreSQL client

-- Add color_code and notes to doctor_calendars table
ALTER TABLE doctor_calendars
ADD COLUMN IF NOT EXISTS color_code varchar(7) DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS color_name varchar(100),
ADD COLUMN IF NOT EXISTS notes text;

-- Add calendar_id to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS calendar_id uuid REFERENCES doctor_calendars(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_appointments_calendar ON appointments(calendar_id);

-- Update existing appointments to link to their doctor's default calendar (if exists)
-- This is for backwards compatibility
UPDATE appointments a
SET calendar_id = (
  SELECT dc.id 
  FROM doctor_calendars dc 
  WHERE dc.doctor_id = a.doctor_id 
  AND dc.is_active = true 
  LIMIT 1
)
WHERE a.calendar_id IS NULL;

-- Verify the changes
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'doctor_calendars' 
AND column_name IN ('color_code', 'color_name', 'notes');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name = 'calendar_id';
