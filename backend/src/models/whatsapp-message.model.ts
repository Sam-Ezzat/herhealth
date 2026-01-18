import pool from '../config/database';

export interface WhatsAppMessage {
  id?: string; // UUID
  patient_id: string; // UUID
  phone_number: string;
  message_content: string;
  template_id?: string; // UUID
  message_type: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  whatsapp_message_id?: string;
  sent_at?: Date;
  delivered_at?: Date;
  read_at?: Date;
  error_message?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface MessageFilters {
  patient_id?: string; // UUID
  status?: string;
  message_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

class WhatsAppMessageModel {
  // Create a new message record
  async create(messageData: Omit<WhatsAppMessage, 'id' | 'created_at' | 'updated_at'>): Promise<WhatsAppMessage> {
    const query = `
      INSERT INTO whatsapp_messages (
        patient_id, phone_number, message_content, template_id, message_type, 
        status, whatsapp_message_id, sent_at, error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      messageData.patient_id,
      messageData.phone_number,
      messageData.message_content,
      messageData.template_id || null,
      messageData.message_type,
      messageData.status,
      messageData.whatsapp_message_id || null,
      messageData.sent_at || null,
      messageData.error_message || null
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update message status
  async updateStatus(
    id: string, 
    status: WhatsAppMessage['status'], 
    updates: Partial<Pick<WhatsAppMessage, 'whatsapp_message_id' | 'sent_at' | 'delivered_at' | 'read_at' | 'error_message'>>
  ): Promise<WhatsAppMessage> {
    const fields: string[] = ['status = $2'];
    const values: any[] = [id, status];
    let paramIndex = 3;

    if (updates.whatsapp_message_id !== undefined) {
      fields.push(`whatsapp_message_id = $${paramIndex++}`);
      values.push(updates.whatsapp_message_id);
    }
    if (updates.sent_at !== undefined) {
      fields.push(`sent_at = $${paramIndex++}`);
      values.push(updates.sent_at);
    }
    if (updates.delivered_at !== undefined) {
      fields.push(`delivered_at = $${paramIndex++}`);
      values.push(updates.delivered_at);
    }
    if (updates.read_at !== undefined) {
      fields.push(`read_at = $${paramIndex++}`);
      values.push(updates.read_at);
    }
    if (updates.error_message !== undefined) {
      fields.push(`error_message = $${paramIndex++}`);
      values.push(updates.error_message);
    }

    const query = `
      UPDATE whatsapp_messages
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get all messages with filters
  async findAll(filters: MessageFilters = {}): Promise<WhatsAppMessage[]> {
    let query = `
      SELECT 
        wm.*,
        p.first_name,
        p.last_name,
        p.phone
      FROM whatsapp_messages wm
      LEFT JOIN patients p ON wm.patient_id = p.id
      WHERE 1=1
    `;
    
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.patient_id) {
      query += ` AND wm.patient_id = $${paramIndex++}`;
      values.push(filters.patient_id);
    }

    if (filters.status) {
      query += ` AND wm.status = $${paramIndex++}`;
      values.push(filters.status);
    }

    if (filters.message_type) {
      query += ` AND wm.message_type = $${paramIndex++}`;
      values.push(filters.message_type);
    }

    if (filters.date_from) {
      query += ` AND wm.created_at >= $${paramIndex++}`;
      values.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ` AND wm.created_at <= $${paramIndex++}`;
      values.push(filters.date_to);
    }

    if (filters.search) {
      query += ` AND (
        p.first_name ILIKE $${paramIndex} OR 
        p.last_name ILIKE $${paramIndex} OR 
        wm.message_content ILIKE $${paramIndex} OR
        wm.phone_number ILIKE $${paramIndex}
      )`;
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY wm.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Get message by ID
  async findById(id: string): Promise<WhatsAppMessage | null> {
    const query = `
      SELECT 
        wm.*,
        p.first_name,
        p.last_name,
        p.phone
      FROM whatsapp_messages wm
      LEFT JOIN patients p ON wm.patient_id = p.id
      WHERE wm.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Get messages by patient
  async findByPatient(patientId: string, limit: number = 50): Promise<WhatsAppMessage[]> {
    const query = `
      SELECT wm.*
      FROM whatsapp_messages wm
      WHERE wm.patient_id = $1
      ORDER BY wm.created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [patientId, limit]);
    return result.rows;
  }

  // Get message statistics
  async getStats(patientId?: string): Promise<any> {
    let query = `
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
        COUNT(CASE WHEN status = 'read' THEN 1 END) as read_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
      FROM whatsapp_messages
    `;

    const values: any[] = [];
    if (patientId) {
      query += ' WHERE patient_id = $1';
      values.push(patientId);
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete message
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM whatsapp_messages WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export default new WhatsAppMessageModel();
