-- Add template_id column to whatsapp_messages table
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES whatsapp_templates(id) ON DELETE SET NULL;

-- Create index for template_id
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_template_id ON whatsapp_messages(template_id);

-- Add comment
COMMENT ON COLUMN whatsapp_messages.template_id IS 'Reference to the template used for this message';
