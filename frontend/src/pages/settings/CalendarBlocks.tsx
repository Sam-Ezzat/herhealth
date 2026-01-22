import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { FiPlus, FiTrash2, FiEdit2, FiAlertCircle } from 'react-icons/fi';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialty?: string;
}

interface Calendar {
  id: string;
  doctor_id: string;
  name: string;
  doctor_name?: string;
  color_code?: string;
  color_name?: string;
}

interface CalendarBlock {
  id: string;
  calendar_id: string;
  exception_type: string;
  start_datetime: string;
  end_datetime: string;
  reason?: string;
  cancel_appointments: boolean;
  notify_patients: boolean;
  created_at: string;
  calendar_name?: string;
  doctor_name?: string;
}

const CalendarBlocks = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<CalendarBlock | null>(null);
  const [affectedAppointments, setAffectedAppointments] = useState<any[]>([]);
  const [showAffectedModal, setShowAffectedModal] = useState(false);
  
  const [formData, setFormData] = useState({
    doctor_id: '',
    calendar_id: '',
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '17:00',
    reason: '',
    exception_type: 'block' as 'block' | 'vacation' | 'holiday' | 'emergency',
    cancel_appointments: false,
    notify_patients: false,
  });

  const [filter, setFilter] = useState({
    doctor_id: '',
    calendar_id: '',
  });

  useEffect(() => {
    fetchDoctors();
    fetchCalendars();
    fetchBlocks();
  }, []);

  useEffect(() => {
    if (filter.doctor_id || filter.calendar_id) {
      fetchBlocks();
    }
  }, [filter.doctor_id, filter.calendar_id]);

  const fetchDoctors = async () => {
    try {
      const response = await api.get<any>('/doctors');
      const data = response.data?.data || response.data || [];
      setDoctors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    }
  };

  const fetchCalendars = async () => {
    try {
      const response = await api.get<any>('/calendars');
      const data = response.data?.data || response.data || [];
      setCalendars(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching calendars:', error);
      toast.error('Failed to load calendars');
    }
  };

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      
      // If we have a specific calendar selected, fetch exceptions for that calendar
      if (filter.calendar_id) {
        const response = await api.get<any>(`/calendars/${filter.calendar_id}/exceptions`);
        const data = response.data?.data || response.data || [];
        
        // Enrich with calendar and doctor names
        const enrichedBlocks = data.map((block: CalendarBlock) => {
          const calendar = calendars.find(c => c.id === block.calendar_id);
          return {
            ...block,
            calendar_name: calendar?.name,
            doctor_name: calendar?.doctor_name
          };
        });
        
        setBlocks(Array.isArray(enrichedBlocks) ? enrichedBlocks : []);
      } else {
        // Fetch all blocks from all calendars
        const allBlocks: CalendarBlock[] = [];
        
        for (const calendar of calendars) {
          // Filter by doctor if selected
          if (filter.doctor_id && calendar.doctor_id !== filter.doctor_id) {
            continue;
          }
          
          try {
            const response = await api.get<any>(`/calendars/${calendar.id}/exceptions`);
            const data = response.data?.data || response.data || [];
            
            const enrichedBlocks = data.map((block: CalendarBlock) => ({
              ...block,
              calendar_name: calendar.name,
              doctor_name: calendar.doctor_name
            }));
            
            allBlocks.push(...enrichedBlocks);
          } catch (error) {
            console.error(`Error fetching blocks for calendar ${calendar.id}:`, error);
          }
        }
        
        // Sort by start date (most recent first)
        allBlocks.sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime());
        setBlocks(allBlocks);
      }
    } catch (error) {
      console.error('Error fetching blocks:', error);
      toast.error('Failed to load calendar blocks');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorChange = async (doctorId: string) => {
    setFormData({ ...formData, doctor_id: doctorId, calendar_id: '' });
    
    // Load calendars for this doctor
    if (doctorId) {
      try {
        const response = await api.get<any>(`/calendars/doctor/${doctorId}/all`);
        const doctorCalendars = response.data?.data || response.data || [];
        
        // Auto-select if only one calendar
        if (doctorCalendars.length === 1) {
          setFormData(prev => ({ ...prev, doctor_id: doctorId, calendar_id: doctorCalendars[0].id }));
        }
      } catch (error) {
        console.error('Error loading doctor calendars:', error);
      }
    }
  };

  const checkAffectedAppointments = async () => {
    if (!formData.calendar_id || !formData.start_date || !formData.end_date) {
      toast.warning('Please select calendar and date range first');
      return;
    }

    try {
      const startDatetime = `${formData.start_date}T${formData.start_time}:00`;
      const endDatetime = `${formData.end_date}T${formData.end_time}:00`;
      
      const response = await api.get<any>(
        `/calendars/${formData.calendar_id}/affected-appointments`,
        {
          params: {
            startDatetime,
            endDatetime,
          },
        }
      );
      
      const appointments = response.data?.data || [];
      setAffectedAppointments(appointments);
      setShowAffectedModal(true);
      
      if (appointments.length === 0) {
        toast.info('No appointments will be affected by this block');
      }
    } catch (error) {
      console.error('Error checking affected appointments:', error);
      toast.error('Failed to check affected appointments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.calendar_id) {
      toast.error('Please select a calendar');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error('Please select start and end dates');
      return;
    }

    const startDatetime = `${formData.start_date}T${formData.start_time}:00`;
    const endDatetime = `${formData.end_date}T${formData.end_time}:00`;

    if (new Date(startDatetime) >= new Date(endDatetime)) {
      toast.error('End date/time must be after start date/time');
      return;
    }

    try {
      const payload = {
        exception_type: formData.exception_type,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        reason: formData.reason,
        cancel_appointments: formData.cancel_appointments,
        notify_patients: formData.notify_patients,
      };

      if (editingBlock) {
        await api.put(`/calendars/exceptions/${editingBlock.id}`, payload);
        toast.success('Calendar block updated successfully');
      } else {
        await api.post(`/calendars/${formData.calendar_id}/exceptions`, payload);
        toast.success('Calendar block created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchBlocks();
    } catch (error: any) {
      console.error('Error saving block:', error);
      toast.error(error.response?.data?.error || 'Failed to save calendar block');
    }
  };

  const handleDelete = async (blockId: string) => {
    if (!confirm('Are you sure you want to delete this calendar block?')) {
      return;
    }

    try {
      await api.delete(`/calendars/exceptions/${blockId}`);
      toast.success('Calendar block deleted successfully');
      fetchBlocks();
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Failed to delete calendar block');
    }
  };

  const handleEdit = (block: CalendarBlock) => {
    const startDate = new Date(block.start_datetime);
    const endDate = new Date(block.end_datetime);
    
    setEditingBlock(block);
    setFormData({
      doctor_id: calendars.find(c => c.id === block.calendar_id)?.doctor_id || '',
      calendar_id: block.calendar_id,
      start_date: startDate.toISOString().split('T')[0],
      start_time: startDate.toTimeString().slice(0, 5),
      end_date: endDate.toISOString().split('T')[0],
      end_time: endDate.toTimeString().slice(0, 5),
      reason: block.reason || '',
      exception_type: block.exception_type as any,
      cancel_appointments: block.cancel_appointments,
      notify_patients: block.notify_patients,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      doctor_id: '',
      calendar_id: '',
      start_date: '',
      start_time: '09:00',
      end_date: '',
      end_time: '17:00',
      reason: '',
      exception_type: 'block',
      cancel_appointments: false,
      notify_patients: false,
    });
    setEditingBlock(null);
  };

  const getBlockTypeColor = (type: string) => {
    switch (type) {
      case 'vacation': return 'bg-blue-100 text-blue-800';
      case 'holiday': return 'bg-green-100 text-green-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'block': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredCalendars = formData.doctor_id
    ? calendars.filter(c => c.doctor_id === formData.doctor_id)
    : calendars;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Calendar Blocks</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus /> Create Block
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Doctor
            </label>
            <select
              value={filter.doctor_id}
              onChange={(e) => setFilter({ ...filter, doctor_id: e.target.value, calendar_id: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.first_name} {doctor.last_name}
                  {doctor.specialty && ` - ${doctor.specialty}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Calendar
            </label>
            <select
              value={filter.calendar_id}
              onChange={(e) => setFilter({ ...filter, calendar_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Calendars</option>
              {calendars
                .filter(c => !filter.doctor_id || c.doctor_id === filter.doctor_id)
                .map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.doctor_name} - {calendar.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Blocks List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : blocks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No calendar blocks found. Create one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor / Calendar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blocks.map((block) => (
                  <tr key={block.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {block.doctor_name || 'Unknown Doctor'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {block.calendar_name || 'Unknown Calendar'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBlockTypeColor(block.exception_type)}`}>
                        {block.exception_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(block.start_datetime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(block.end_datetime)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {block.reason || '-'}
                      </div>
                      {block.cancel_appointments && (
                        <div className="text-xs text-red-600 mt-1">
                          Cancels appointments
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(block)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <FiEdit2 className="inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(block.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingBlock ? 'Edit Calendar Block' : 'Create Calendar Block'}
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Doctor and Calendar Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Doctor <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.doctor_id}
                      onChange={(e) => handleDoctorChange(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.first_name} {doctor.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calendar <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.calendar_id}
                      onChange={(e) => setFormData({ ...formData, calendar_id: e.target.value })}
                      required
                      disabled={!formData.doctor_id}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select Calendar</option>
                      {filteredCalendars.map((calendar) => (
                        <option key={calendar.id} value={calendar.id}>
                          {calendar.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Block Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Block Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.exception_type}
                    onChange={(e) => setFormData({ ...formData, exception_type: e.target.value as any })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="block">Block</option>
                    <option value="vacation">Vacation</option>
                    <option value="holiday">Holiday</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                {/* Date and Time Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    placeholder="Optional reason for blocking this time period"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Options */}
                <div className="space-y-3 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.cancel_appointments}
                      onChange={(e) => setFormData({ ...formData, cancel_appointments: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Cancel existing appointments in this time range
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.notify_patients}
                      onChange={(e) => setFormData({ ...formData, notify_patients: e.target.checked })}
                      disabled={!formData.cancel_appointments}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-700">
                      Notify patients about cancellations
                    </span>
                  </label>
                </div>

                {/* Check Affected Appointments Button */}
                {!editingBlock && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={checkAffectedAppointments}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <FiAlertCircle />
                      Check affected appointments
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingBlock ? 'Update Block' : 'Create Block'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Affected Appointments Modal */}
      {showAffectedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Affected Appointments</h2>
              
              {affectedAppointments.length === 0 ? (
                <p className="text-gray-600 mb-4">
                  No appointments will be affected by this block.
                </p>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">
                    {affectedAppointments.length} appointment(s) will be affected:
                  </p>
                  
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Patient
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Date/Time
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Type
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {affectedAppointments.map((apt) => (
                          <tr key={apt.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {apt.patient_name || 'Unknown'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {formatDateTime(apt.start_at)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {apt.type || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                {apt.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setShowAffectedModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarBlocks;
