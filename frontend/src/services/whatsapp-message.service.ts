import api from './api';

export interface WhatsAppMessage {
  id?: string; // UUID
  patient_id: string; // UUID
  phone_number: string;
  message_content: string;
  template_id?: string; // UUID
  message_type: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  whatsapp_message_id?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  template_name?: string;
}

export interface MessageFilters {
  patient_id?: string; // UUID
  status?: string;
  message_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface MessageStats {
  total_messages: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  pending_count: number;
}

const whatsappMessageService = {
  // Get all messages with filters
  async getMessages(filters?: MessageFilters): Promise<WhatsAppMessage[]> {
    const response = await api.get<{ success: boolean; data: WhatsAppMessage[] }>('/whatsapp/messages', { params: filters });
    const data = (response as any).data || response;
    return Array.isArray(data) ? data : (data.data || []);
  },

  // Send message to patient
  async sendMessage(data: { patient_id: string; message: string; template_id?: string }): Promise<any> {
    const response = await api.post<{ success: boolean; data: any; message: string }>('/whatsapp/messages/send', data);
    return (response as any).data || response;
  },

  // Get messages by patient
  async getPatientMessages(patientId: number): Promise<WhatsAppMessage[]> {
    const response = await api.get<{ success: boolean; data: WhatsAppMessage[] }>(`/whatsapp/messages/patient/${patientId}`);
    const data = (response as any).data || response;
    return Array.isArray(data) ? data : (data.data || []);
  },

  // Get message statistics
  async getMessageStats(patientId?: number): Promise<MessageStats> {
    const response = await api.get<{ success: boolean; data: MessageStats }>('/whatsapp/messages/stats', {
      params: patientId ? { patient_id: patientId } : {}
    });
    return (response as any).data || response;
  },

  // Update message status
  async updateMessageStatus(
    id: number,
    status: string,
    updates: { delivered_at?: string; read_at?: string; error_message?: string }
  ): Promise<WhatsAppMessage> {
    const response = await api.put<WhatsAppMessage>(`/whatsapp/messages/${id}/status`, {
      status,
      ...updates
    });
    return (response as any).data || response;
  }
};

export default whatsappMessageService;
