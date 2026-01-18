-- Create whatsapp_messages table for tracking message history
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  template_id INTEGER REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  message_type VARCHAR(50) NOT NULL DEFAULT 'custom',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  whatsapp_message_id VARCHAR(255),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_patient_id ON whatsapp_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);

-- Add comment
COMMENT ON TABLE whatsapp_messages IS 'Tracks all WhatsApp messages sent to patients with delivery status';
