import { query } from '../config/database';

export interface WhatsAppMessage {
  id: string;
  appointment_id: string;
  patient_id: string;
  phone_number: string;
  message_type: 'scheduled' | 'confirmed' | 'rescheduled' | 'cancelled' | 'reminder';
  message_content: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  whatsapp_message_id?: string;
  error_message?: string;
  sent_at?: Date;
  delivered_at?: Date;
  read_at?: Date;
  created_at: Date;
}

export interface WhatsAppTemplate {
  id: string;
  template_name: string;
  template_type: string;
  template_content: string;
  variables: Record<string, string>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// WhatsApp Message CRUD
export const createWhatsAppMessage = async (messageData: Omit<WhatsAppMessage, 'id' | 'created_at'>): Promise<WhatsAppMessage> => {
  const {
    appointment_id,
    patient_id,
    phone_number,
    message_type,
    message_content,
    status,
    whatsapp_message_id,
    error_message,
    sent_at,
    delivered_at,
    read_at
  } = messageData;
  
  const sql = `
    INSERT INTO whatsapp_messages (
      appointment_id, patient_id, phone_number, message_type, message_content,
      status, whatsapp_message_id, error_message, sent_at, delivered_at, read_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  
  const result = await query(sql, [
    appointment_id,
    patient_id,
    phone_number,
    message_type,
    message_content,
    status,
    whatsapp_message_id || null,
    error_message || null,
    sent_at || null,
    delivered_at || null,
    read_at || null
  ]);
  
  return result.rows[0];
};

export const updateWhatsAppMessage = async (id: string, messageData: Partial<WhatsAppMessage>): Promise<WhatsAppMessage | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(messageData).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at' && key !== 'appointment_id' && key !== 'patient_id') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) return null;

  const sql = `
    UPDATE whatsapp_messages
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  values.push(id);

  const result = await query(sql, values);
  return result.rows[0] || null;
};

export const findMessagesByAppointmentId = async (appointmentId: string): Promise<WhatsAppMessage[]> => {
  const sql = `SELECT * FROM whatsapp_messages WHERE appointment_id = $1 ORDER BY created_at DESC`;
  const result = await query(sql, [appointmentId]);
  return result.rows;
};

export const findMessagesByPatientId = async (patientId: string): Promise<WhatsAppMessage[]> => {
  const sql = `SELECT * FROM whatsapp_messages WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 50`;
  const result = await query(sql, [patientId]);
  return result.rows;
};

export const findPendingMessages = async (): Promise<WhatsAppMessage[]> => {
  const sql = `SELECT * FROM whatsapp_messages WHERE status = 'pending' ORDER BY created_at LIMIT 100`;
  const result = await query(sql);
  return result.rows;
};

// WhatsApp Template CRUD
export const findAllTemplates = async (): Promise<WhatsAppTemplate[]> => {
  const sql = `SELECT * FROM whatsapp_templates WHERE is_active = true ORDER BY template_type, template_name`;
  const result = await query(sql);
  return result.rows;
};

export const findTemplateByType = async (templateType: string): Promise<WhatsAppTemplate | null> => {
  const sql = `SELECT * FROM whatsapp_templates WHERE template_type = $1 AND is_active = true LIMIT 1`;
  const result = await query(sql, [templateType]);
  return result.rows[0] || null;
};

export const findTemplateByName = async (templateName: string): Promise<WhatsAppTemplate | null> => {
  const sql = `SELECT * FROM whatsapp_templates WHERE template_name = $1 AND is_active = true`;
  const result = await query(sql, [templateName]);
  return result.rows[0] || null;
};

export const createTemplate = async (templateData: Omit<WhatsAppTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<WhatsAppTemplate> => {
  const { template_name, template_type, template_content, variables, is_active } = templateData;
  
  const sql = `
    INSERT INTO whatsapp_templates (template_name, template_type, template_content, variables, is_active)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const result = await query(sql, [template_name, template_type, template_content, JSON.stringify(variables), is_active]);
  return result.rows[0];
};

export const updateTemplate = async (id: string, templateData: Partial<WhatsAppTemplate>): Promise<WhatsAppTemplate | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(templateData).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
      if (key === 'variables') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    }
  });

  if (fields.length === 0) return null;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const sql = `
    UPDATE whatsapp_templates
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  values.push(id);

  const result = await query(sql, values);
  return result.rows[0] || null;
};
