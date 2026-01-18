import { useState, useEffect } from 'react';
import { FiMessageSquare, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import api from '../../services/api';
import { toast } from 'react-toastify';

interface WhatsAppTemplate {
  id: string;
  template_name: string;
  template_type: string;
  template_content: string;
  variables: string[];
}

const WhatsAppTemplates = () => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get<{ success: boolean; data: WhatsAppTemplate[] }>('/whatsapp/templates');
      setTemplates((response as any).data || response || []);
    } catch (error) {
      toast.error('Failed to load templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: WhatsAppTemplate) => {
    setEditingId(template.id);
    setEditContent(template.template_content);
  };

  const handleSave = async (templateId: string) => {
    try {
      await api.put(`/whatsapp/templates/${templateId}`, {
        template_content: editContent
      });
      toast.success('Template updated successfully');
      setEditingId(null);
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to update template');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent('');
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      rescheduled: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      reminder: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">WhatsApp Templates</h1>
        <p className="text-gray-600 mt-2">Manage notification message templates for appointments</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">Available Variables</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            '{patient_name}',
            '{appointment_date}',
            '{appointment_time}',
            '{doctor_name}',
            '{clinic_name}',
            '{clinic_phone}',
            '{old_date}',
            '{old_time}',
            '{new_date}',
            '{new_time}',
            '{cancellation_reason}'
          ].map((variable) => (
            <code key={variable} className="px-3 py-2 bg-gray-100 text-blue-600 rounded text-sm font-mono">
              {variable}
            </code>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiMessageSquare size={24} />
                  <div>
                    <h2 className="text-xl font-semibold">{template.template_name}</h2>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm mt-1 ${getTypeColor(template.template_type)}`}>
                      {template.template_type}
                    </span>
                  </div>
                </div>
                {editingId !== template.id && (
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50"
                  >
                    <FiEdit2 size={16} />
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {editingId === template.id ? (
                <div className="space-y-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                    placeholder="Enter template content..."
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSave(template.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <FiSave size={16} />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      <FiX size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {template.template_content}
                  </p>
                </div>
              )}

              {template.variables && template.variables.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-600 mb-2">Variables used in this template:</p>
                  <div className="flex flex-wrap gap-2">
                    {template.variables.map((variable, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WhatsAppTemplates;
