-- Calendar Management Tables

-- Doctor Calendars: Each doctor has their own calendar configuration
CREATE TABLE doctor_calendars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  timezone varchar(100) DEFAULT 'UTC',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Doctor Working Hours: Define when each doctor is available
CREATE TABLE doctor_working_hours (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id uuid REFERENCES doctor_calendars(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Doctor Time Slots: Custom time slot configurations for each doctor
CREATE TABLE doctor_time_slots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id uuid REFERENCES doctor_calendars(id) ON DELETE CASCADE,
  slot_duration int NOT NULL, -- in minutes (e.g., 15, 30, 45, 60)
  break_duration int DEFAULT 0, -- break between appointments in minutes
  max_appointments_per_slot int DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Calendar Exceptions: Holidays, vacations, emergency closures
CREATE TABLE calendar_exceptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id uuid REFERENCES doctor_calendars(id) ON DELETE CASCADE,
  exception_type varchar(50) NOT NULL, -- 'holiday', 'vacation', 'emergency', 'block'
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  reason text,
  cancel_appointments boolean DEFAULT false, -- Auto-cancel appointments in this range
  notify_patients boolean DEFAULT true, -- Send notifications to affected patients
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime)
);

-- WhatsApp Message Log: Track all WhatsApp communications
CREATE TABLE whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  phone_number varchar(50) NOT NULL,
  message_type varchar(50) NOT NULL, -- 'scheduled', 'confirmed', 'rescheduled', 'cancelled', 'reminder'
  message_content text NOT NULL,
  status varchar(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
  whatsapp_message_id varchar(255), -- ID from WhatsApp API
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- WhatsApp Templates: Pre-defined message templates
CREATE TABLE whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name varchar(100) UNIQUE NOT NULL,
  template_type varchar(50) NOT NULL, -- 'scheduled', 'confirmed', 'rescheduled', 'cancelled', 'reminder'
  template_content text NOT NULL,
  variables jsonb, -- Template variables like {patient_name}, {appointment_date}, etc.
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for better query performance
CREATE INDEX idx_doctor_calendars_doctor ON doctor_calendars(doctor_id);
CREATE INDEX idx_working_hours_calendar ON doctor_working_hours(calendar_id);
CREATE INDEX idx_working_hours_day ON doctor_working_hours(day_of_week);
CREATE INDEX idx_time_slots_calendar ON doctor_time_slots(calendar_id);
CREATE INDEX idx_exceptions_calendar ON calendar_exceptions(calendar_id);
CREATE INDEX idx_exceptions_datetime ON calendar_exceptions(start_datetime, end_datetime);
CREATE INDEX idx_whatsapp_appointment ON whatsapp_messages(appointment_id);
CREATE INDEX idx_whatsapp_patient ON whatsapp_messages(patient_id);
CREATE INDEX idx_whatsapp_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_type ON whatsapp_messages(message_type);

-- Insert default WhatsApp templates
INSERT INTO whatsapp_templates (template_name, template_type, template_content, variables) VALUES
(
  'appointment_scheduled',
  'scheduled',
  'Hello {patient_name}! 👋\n\nYour appointment has been scheduled:\n📅 Date: {appointment_date}\n⏰ Time: {appointment_time}\n👨‍⚕️ Doctor: {doctor_name}\n📍 Type: {appointment_type}\n\nPlease arrive 10 minutes early.\n\nTo confirm, reschedule, or cancel, please contact us.',
  '{"patient_name": "string", "appointment_date": "string", "appointment_time": "string", "doctor_name": "string", "appointment_type": "string"}'::jsonb
),
(
  'appointment_confirmed',
  'confirmed',
  'Hello {patient_name}! ✅\n\nYour appointment has been CONFIRMED:\n📅 Date: {appointment_date}\n⏰ Time: {appointment_time}\n👨‍⚕️ Doctor: {doctor_name}\n\nWe look forward to seeing you!',
  '{"patient_name": "string", "appointment_date": "string", "appointment_time": "string", "doctor_name": "string"}'::jsonb
),
(
  'appointment_rescheduled',
  'rescheduled',
  'Hello {patient_name}! 🔄\n\nYour appointment has been rescheduled:\n\n❌ Old: {old_date} at {old_time}\n✅ New: {new_date} at {new_time}\n👨‍⚕️ Doctor: {doctor_name}\n\nSee you at the new time!',
  '{"patient_name": "string", "old_date": "string", "old_time": "string", "new_date": "string", "new_time": "string", "doctor_name": "string"}'::jsonb
),
(
  'appointment_cancelled',
  'cancelled',
  'Hello {patient_name}! ❌\n\nYour appointment has been cancelled:\n📅 Date: {appointment_date}\n⏰ Time: {appointment_time}\n👨‍⚕️ Doctor: {doctor_name}\n\nReason: {cancellation_reason}\n\nTo reschedule, please contact us.',
  '{"patient_name": "string", "appointment_date": "string", "appointment_time": "string", "doctor_name": "string", "cancellation_reason": "string"}'::jsonb
),
(
  'appointment_reminder',
  'reminder',
  'Hello {patient_name}! ⏰\n\nReminder: You have an appointment tomorrow:\n📅 Date: {appointment_date}\n⏰ Time: {appointment_time}\n👨‍⚕️ Doctor: {doctor_name}\n📍 Type: {appointment_type}\n\nSee you soon!',
  '{"patient_name": "string", "appointment_date": "string", "appointment_time": "string", "doctor_name": "string", "appointment_type": "string"}'::jsonb
),
(
  'emergency_cancellation',
  'cancelled',
  'Hello {patient_name}! ⚠️\n\nDue to an emergency, your appointment has been cancelled:\n📅 Date: {appointment_date}\n⏰ Time: {appointment_time}\n👨‍⚕️ Doctor: {doctor_name}\n\nWe apologize for the inconvenience. We will contact you shortly to reschedule.',
  '{"patient_name": "string", "appointment_date": "string", "appointment_time": "string", "doctor_name": "string"}'::jsonb
);
