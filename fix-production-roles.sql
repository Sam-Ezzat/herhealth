-- Fix Production Database Roles with Correct Permissions
-- Run this SQL in your Neon Console SQL Editor

-- Update Super Admin role with all permissions
UPDATE roles 
SET permissions = '[
  "users.*",
  "roles.*",
  "patients.*",
  "doctors.*",
  "appointments.*",
  "visits.*",
  "pregnancy.*",
  "calendars.*",
  "whatsapp.*",
  "colorcodes.*",
  "stats.*",
  "settings.*"
]'::jsonb
WHERE name = 'admin' OR name = 'Super Admin';

-- Update Doctor role with appropriate permissions
UPDATE roles 
SET permissions = '[
  "patients.view",
  "patients.create",
  "patients.update",
  "doctors.view",
  "appointments.view",
  "appointments.viewOwn",
  "appointments.create",
  "appointments.update",
  "appointments.updateOwn",
  "visits.view",
  "visits.viewOwn",
  "visits.create",
  "visits.update",
  "pregnancy.view",
  "pregnancy.update",
  "calendars.view",
  "calendars.viewOwn",
  "calendars.updateOwn",
  "calendars.viewAvailableSlots",
  "colorcodes.view",
  "stats.viewOwn",
  "stats.viewBasic"
]'::jsonb
WHERE name = 'doctor';

-- Update Nurse role with appropriate permissions
UPDATE roles 
SET permissions = '[
  "patients.view",
  "patients.create",
  "patients.update",
  "appointments.view",
  "appointments.create",
  "appointments.update",
  "visits.view",
  "visits.create",
  "visits.update",
  "pregnancy.view",
  "calendars.view",
  "calendars.viewAvailableSlots",
  "colorcodes.view",
  "stats.viewBasic"
]'::jsonb
WHERE name = 'nurse';

-- Update Receptionist role with appropriate permissions
UPDATE roles 
SET permissions = '[
  "patients.view",
  "patients.create",
  "patients.update",
  "appointments.view",
  "appointments.create",
  "appointments.update",
  "calendars.view",
  "calendars.viewAvailableSlots",
  "colorcodes.view"
]'::jsonb
WHERE name = 'receptionist';

-- Verify the changes
SELECT id, name, permissions 
FROM roles 
ORDER BY name;
