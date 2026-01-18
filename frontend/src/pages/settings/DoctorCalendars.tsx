import { useState, useEffect } from 'react';
import { FiClock, FiPlus, FiEdit2, FiTrash2, FiAlertCircle, FiX, FiSave, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import api from '../../services/api';
import { toast } from 'react-toastify';

interface DoctorCalendar {
  id: string;
  doctor_id: string;
  doctor_name: string;
  name: string;
  timezone: string;
  is_active: boolean;
  working_hours?: WorkingHour[];
  time_slots?: TimeSlot[];
}

interface WorkingHour {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_closed?: boolean;
}

interface TimeSlot {
  id: string;
  slot_duration: number;
  break_duration: number;
  max_appointments_per_slot: number;
  is_active: boolean;
}

const DoctorCalendars = () => {
  const [calendars, setCalendars] = useState<DoctorCalendar[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalendar, setSelectedCalendar] = useState<string | null>(null);
  const [expandedCalendars, setExpandedCalendars] = useState<Set<string>>(new Set());
  
  // Modal states
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [showTimeSlotsModal, setShowTimeSlotsModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [editingWorkingHour, setEditingWorkingHour] = useState<WorkingHour | null>(null);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  const [editingCalendar, setEditingCalendar] = useState<DoctorCalendar | null>(null);
  
  // Form states
  const [calendarForm, setCalendarForm] = useState({
    doctor_id: '',
    name: '',
    timezone: 'UTC',
    is_active: true,
    weekendDays: [4, 5] // Default: Thursday and Friday
  });
  
  const [workingHourForm, setWorkingHourForm] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    is_active: true,
    is_closed: false
  });
  
  const [timeSlotForm, setTimeSlotForm] = useState({
    slot_duration: 30,
    break_duration: 0,
    max_appointments_per_slot: 1,
    is_active: true
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const windowsTimezones = [
    'UTC',
    'GMT Standard Time',
    'Middle East Standard Time',
    'Egypt Standard Time',
  ];

  useEffect(() => {
    fetchCalendars();
    fetchDoctors();
  }, []);

  const fetchCalendars = async () => {
    try {
      setLoading(true);
      const response = await api.get('/calendars');
      // Extract data from response - handle {success, data} structure
      const result = response.data;
      const data = result?.data || result;
      setCalendars(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching calendars:', error);
      toast.error('Failed to load calendars');
      setCalendars([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/doctors');
      const result = response.data;
      const data = result?.data || result;
      setDoctors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    }
  };

  // Calendar CRUD
  const handleCreateCalendar = () => {
    setEditingCalendar(null);
    setCalendarForm({
      doctor_id: '',
      name: '',
      timezone: 'UTC',
      is_active: true,
      weekendDays: [4, 5]
    });
    setShowCalendarModal(true);
  };

  const handleEditCalendar = (calendar: DoctorCalendar) => {
    setEditingCalendar(calendar);
    setCalendarForm({
      doctor_id: calendar.doctor_id,
      name: calendar.name,
      timezone: calendar.timezone,
      is_active: calendar.is_active,
      weekendDays: []
    });
    setShowCalendarModal(true);
  };

  const handleSaveCalendar = async () => {
    if (!editingCalendar && !calendarForm.doctor_id) {
      toast.error('Please select a doctor');
      return;
    }
    
    if (!calendarForm.name.trim()) {
      toast.error('Please enter a calendar name');
      return;
    }
    
    try {
      if (editingCalendar) {
        // Update existing calendar
        await api.put(`/calendars/${editingCalendar.id}`, {
          name: calendarForm.name,
          timezone: calendarForm.timezone,
          is_active: calendarForm.is_active
        });
        toast.success('Calendar updated successfully');
      } else {
        // Create new calendar
        const response = await api.post('/calendars', {
          doctor_id: calendarForm.doctor_id,
          name: calendarForm.name,
          timezone: calendarForm.timezone,
          is_active: calendarForm.is_active
        });
        
        const newCalendar = response.data.data || response.data;
        
        // Create default working hours for all days
        const workingHoursPromises = dayNames.map((day, index) => {
          const isWeekend = calendarForm.weekendDays.includes(index);
          return api.post(`/calendars/${newCalendar.id}/working-hours`, {
            day_of_week: index,
            start_time: '09:00',
            end_time: '17:00',
            is_active: !isWeekend,
            is_closed: isWeekend
          });
        });
        
        await Promise.all(workingHoursPromises);
        toast.success('Calendar created successfully with working hours');
      }
      setShowCalendarModal(false);
      await fetchCalendars();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save calendar');
    }
  };

  const handleDeleteCalendar = async (id: string, doctorName: string) => {
    if (!window.confirm(`Are you sure you want to delete the calendar for ${doctorName}?`)) return;
    
    try {
      await api.delete(`/calendars/${id}`);
      toast.success('Calendar deleted successfully');
      await fetchCalendars();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete calendar');
    }
  };

  // Working Hours CRUD
  const handleAddWorkingHours = (calendarId: string, dayOfWeek?: number) => {
    setSelectedCalendar(calendarId);
    setEditingWorkingHour(null);
    
    // Check if it's weekend (Thursday=4 or Friday=5)
    const isWeekend = dayOfWeek === 4 || dayOfWeek === 5;
    
    setWorkingHourForm({
      day_of_week: dayOfWeek !== undefined ? dayOfWeek : 1,
      start_time: '09:00',
      end_time: '17:00',
      is_active: !isWeekend,
      is_closed: isWeekend
    });
    setShowWorkingHoursModal(true);
  };

  const handleEditWorkingHour = (calendarId: string, wh: WorkingHour) => {
    setSelectedCalendar(calendarId);
    setEditingWorkingHour(wh);
    setWorkingHourForm({
      day_of_week: wh.day_of_week,
      start_time: wh.start_time,
      end_time: wh.end_time,
      is_active: wh.is_active,
      is_closed: wh.is_closed || false
    });
    setShowWorkingHoursModal(true);
  };

  const handleSaveWorkingHours = async () => {
    if (!selectedCalendar) return;
    
    try {
      if (editingWorkingHour) {
        await api.put(`/calendars/working-hours/${editingWorkingHour.id}`, workingHourForm);
        toast.success('Working hours updated successfully');
      } else {
        await api.post(`/calendars/${selectedCalendar}/working-hours`, workingHourForm);
        toast.success('Working hours added successfully');
      }
      setShowWorkingHoursModal(false);
      await fetchCalendars();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save working hours');
    }
  };

  const handleDeleteWorkingHour = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete these working hours?')) return;
    
    try {
      await api.delete(`/calendars/working-hours/${id}`);
      toast.success('Working hours deleted successfully');
      await fetchCalendars();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete working hours');
    }
  };

  // Time Slots CRUD
  const handleAddTimeSlot = (calendarId: string) => {
    setSelectedCalendar(calendarId);
    setEditingTimeSlot(null);
    setTimeSlotForm({
      slot_duration: 30,
      break_duration: 0,
      max_appointments_per_slot: 1,
      is_active: true
    });
    setShowTimeSlotsModal(true);
  };

  const handleEditTimeSlot = (calendarId: string, ts: TimeSlot) => {
    setSelectedCalendar(calendarId);
    setEditingTimeSlot(ts);
    setTimeSlotForm({
      slot_duration: ts.slot_duration,
      break_duration: ts.break_duration,
      max_appointments_per_slot: ts.max_appointments_per_slot,
      is_active: ts.is_active
    });
    setShowTimeSlotsModal(true);
  };

  const handleSaveTimeSlot = async () => {
    if (!selectedCalendar) return;
    
    try {
      if (editingTimeSlot) {
        const response = await api.put(`/calendars/time-slots/${editingTimeSlot.id}`, timeSlotForm);
        toast.success('Time slot updated successfully');
      } else {
        const response = await api.post(`/calendars/${selectedCalendar}/time-slots`, timeSlotForm);
        toast.success('Time slot added successfully');
      }
      setShowTimeSlotsModal(false);
      await fetchCalendars(); // Wait for refresh to complete
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save time slot');
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Doctor Calendars</h1>
            <p className="text-gray-600 mt-2">Manage working hours, time slots, and calendar exceptions</p>
          </div>
          <button
            onClick={handleCreateCalendar}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FiPlus size={18} />
            Create Calendar
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {calendars.map((calendar) => (
          <div key={calendar.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl cursor-pointer" onClick={() => {
              const newExpanded = new Set(expandedCalendars);
              if (newExpanded.has(calendar.id)) {
                newExpanded.delete(calendar.id);
              } else {
                newExpanded.add(calendar.id);
              }
              setExpandedCalendars(newExpanded);
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="text-white hover:bg-blue-800 p-1 rounded" onClick={(e) => {
                    e.stopPropagation();
                    const newExpanded = new Set(expandedCalendars);
                    if (newExpanded.has(calendar.id)) {
                      newExpanded.delete(calendar.id);
                    } else {
                      newExpanded.add(calendar.id);
                    }
                    setExpandedCalendars(newExpanded);
                  }}>
                    {expandedCalendars.has(calendar.id) ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                  </button>
                  <div>
                    <h2 className="text-xl font-semibold">{calendar.doctor_name}</h2>
                    <p className="text-blue-100 text-sm">{calendar.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleEditCalendar(calendar)}
                    className="p-2 hover:bg-blue-800 rounded-lg transition"
                    title="Edit Calendar"
                  >
                    <FiEdit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteCalendar(calendar.id, calendar.doctor_name)}
                    className="p-2 hover:bg-red-600 rounded-lg transition"
                    title="Delete Calendar"
                  >
                    <FiTrash2 size={18} />
                  </button>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    calendar.is_active ? 'bg-green-500' : 'bg-gray-400'
                  }`}>
                    {calendar.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-3 py-1 bg-blue-500 rounded-full text-sm">
                    {calendar.timezone}
                  </span>
                </div>
              </div>
            </div>

            {/* Working Hours */}
            {expandedCalendars.has(calendar.id) && (
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FiClock className="text-blue-600" />
                  Weekly Working Hours
                </h3>
              </div>
              
              {calendar.working_hours && calendar.working_hours.length > 0 ? (
                <div className="space-y-3">
                  {dayNames.map((dayName, dayIndex) => {
                    const dayHours = calendar.working_hours?.find(wh => wh.day_of_week === dayIndex);
                    const isWeekendDay = dayIndex === 4 || dayIndex === 5;
                    return (
                      <div key={dayIndex} className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                        dayHours ? (dayHours.is_closed ? 'border-red-200 bg-red-50' : dayHours.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50') : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-4 flex-1">
                          <span className="font-medium text-gray-800 w-28">{dayName}</span>
                          {dayHours ? (
                            <>
                              {dayHours.is_closed ? (
                                <span className="text-sm text-red-600 font-medium">Closed / Weekend</span>
                              ) : (
                                <>
                                  <span className="text-sm text-gray-600">
                                    {formatTime(dayHours.start_time)} - {formatTime(dayHours.end_time)}
                                  </span>
                                  {!dayHours.is_active && (
                                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Unavailable</span>
                                  )}
                                </>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-gray-400 italic">{isWeekendDay ? 'Weekend' : 'Not configured'}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {dayHours ? (
                            <>
                              <button 
                                onClick={() => handleEditWorkingHour(calendar.id, dayHours)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Edit"
                              >
                                <FiEdit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteWorkingHour(dayHours.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => handleAddWorkingHours(calendar.id, dayIndex)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Add hours for this day"
                            >
                              <FiPlus size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {dayNames.map((dayName, dayIndex) => {
                    const isWeekendDay = dayIndex === 4 || dayIndex === 5;
                    return (
                    <div key={dayIndex} className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="font-medium text-gray-800 w-28">{dayName}</span>
                        <span className="text-sm text-gray-400 italic">{isWeekendDay ? 'Weekend' : 'Not configured'}</span>
                      </div>
                      <button 
                        onClick={() => handleAddWorkingHours(calendar.id, dayIndex)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Add hours for this day"
                      >
                        <FiPlus size={16} />
                      </button>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}

            {/* Time Slots */}
            {expandedCalendars.has(calendar.id) && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FiClock className="text-blue-600" />
                  Time Slot Configuration
                </h3>
                <button 
                  onClick={() => handleAddTimeSlot(calendar.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FiPlus size={16} />
                  Configure Slots
                </button>
              </div>
              
              {calendar.time_slots && calendar.time_slots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {calendar.time_slots.map((ts) => (
                    <div key={ts.id} className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">Slot Settings</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditTimeSlot(calendar.id, ts)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FiEdit2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium">{ts.slot_duration} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Break:</span>
                          <span className="font-medium">{ts.break_duration} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max Appointments:</span>
                          <span className="font-medium">{ts.max_appointments_per_slot}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiAlertCircle className="mx-auto mb-2" size={24} />
                  <p>No time slot configuration</p>
                </div>
              )}
            </div>
            )}
          </div>
        ))}

        {calendars.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FiAlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Calendars Found</h3>
            <p className="text-gray-500">Doctor calendars will be created automatically when needed</p>
          </div>
        )}
      </div>

      {/* Working Hours Modal */}
      {showWorkingHoursModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold">
                {editingWorkingHour ? 'Edit Working Hours' : 'Add Working Hours'}
              </h3>
              <button onClick={() => setShowWorkingHoursModal(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                <select
                  value={workingHourForm.day_of_week}
                  onChange={(e) => setWorkingHourForm({ ...workingHourForm, day_of_week: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {dayNames.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={workingHourForm.start_time}
                    onChange={(e) => setWorkingHourForm({ ...workingHourForm, start_time: e.target.value })}
                    disabled={workingHourForm.is_closed}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={workingHourForm.end_time}
                    onChange={(e) => setWorkingHourForm({ ...workingHourForm, end_time: e.target.value })}
                    disabled={workingHourForm.is_closed}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="is_closed"
                    checked={workingHourForm.is_closed}
                    onChange={(e) => setWorkingHourForm({ ...workingHourForm, is_closed: e.target.checked, is_active: !e.target.checked })}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="is_closed" className="text-sm font-medium text-gray-700">Closed / Weekend</label>
                </div>

                {!workingHourForm.is_closed && (
                  <div className="flex items-center gap-2 ml-6">
                    <input 
                      type="checkbox" 
                      id="is_active"
                      checked={workingHourForm.is_active}
                      onChange={(e) => setWorkingHourForm({ ...workingHourForm, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowWorkingHoursModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWorkingHours}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <FiSave size={16} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Slots Modal */}
      {showTimeSlotsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold">
                {editingTimeSlot ? 'Edit Time Slot' : 'Add Time Slot'}
              </h3>
              <button onClick={() => setShowTimeSlotsModal(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slot Duration (minutes)</label>
                <input
                  type="number"
                  value={timeSlotForm.slot_duration}
                  onChange={(e) => setTimeSlotForm({ ...timeSlotForm, slot_duration: parseInt(e.target.value) })}
                  min="5"
                  step="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Break Duration (minutes)</label>
                <input
                  type="number"
                  value={timeSlotForm.break_duration}
                  onChange={(e) => setTimeSlotForm({ ...timeSlotForm, break_duration: parseInt(e.target.value) })}
                  min="0"
                  step="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Appointments Per Slot</label>
                <input
                  type="number"
                  value={timeSlotForm.max_appointments_per_slot}
                  onChange={(e) => setTimeSlotForm({ ...timeSlotForm, max_appointments_per_slot: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="slot_is_active"
                  checked={timeSlotForm.is_active}
                  onChange={(e) => setTimeSlotForm({ ...timeSlotForm, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="slot_is_active" className="text-sm font-medium text-gray-700">Active</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowTimeSlotsModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTimeSlot}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <FiSave size={16} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Edit Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingCalendar ? 'Edit Calendar' : 'Create New Calendar'}
              </h3>
              <button
                onClick={() => {
                  setShowCalendarModal(false);
                  setEditingCalendar(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {!editingCalendar && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={calendarForm.doctor_id}
                    onChange={(e) =>
                      setCalendarForm({ ...calendarForm, doctor_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.first_name} {doctor.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calendar Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={calendarForm.name}
                  onChange={(e) =>
                    setCalendarForm({ ...calendarForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Dr. John's Schedule"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={calendarForm.timezone}
                  onChange={(e) =>
                    setCalendarForm({ ...calendarForm, timezone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {windowsTimezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              {!editingCalendar && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weekend / Days Off
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {dayNames.map((day, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`weekend-${index}`}
                          checked={calendarForm.weekendDays.includes(index)}
                          onChange={(e) => {
                            const newWeekendDays = e.target.checked
                              ? [...calendarForm.weekendDays, index]
                              : calendarForm.weekendDays.filter(d => d !== index);
                            setCalendarForm({ ...calendarForm, weekendDays: newWeekendDays });
                          }}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <label htmlFor={`weekend-${index}`} className="text-sm text-gray-700">
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Selected days will be marked as closed/weekend
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="calendarActive"
                  checked={calendarForm.is_active}
                  onChange={(e) =>
                    setCalendarForm({ ...calendarForm, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="calendarActive" className="text-sm font-medium text-gray-700">
                  Calendar Active
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCalendarModal(false);
                  setEditingCalendar(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCalendar}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <FiSave size={16} />
                {editingCalendar ? 'Save Changes' : 'Create Calendar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorCalendars;
