import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiAlertCircle, FiClock, FiZap } from 'react-icons/fi';
import api from '../../services/api';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
}

interface Calendar {
  id: string;
  doctor_id: string;
  doctor_name?: string;
  name: string;
}

interface AffectedAppointment {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  type: string;
  patient_name?: string;
  patient_phone?: string;
  doctor_name?: string;
  calendar_name?: string;
}

const Automations = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [previewAppointments, setPreviewAppointments] = useState<AffectedAppointment[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    doctor_id: '',
    calendar_id: '',
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '17:00',
    action: 'reschedule' as 'reschedule' | 'cancel',
    reschedule_method: 'offset' as 'offset' | 'set_time',
    offset_minutes: 60,
    target_time: '10:00',
    notify_patients: true,
    cancel_reason: '',
    emergency: true
  });

  useEffect(() => {
    fetchDoctors();
    fetchCalendars();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await api.get<any>('/doctors');
      const data = response?.data || response || [];
      setDoctors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    }
  };

  const fetchCalendars = async () => {
    try {
      const response = await api.get<any>('/calendars');
      const data = response?.data || response || [];
      setCalendars(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching calendars:', error);
      toast.error('Failed to load calendars');
    }
  };

  const filteredCalendars = formData.doctor_id
    ? calendars.filter((calendar) => calendar.doctor_id === formData.doctor_id)
    : calendars;

  const handleDoctorChange = (doctorId: string) => {
    setFormData((prev) => ({ ...prev, doctor_id: doctorId, calendar_id: '' }));

    if (!doctorId) {
      return;
    }

    const doctorCalendars = calendars.filter((calendar) => calendar.doctor_id === doctorId);
    if (doctorCalendars.length === 1) {
      setFormData((prev) => ({ ...prev, calendar_id: doctorCalendars[0].id }));
    }
  };

  const composeDateTime = (date: string, time: string) => `${date}T${time}:00`;

  const validateForm = () => {
    if (!formData.calendar_id) {
      toast.warning('Please select a calendar');
      return false;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.warning('Please select a date range');
      return false;
    }

    if (formData.action === 'reschedule') {
      if (formData.reschedule_method === 'offset' && !Number.isFinite(formData.offset_minutes)) {
        toast.warning('Please enter a valid offset in minutes');
        return false;
      }

      if (formData.reschedule_method === 'set_time' && !formData.target_time) {
        toast.warning('Please select a target time');
        return false;
      }
    }

    return true;
  };

  const setTodayRange = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    setFormData((prev) => ({
      ...prev,
      start_date: dateStr,
      end_date: dateStr,
      start_time: '00:00',
      end_time: '23:59'
    }));
  };

  const handlePreview = async () => {
    if (!validateForm()) return;

    try {
      setPreviewLoading(true);
      const startDatetime = composeDateTime(formData.start_date, formData.start_time);
      const endDatetime = composeDateTime(formData.end_date, formData.end_time);

      const response = await api.get<any>(
        `/calendars/${formData.calendar_id}/affected-appointments`,
        { startDatetime, endDatetime }
      );

      const appointments = response?.data || response || [];
      setPreviewAppointments(Array.isArray(appointments) ? appointments : []);
      setSelectedAppointmentIds(new Set());
      setShowPreviewModal(true);

      if (!appointments || appointments.length === 0) {
        toast.info('No appointments will be affected');
      }
    } catch (error) {
      console.error('Error previewing appointments:', error);
      toast.error('Failed to preview appointments');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!validateForm()) return;

    if (formData.action === 'reschedule' && formData.reschedule_method === 'set_time' && selectedAppointmentIds.size === 0) {
      toast.warning('Select at least one appointment for set time');
      return;
    }

    const confirmText = formData.action === 'cancel'
      ? 'This will cancel all affected appointments. Continue?'
      : 'This will reschedule all affected appointments. Continue?';

    if (!confirm(confirmText)) {
      return;
    }

    try {
      setSubmitting(true);
      setResult(null);

      const startDatetime = composeDateTime(formData.start_date, formData.start_time);
      const endDatetime = composeDateTime(formData.end_date, formData.end_time);

      if (formData.action === 'reschedule') {
        const payload: any = {
          startDatetime,
          endDatetime,
          method: formData.reschedule_method,
          notifyPatients: formData.notify_patients
        };

        if (formData.reschedule_method === 'offset') {
          payload.offsetMinutes = Number(formData.offset_minutes);
        } else {
          payload.targetTime = formData.target_time;
          payload.appointmentIds = Array.from(selectedAppointmentIds);
        }

        const response = await api.post<any>(
          `/calendars/${formData.calendar_id}/bulk-reschedule`,
          payload
        );

        setResult(response?.data || response);
        toast.success('Bulk reschedule completed');
      } else {
        if (formData.emergency) {
          const response = await api.post<any>(
            `/calendars/${formData.calendar_id}/emergency-cancel`,
            {
              startDatetime,
              endDatetime,
              reason: formData.cancel_reason
            }
          );
          setResult(response?.data || response);
        } else {
          const response = await api.post<any>(
            `/calendars/${formData.calendar_id}/block-time-range`,
            {
              startDatetime,
              endDatetime,
              reason: formData.cancel_reason,
              cancelExisting: true,
              notifyPatients: formData.notify_patients
            }
          );
          setResult(response?.data || response);
        }

        toast.success('Bulk cancellation completed');
      }
    } catch (error: any) {
      console.error('Automation failed:', error);
      toast.error(error?.response?.data?.error || 'Automation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(previewAppointments.map((appointment) => appointment.id));
      setSelectedAppointmentIds(allIds);
    } else {
      setSelectedAppointmentIds(new Set());
    }
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedAppointmentIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FiZap /> Automations
        </h1>
        <p className="text-gray-600 mt-1">
          Bulk reschedule or cancel appointments in one action.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Scope & Filters</h2>
          <button
            type="button"
            onClick={setTodayRange}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Set to Today
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <select
              value={formData.doctor_id}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Doctors</option>
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
              onChange={(e) => setFormData((prev) => ({ ...prev, calendar_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Calendar</option>
              {filteredCalendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.doctor_name ? `${calendar.doctor_name} - ` : ''}{calendar.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewLoading}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            <FiAlertCircle />
            {previewLoading ? 'Checking...' : 'Preview affected appointments'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Automation Action</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.action === 'reschedule'}
                  onChange={() => setFormData((prev) => ({ ...prev, action: 'reschedule' }))}
                />
                <span className="text-sm text-gray-700">Reschedule</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.action === 'cancel'}
                  onChange={() => setFormData((prev) => ({ ...prev, action: 'cancel' }))}
                />
                <span className="text-sm text-gray-700">Cancel</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notify Patients</label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.notify_patients}
                onChange={(e) => setFormData((prev) => ({ ...prev, notify_patients: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Send WhatsApp notifications</span>
            </label>
          </div>
        </div>

        {formData.action === 'reschedule' ? (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.reschedule_method === 'offset'}
                  onChange={() => setFormData((prev) => ({ ...prev, reschedule_method: 'offset' }))}
                />
                <span className="text-sm text-gray-700">Offset minutes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.reschedule_method === 'set_time'}
                  onChange={() => setFormData((prev) => ({ ...prev, reschedule_method: 'set_time' }))}
                />
                <span className="text-sm text-gray-700">Set to time</span>
              </label>
            </div>

            {formData.reschedule_method === 'offset' ? (
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">Offset (minutes)</label>
                <input
                  type="number"
                  value={formData.offset_minutes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, offset_minutes: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Use positive to move later, negative to move earlier.</p>
              </div>
            ) : (
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Time</label>
                <input
                  type="time"
                  value={formData.target_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, target_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select appointments in the preview to move to this time.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {selectedAppointmentIds.size}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Reason</label>
            <textarea
              rows={3}
              value={formData.cancel_reason}
              onChange={(e) => setFormData((prev) => ({ ...prev, cancel_reason: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional reason for cancellation"
            />
            <div className="mt-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.emergency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, emergency: e.target.checked }))}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Emergency cancellation (creates emergency block)</span>
              </label>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleExecute}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <FiClock /> {submitting ? 'Processing...' : 'Run Automation'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Result Summary</h3>
          <pre className="text-sm text-gray-700 bg-gray-50 p-3 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Affected Appointments</h3>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[70vh]">
              {previewAppointments.length === 0 ? (
                <div className="text-center text-gray-500">No appointments found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {formData.action === 'reschedule' && formData.reschedule_method === 'set_time' && (
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedAppointmentIds.size === previewAppointments.length}
                                onChange={(e) => toggleSelectAll(e.target.checked)}
                              />
                              Select
                            </label>
                          </th>
                        )}
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewAppointments.map((appointment) => (
                        <tr key={appointment.id} className="hover:bg-gray-50">
                          {formData.action === 'reschedule' && formData.reschedule_method === 'set_time' && (
                            <td className="px-4 py-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={selectedAppointmentIds.has(appointment.id)}
                                onChange={(e) => toggleSelectOne(appointment.id, e.target.checked)}
                              />
                            </td>
                          )}
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {appointment.patient_name || 'Unknown'}
                            {appointment.patient_phone ? ` (${appointment.patient_phone})` : ''}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {formatDateTime(appointment.start_at)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">{appointment.status}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{appointment.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                }}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Save Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Automations;
