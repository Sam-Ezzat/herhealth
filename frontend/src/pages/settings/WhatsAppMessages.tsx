import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import whatsappMessageService, { WhatsAppMessage, MessageStats } from '../../services/whatsapp-message.service';
import patientService, { Patient } from '../../services/patient.service';
import whatsappTemplateService, { WhatsAppTemplate } from '../../services/whatsapp-template.service';
import appointmentService, { Appointment } from '../../services/appointment.service';

const WhatsAppMessages: React.FC = () => {
  const navigate = useNavigate();
  
  // States
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Form states
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [useTemplate, setUseTemplate] = useState(false);

  // Filter states
  const [filterPatient, setFilterPatient] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Load data on mount
  useEffect(() => {
    loadMessages();
    loadPatients();
    loadTemplates();
    loadStats();
  }, []);

  // Load messages with filters
  useEffect(() => {
    loadMessages();
  }, [filterPatient, filterStatus, filterType, filterSearch, filterDateFrom, filterDateTo]);

  // Load appointments when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      loadPatientAppointments(selectedPatient);
    } else {
      setAppointments([]);
      setSelectedAppointment('');
    }
  }, [selectedPatient]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const filters = {
        patient_id: filterPatient || undefined, // Keep as UUID string
        status: filterStatus || undefined,
        message_type: filterType || undefined,
        search: filterSearch || undefined,
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined
      };
      console.log('Loading messages with filters:', filters);
      const data = await whatsappMessageService.getMessages(filters);
      console.log('Loaded messages:', data);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      toast.error(error.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      console.log('Loading patients...');
      const response = await patientService.getAll({});
      console.log('Loaded patients:', response);
      if (response && 'patients' in response) {
        setPatients(response.patients || []);
      } else {
        setPatients([]);
      }
    } catch (error: any) {
      console.error('Failed to load patients:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to load patients');
      setPatients([]);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await whatsappTemplateService.getTemplates();
      console.log('Loaded templates:', data);
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
      setTemplates([]);
    }
  };

  const loadStats = async () => {
    try {
      const data = await whatsappMessageService.getMessageStats();
      setStats(data);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadPatientAppointments = async (patientId: string) => {
    try {
      const data = await appointmentService.getAll({ patient_id: patientId });
      // Sort by date, most recent first
      const sorted = data.sort((a, b) => 
        new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
      );
      setAppointments(sorted || []);
    } catch (error: any) {
      console.error('Failed to load appointments:', error);
      setAppointments([]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    if (!messageText || messageText.trim() === '') {
      toast.error('Please enter a message');
      return;
    }

    try {
      setSending(true);
      
      // Debug: Check values before conversion
      console.log('selectedPatient:', selectedPatient, 'Type:', typeof selectedPatient);
      console.log('messageText:', messageText, 'Length:', messageText.length);
      console.log('selectedTemplate:', selectedTemplate, 'Type:', typeof selectedTemplate);
      
      // Patient ID is a UUID string, not a number!
      const patientId = selectedPatient;
      const messageStr = messageText.trim();
      const templateId = selectedTemplate || undefined;
      
      console.log('Patient ID (UUID):', patientId);
      console.log('Converted message:', messageStr, 'isEmpty:', messageStr === '');
      console.log('Template ID (UUID):', templateId);
      
      if (!patientId || patientId === '') {
        toast.error('Invalid patient selection');
        setSending(false);
        return;
      }
      
      const payload = {
        patient_id: patientId, // Send as string UUID
        message: messageStr,
        template_id: templateId,
        appointment_id: selectedAppointment || undefined // Include appointment ID if selected
      };
      
      console.log('Sending message with payload:', JSON.stringify(payload));
      const result = await whatsappMessageService.sendMessage(payload);
      console.log('Message sent result:', result);

      toast.success('Message sent successfully');
      
      // Reset form
      setSelectedPatient('');
      setSelectedAppointment('');
      setSelectedTemplate('');
      setMessageText('');
      setUseTemplate(false);

      // Reload messages and stats
      loadMessages();
      loadStats();
    } catch (error: any) {
      console.error('Send message error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to send message';
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    console.log('Template selected:', templateId, 'Type:', typeof templateId, 'Templates:', templates);
    setSelectedTemplate(templateId);
    
    if (!templateId || templateId === '') {
      setMessageText('');
      return;
    }
    
    // Find template by UUID
    console.log('Looking for template with ID:', templateId);
    const template = templates.find(t => {
      console.log('Comparing template.id:', t.id, 'with', templateId, 'Equal:', t.id === templateId);
      return t.id === templateId;
    });
    
    console.log('Found template:', template);
    if (template) {
      console.log('Setting message text to:', template.template_content);
      setMessageText(template.template_content);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'read':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">WhatsApp Messages</h1>
        <p className="text-gray-600 mt-1">Send and track WhatsApp messages to patients</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total_messages}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Sent</p>
            <p className="text-2xl font-bold text-blue-600">{stats.sent_count}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{stats.delivered_count}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Read</p>
            <p className="text-2xl font-bold text-purple-600">{stats.read_count}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Failed</p>
            <p className="text-2xl font-bold text-red-600">{stats.failed_count}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending_count}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Message Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Send New Message</h2>
            
            <form onSubmit={handleSendMessage}>
              {/* Patient Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient *
                </label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} - {patient.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Appointment Selection (Optional) */}
              {selectedPatient && appointments.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Related Appointment (Optional)
                    <span className="text-xs text-gray-500 ml-2">
                      Helps populate appointment details in message
                    </span>
                  </label>
                  <select
                    value={selectedAppointment}
                    onChange={(e) => setSelectedAppointment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No specific appointment</option>
                    {appointments.map((apt) => (
                      <option key={apt.id} value={apt.id}>
                        {new Date(apt.start_at).toLocaleDateString()} - {apt.type} ({apt.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Template Toggle */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={useTemplate}
                    onChange={(e) => {
                      setUseTemplate(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedTemplate('');
                        setMessageText('');
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Use template</span>
                </label>
              </div>

              {/* Template Selection */}
              {useTemplate && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.template_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Message Text */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your message here..."
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  {messageText.length} characters
                </p>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        {/* Message History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Message History</h2>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient
                  </label>
                  <select
                    value={filterPatient}
                    onChange={(e) => setFilterPatient(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Patients</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="sent">Sent</option>
                    <option value="delivered">Delivered</option>
                    <option value="read">Read</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="Search messages..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No messages found</div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {message.first_name} {message.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{message.phone_number}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(message.status)}`}>
                          {message.status}
                        </span>
                        {message.template_name && (
                          <p className="text-xs text-gray-500 mt-1">
                            Template: {message.template_name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2 bg-gray-50 p-2 rounded">
                      {message.message_content}
                    </p>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <div className="space-x-4">
                        {message.sent_at && (
                          <span>Sent: {formatDate(message.sent_at)}</span>
                        )}
                        {message.delivered_at && (
                          <span>Delivered: {formatDate(message.delivered_at)}</span>
                        )}
                        {message.read_at && (
                          <span>Read: {formatDate(message.read_at)}</span>
                        )}
                      </div>
                      <span>{formatDate(message.created_at!)}</span>
                    </div>
                    
                    {message.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs text-red-700">
                          <strong>Error:</strong> {message.error_message}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppMessages;
