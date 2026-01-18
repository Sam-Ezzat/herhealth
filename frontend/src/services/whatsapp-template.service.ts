import api from './api';

export interface WhatsAppTemplate {
  id: string; // UUID
  template_name: string;
  template_type: string;
  template_content: string;
  created_at?: string;
  updated_at?: string;
}

const whatsappTemplateService = {
  // Get all templates
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    const response = await api.get<{ success: boolean; data: WhatsAppTemplate[] }>('/whatsapp/templates');
    // Handle both response formats
    if ((response as any).data && Array.isArray((response as any).data)) {
      return (response as any).data;
    }
    return Array.isArray(response) ? response : [];
  },

  // Update template
  async updateTemplate(id: string, data: { template_content: string }): Promise<WhatsAppTemplate> {
    const response = await api.put<{ success: boolean; data: WhatsAppTemplate }>(`/whatsapp/templates/${id}`, data);
    return (response as any).data || response;
  }
};

export default whatsappTemplateService;
