-- Insert WhatsApp message templates (without emojis for compatibility)

INSERT INTO whatsapp_templates (template_name, template_type, template_content, variables) VALUES
('appointment_scheduled', 'scheduled', 
 'Hello {patient_name}! Your appointment has been scheduled.

Date: {appointment_date}
Time: {appointment_time}
Doctor: {doctor_name}

Location: {clinic_name}
For questions, call: {clinic_phone}',
 '{"patient_name": "string", "appointment_date": "string", "appointment_time": "string", "doctor_name": "string", "clinic_name": "string", "clinic_phone": "string"}'::jsonb
),

('appointment_confirmed', 'confirmed',
 'Hello {patient_name}! Your appointment is confirmed.

Date: {appointment_date}
Time: {appointment_time}
Doctor: {doctor_name}

Please arrive 10 minutes early. Thank you!',
 '{"patient_name": "string", "appointment_date": "string", "appointment_time": "string", "doctor_name": "string"}'::jsonb
),

('appointment_rescheduled', 'rescheduled',
 'Hello {patient_name}! Your appointment has been rescheduled.

Previous: {old_date} at {old_time}
New: {new_date} at {new_time}
Doctor: {doctor_name}

See you at the new time!',
 '{"patient_name": "string", "old_date": "string", "old_time": "string", "new_date": "string", "new_time": "string", "doctor_name": "string"}'::jsonb
),

('appointment_cancelled', 'cancelled',
 'Hello {patient_name}. Your appointment has been cancelled.

Date: {appointment_date}
Time: {appointment_time}
Doctor: {doctor_name}
Reason: {cancellation_reason}

To reschedule, please contact us at {clinic_phone}.',
 '{"patient_name": "string", "appointment_date": "string", "appointment_time": "string", "doctor_name": "string", "cancellation_reason": "string", "clinic_phone": "string"}'::jsonb
),

('appointment_reminder', 'reminder',
 'Reminder: You have an appointment tomorrow.

Date: {appointment_date}
Time: {appointment_time}
Doctor: {doctor_name}
Location: {clinic_name}

Please confirm or call {clinic_phone} if you need to reschedule.',
 '{"patient_name": "string", "appointment_date": "string", "appointment_time": "string", "doctor_name": "string", "clinic_name": "string", "clinic_phone": "string"}'::jsonb
),

('emergency_cancellation', 'cancelled',
 'Hello {patient_name}! Due to an emergency, your appointment has been cancelled.

Date: {appointment_date}
Time: {appointment_time}
Doctor: {doctor_name}

We apologize for the inconvenience. We will contact you shortly to reschedule.',
 '{"patient_name": "string", "appointment_date": "string", "appointment_time": "string", "doctor_name": "string"}'::jsonb
)
ON CONFLICT (template_name) DO NOTHING;
