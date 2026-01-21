import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './calendar.css';
import { toast } from 'react-toastify';
import appointmentService, { Appointment } from '../../services/appointment.service';
import doctorService, { Doctor } from '../../services/doctor.service';
import patientService, { Patient } from '../../services/patient.service';
import api from '../../services/api';
import { FiPlus, FiFilter, FiX, FiSave, FiTrash2 } from 'react-icons/fi';

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const AppointmentCalendar = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [colorCodes, setColorCodes] = useState<any[]>([]);
  const [selectedPatientColorCode, setSelectedPatientColorCode] = useState<string>('');
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    start_at: '',
    duration: 30,
    type: '',
    status: 'scheduled' as const,
    reservation_type: 'Clinic',
    notes: '',
  });

  useEffect(() => {
    loadDoctors();
    loadPatients();
    loadColorCodes();
    loadAppointments();
  }, [selectedDoctor]);

  useEffect(() => {
    if (modalMode === 'create' && formData.doctor_id && formData.start_at) {
      const appointmentDate = formData.start_at.split('T')[0];
      loadAvailableTimeSlots(appointmentDate);
    } else {
      setTimeSlots([]);
    }
  }, [formData.doctor_id, formData.start_at?.split('T')[0], modalMode]);

  const loadDoctors = async () => {
    try {
      const result = await doctorService.getAll();
      setDoctors(result || []);
    } catch (error: any) {
      console.error('Error loading doctors:', error);
      toast.error('Failed to load doctors');
    }
  };

  const loadPatients = async () => {
    try {
      const result = await patientService.getAll();
      if (result && 'patients' in result) {
        setPatients(result.patients || []);
      } else {
        setPatients([]);
      }
    } catch (error: any) {
      console.error('Error loading patients:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to load patients');
      setPatients([]);
    }
  };

  const loadColorCodes = async () => {
    try {
      const result = await patientService.getColorCodes();
      setColorCodes(result || []);
    } catch (error: any) {
      console.error('Error loading color codes:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (selectedDoctor) filters.doctor_id = selectedDoctor;

      const result = await appointmentService.getAll(filters);
      
      // For calendar view, show all appointments (not just future ones)
      // Filter only cancelled and no-show appointments
      const visibleAppointments = (result || []).filter(apt => 
        apt.status !== 'cancelled' && apt.status !== 'no-show'
      );
      
      setAppointments(visibleAppointments);
    } catch (error: any) {
      console.error('Error loading appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTimeSlots = async (appointmentDate: string) => {
    setLoadingSlots(true);
    try {
      const calendarResponse: any = await api.get(`/calendars/doctor/${formData.doctor_id}`);
      const calendar = calendarResponse.data?.data || calendarResponse.data || calendarResponse;
      
      const selectedDate = new Date(appointmentDate);
      const dayOfWeek = selectedDate.getDay();
      
      const startOfDay = `${appointmentDate}T00:00:00`;
      const endOfDay = `${appointmentDate}T23:59:59`;
      
      const appointmentsResponse: any = await api.get(`/appointments?doctor_id=${formData.doctor_id}&date_from=${startOfDay}&date_to=${endOfDay}`);
      const appointmentsData = appointmentsResponse.data?.data || appointmentsResponse.data || appointmentsResponse;
      const existingAppointments = Array.isArray(appointmentsData) ? appointmentsData : [];
      
      const activeAppointments = existingAppointments.filter((apt: any) => 
        apt.status !== 'cancelled' && apt.status !== 'no-show'
      );
      
      let workingHours = null;
      if (calendar && calendar.working_hours && Array.isArray(calendar.working_hours)) {
        workingHours = calendar.working_hours.find((wh: any) => 
          wh.day_of_week === dayOfWeek && wh.is_active
        );
      }
      
      const slots: TimeSlot[] = [];
      
      if (!workingHours || workingHours.is_closed) {
        setTimeSlots([]);
        if (workingHours?.is_closed) {
          toast.info('This day is marked as closed (weekend/holiday) for this doctor');
        }
        setLoadingSlots(false);
        return;
      }
      
      const [startHour, startMinute] = workingHours.start_time.split(':').map(Number);
      const [endHour, endMinute] = workingHours.end_time.split(':').map(Number);
      
      let slotDuration = 30;
      let breakDuration = 0;
      
      if (calendar.time_slots && Array.isArray(calendar.time_slots) && calendar.time_slots.length > 0) {
        const timeSlotConfig = calendar.time_slots[0];
        slotDuration = timeSlotConfig.slot_duration || 30;
        breakDuration = timeSlotConfig.break_duration || 0;
      }
      
      let currentHour = startHour;
      let currentMinute = startMinute;
      
      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const time = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        
        const slotDateTime = new Date(appointmentDate);
        slotDateTime.setHours(currentHour, currentMinute, 0, 0);
        
        const isBooked = activeAppointments.some((apt: any) => {
          const aptStart = new Date(apt.start_at);
          const aptEnd = new Date(apt.end_at);
          return slotDateTime >= aptStart && slotDateTime < aptEnd;
        });
        
        slots.push({ time, available: !isBooked });
        
        currentMinute += slotDuration + breakDuration;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }
      }
      
      setTimeSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      toast.error('Failed to load time slots');
      setTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const events: CalendarEvent[] = useMemo(() => {
    const mappedEvents = appointments.map((appointment) => {
      // Parse datetime without timezone conversion
      // Backend returns ISO format: 'YYYY-MM-DDTHH:MM:SS.000Z'
      const parseLocalDate = (dateString: string) => {
        try {
          if (!dateString) {
            console.error('Empty date string');
            return new Date();
          }
          
          // Remove timezone suffix and milliseconds
          const cleaned = dateString.replace(/\.\d{3}Z?$/, '').replace(' ', 'T');
          const [datePart, timePart] = cleaned.split('T');
          
          if (!datePart || !timePart) {
            console.error('Invalid date format:', dateString);
            return new Date();
          }
          
          const [year, month, day] = datePart.split('-').map(Number);
          const [hours, minutes, seconds = 0] = timePart.split(':').map(Number);
          
          // Create date in local timezone (treat the time values as local, not UTC)
          const localDate = new Date(year, month - 1, day, hours, minutes, seconds);
          return localDate;
        } catch (error) {
          console.error('Error parsing date:', dateString, error);
          return new Date();
        }
      };
      
      const startDate = parseLocalDate(appointment.start_at);
      const endDate = parseLocalDate(appointment.end_at);
      const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
      
      return {
        id: appointment.id,
        title: `${appointment.patient_name}\n${appointment.type} (${duration}min)`,
        start: startDate,
        end: endDate,
        resource: appointment,
      };
    });
    
    return mappedEvents;
  }, [appointments]);

  const handleSelectSlot = (slotInfo: any) => {
    const startTime = moment(slotInfo.start).format('YYYY-MM-DDTHH:mm');
    setFormData({
      patient_id: '',
      doctor_id: selectedDoctor || '',
      start_at: startTime,
      duration: 30,
      type: '',
      status: 'scheduled',
      reservation_type: 'Clinic',
      notes: '',
    });
    setModalMode('create');
    setSelectedAppointment(null);
    setShowModal(true);
  };

  const handleSelectEvent = async (event: CalendarEvent) => {
    const appointment = event.resource;
    setSelectedAppointment(appointment);
    
    // Parse the UTC string without timezone conversion
    const parseToLocalFormat = (dateString: string) => {
      const cleaned = dateString.replace(/\.\d{3}Z?$/, '').replace(' ', 'T');
      return cleaned.substring(0, 16); // Return 'YYYY-MM-DDTHH:mm' format
    };
    
    setFormData({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      start_at: parseToLocalFormat(appointment.start_at),
      duration: moment(appointment.end_at).diff(moment(appointment.start_at), 'minutes'),
      type: appointment.type,
      status: appointment.status,
      reservation_type: (appointment as any).reservation_type || 'Clinic',
      notes: appointment.notes || '',
    });
    
    // Load patient details to get color code
    try {
      const patient = await patientService.getById(appointment.patient_id);
      setSelectedPatientColorCode(patient.color_code_id || '');
    } catch (error) {
      console.error('Error loading patient details:', error);
    }
    
    setModalMode('edit');
    setShowModal(true);
  };

  const handleEventDrop = async ({ event, start, end }: any) => {
    try {
      const appointment = event.resource as Appointment;
      await appointmentService.update(appointment.id, {
        start_at: moment(start).toISOString(),
        end_at: moment(end).toISOString(),
      });
      toast.success('Appointment rescheduled successfully');
      loadAppointments();
    } catch (error: any) {
      toast.error('Failed to reschedule appointment');
    }
  };

  const handleEventResize = async ({ event, start, end }: any) => {
    try {
      const appointment = event.resource as Appointment;
      await appointmentService.update(appointment.id, {
        start_at: moment(start).toISOString(),
        end_at: moment(end).toISOString(),
      });
      toast.success('Appointment duration updated');
      loadAppointments();
    } catch (error: any) {
      toast.error('Failed to update appointment duration');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const startDate = new Date(formData.start_at);
      const endDate = new Date(startDate.getTime() + formData.duration * 60000);
      
      const appointmentData = {
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        type: formData.type,
        status: formData.status,
        reservation_type: formData.reservation_type,
        notes: formData.notes,
      };

      if (modalMode === 'create') {
        await appointmentService.create(appointmentData);
        toast.success('Appointment created successfully');
      } else if (selectedAppointment) {
        await appointmentService.update(selectedAppointment.id, appointmentData);
        toast.success('Appointment updated successfully');
      }

      // Update patient color code if changed
      if (selectedPatientColorCode && formData.patient_id) {
        try {
          await patientService.update(formData.patient_id, {
            color_code_id: selectedPatientColorCode,
          });
        } catch (error) {
          console.error('Error updating patient color:', error);
        }
      }

      setShowModal(false);
      loadAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${modalMode} appointment`);
    }
  };

  const handleDelete = async () => {
    if (!selectedAppointment) return;
    
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;

    try {
      await appointmentService.delete(selectedAppointment.id);
      toast.success('Appointment deleted successfully');
      setShowModal(false);
      loadAppointments();
    } catch (error: any) {
      toast.error('Failed to delete appointment');
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const appointment = event.resource;
    let backgroundColor = '#3174ad';

    // Use status-based colors for clear visual distinction
    switch (appointment.status) {
      case 'scheduled':
        backgroundColor = '#3b82f6'; // blue
        break;
      case 'confirmed':
        backgroundColor = '#10b981'; // green
        break;
      case 'completed':
        backgroundColor = '#6b7280'; // gray
        break;
      case 'cancelled':
        backgroundColor = '#ef4444'; // red
        break;
      case 'no-show':
        backgroundColor = '#f97316'; // orange
        break;
      case 'no-answer':
        backgroundColor = '#a855f7'; // purple
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Appointment Calendar</h1>
          <p className="text-gray-600 mt-1">View and manage appointments by calendar</p>
        </div>
        <button
          onClick={() => navigate('/appointments/new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus /> Schedule Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <FiFilter className="text-gray-400 hidden md:block" />
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2 md:hidden">
              Filter by Doctor
            </label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setView('month')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-medium transition-all ${
                view === 'month' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-medium transition-all ${
                view === 'week' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-medium transition-all ${
                view === 'day' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6" style={{ height: 'calc(100vh - 400px)', minHeight: '500px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading calendar...</p>
            </div>
          </div>
        ) : (
          <DragAndDropCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            selectable
            resizable
            eventPropGetter={eventStyleGetter}
            popup
            views={['month', 'week', 'day']}
            step={15}
            timeslots={1}
            showMultiDayTimes
          />
        )}
      </div>

      {/* Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                {modalMode === 'create' ? 'Create New Appointment' : 'Edit Appointment'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6">
              {/* Patient & Color Section */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Patient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Patient */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patient <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.patient_id}
                      onChange={async (e) => {
                        setFormData({ ...formData, patient_id: e.target.value });
                        if (e.target.value) {
                          try {
                            const patient = await patientService.getById(e.target.value);
                            setSelectedPatientColorCode(patient.color_code_id || '');
                          } catch (error) {
                            console.error('Error loading patient:', error);
                          }
                        }
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Patient</option>
                      {patients?.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.first_name} {patient.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Patient Color Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patient Color Code
                    </label>
                    <select
                      value={selectedPatientColorCode}
                      onChange={(e) => setSelectedPatientColorCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Color</option>
                      {colorCodes.map((color) => (
                        <option key={color.id} value={color.id}>
                          {color.color_name}
                        </option>
                      ))}
                    </select>
                    {selectedPatientColorCode && colorCodes.length > 0 && (() => {
                      const selectedColor = colorCodes.find((c) => String(c.id) === String(selectedPatientColorCode));
                      return selectedColor ? (
                        <div className="mt-2 flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm"
                            style={{
                              backgroundColor: selectedColor.color_hex,
                            }}
                          />
                          <span className="text-xs text-gray-600 font-medium">
                            {selectedColor.color_name}
                          </span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>

              {/* Appointment Details Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Appointment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Doctor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Doctor <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.doctor_id}
                      onChange={async (e) => {
                        setFormData({ ...formData, doctor_id: e.target.value });
                        if (e.target.value) {
                          try {
                            const calendarResponse: any = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/calendars/doctor/${e.target.value}`, {
                              headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                              }
                            });
                            const calendarData = await calendarResponse.json();
                            const calendar = calendarData.data || calendarData;
                            if (calendar.time_slots && calendar.time_slots.length > 0) {
                              setFormData(prev => ({ ...prev, duration: calendar.time_slots[0].slot_duration || 30 }));
                            }
                          } catch (error) {
                            console.error('Error loading doctor calendar:', error);
                          }
                        }
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Doctor</option>
                      {doctors?.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Appointment Type <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                      placeholder="e.g., Checkup, Follow-up, Consultation"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Reservation Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reservation Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.reservation_type}
                      onChange={(e) => setFormData({ ...formData, reservation_type: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Clinic">Clinic</option>
                      <option value="samar_phone">Samar Phone</option>
                      <option value="Habiba_phone">Habiba Phone</option>
                      <option value="Doctor">Doctor</option>
                      <option value="website">Website</option>
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Appointment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.start_at ? formData.start_at.split('T')[0] : ''}
                      onChange={(e) => {
                        const date = e.target.value;
                        const currentTime = formData.start_at ? formData.start_at.split('T')[1] : '09:00';
                        setFormData({ ...formData, start_at: `${date}T${currentTime}` });
                      }}
                      min={modalMode === 'create' ? new Date().toISOString().split('T')[0] : undefined}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                      <option value={180}>3 hours</option>
                    </select>
                  </div>
                </div>

                {/* Time Slots */}
                {modalMode === 'create' && formData.doctor_id && formData.start_at && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Available Time Slots <span className="text-red-500">*</span>
                    </label>
                    
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : timeSlots.length > 0 ? (
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => {
                              const date = formData.start_at.split('T')[0];
                              setFormData({ ...formData, start_at: `${date}T${slot.time}` });
                            }}
                            disabled={!slot.available}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                              formData.start_at.split('T')[1]?.startsWith(slot.time)
                                ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2'
                                : slot.available
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    ) : formData.doctor_id && formData.start_at ? (
                      <p className="text-gray-500 text-sm">No available time slots for this date</p>
                    ) : null}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Start Time Display */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selected Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_at}
                      onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                      readOnly={modalMode === 'create'}
                      required
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        modalMode === 'create' ? 'bg-gray-50' : ''
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-4">
                  {/* Status */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                      {[
                        { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800 border-blue-300' },
                        { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800 border-green-300' },
                        { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-800 border-gray-300' },
                        { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300' },
                        { value: 'no-show', label: 'No Show', color: 'bg-orange-100 text-orange-800 border-orange-300' },
                        { value: 'no-answer', label: 'No Answer', color: 'bg-purple-100 text-purple-800 border-purple-300' },
                      ].map((status) => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: status.value as any })}
                          className={`px-3 py-2 rounded-md border-2 text-sm font-medium transition-all ${
                            formData.status === status.value
                              ? status.color + ' ring-2 ring-offset-2'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Add any additional notes or instructions..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-4 border-t">
                <div>
                  {modalMode === 'edit' && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      <FiTrash2 size={16} />
                      Delete Appointment
                    </button>
                  )}
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 md:flex-none px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <FiSave size={16} />
                    {modalMode === 'create' ? 'Create' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 bg-white rounded-lg shadow-md p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Status Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
            <span className="text-sm text-gray-600">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
            <span className="text-sm text-gray-600">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6b7280' }}></div>
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-sm text-gray-600">Cancelled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f97316' }}></div>
            <span className="text-sm text-gray-600">No Show</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#a855f7' }}></div>
            <span className="text-sm text-gray-600">No Answer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendar;
