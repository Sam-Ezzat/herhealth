-- Add color_code and notes to doctor_calendars table
-- This allows each calendar to have a unique color that will be inherited by appointments

ALTER TABLE doctor_calendars
ADD COLUMN color_code varchar(7) DEFAULT '#3B82F6',
ADD COLUMN color_name varchar(100),
ADD COLUMN notes text;

-- Add calendar_id to appointments table
ALTER TABLE appointments
ADD COLUMN calendar_id uuid REFERENCES doctor_calendars(id);

-- Create index for faster lookups
CREATE INDEX idx_appointments_calendar ON appointments(calendar_id);

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

-- Add comment for documentation
COMMENT ON COLUMN doctor_calendars.color_code IS 'Hex color code for calendar (e.g., #FF5733)';
COMMENT ON COLUMN doctor_calendars.color_name IS 'Display name for the color (e.g., Red, Blue)';
COMMENT ON COLUMN doctor_calendars.notes IS 'Additional notes or description for this calendar';
COMMENT ON COLUMN appointments.calendar_id IS 'Reference to the calendar this appointment belongs to - determines appointment color';
