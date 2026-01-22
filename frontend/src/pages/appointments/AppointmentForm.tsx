import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import appointmentService from '../../services/appointment.service';
import patientService from '../../services/patient.service';
import doctorService from '../../services/doctor.service';
import api from '../../services/api';
import { FiSave, FiX } from 'react-icons/fi';

interface TimeSlot {
  time: string;
  available: boolean;
  is_blocked?: boolean;
  block_reason?: string;
}

const AppointmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [colorCodes, setColorCodes] = useState<any[]>([]);
  const [selectedPatientColorCode, setSelectedPatientColorCode] = useState<string>('');
  const [doctorCalendars, setDoctorCalendars] = useState<any[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);

  const [formData, setFormData] = useState<{
    patient_id: string;
    doctor_id: string;
    calendar_id: string;
    start_at: string;
    end_at: string;
    type: string;
    status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no-show' | 'no-answer';
    reservation_type: string;
    notes: string;
    duration: number;
  }>({
    patient_id: '',
    doctor_id: '',
    calendar_id: '',
    start_at: '',
    end_at: '',
    type: '',
    status: 'scheduled',
    reservation_type: 'Clinic',
    notes: '',
    duration: 30, // Default 30 minutes
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSelections();
    if (isEditMode && id) {
      loadAppointment(id);
    }
  }, [id]);

  useEffect(() => {
    // Only load time slots if we have a doctor and date
    // For single calendar doctors or when calendar is selected, proceed
    if (formData.doctor_id && formData.start_at) {
      const appointmentDate = formData.start_at.split('T')[0];
      
      // If multiple calendars exist, wait for calendar selection
      if (doctorCalendars.length > 1 && !formData.calendar_id) {
        setTimeSlots([]);
        return;
      }
      
      // Load time slots
      loadAvailableTimeSlots(appointmentDate);
    } else {
      setTimeSlots([]);
    }
  }, [formData.doctor_id, formData.calendar_id, formData.start_at?.split('T')[0], doctorCalendars.length]);

  const loadSelections = async () => {
    try {
      const [patientsData, doctorsData, colorCodesData] = await Promise.all([
        patientService.getAll(),
        doctorService.getAll(),
        patientService.getColorCodes(),
      ]);
      if (patientsData && 'patients' in patientsData) {
        setPatients(patientsData.patients || []);
      } else {
        setPatients([]);
      }
      setDoctors(doctorsData || []);
      setColorCodes(colorCodesData || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to load patients or doctors');
      setPatients([]);
      setDoctors([]);
      setColorCodes([]);
    }
  };

  const loadAppointment = async (appointmentId: string) => {
    try {
      setLoadingData(true);
      const appointment = await appointmentService.getById(appointmentId);
      const start = new Date(appointment.start_at);
      const end = new Date(appointment.end_at);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      
      // Set patient search text if patient data is available
      if (appointment.patient_name) {
        setPatientSearch(appointment.patient_name);
      }
      
      // Load patient details to get color code
      try {
        const patient = await patientService.getById(appointment.patient_id);
        setSelectedPatientColorCode(patient.color_code_id || '');
      } catch (error) {
        console.error('Error loading patient details:', error);
      }
      
      setFormData({
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        calendar_id: appointment.calendar_id || '',
        start_at: start.toISOString().slice(0, 16),
        end_at: end.toISOString().slice(0, 16),
        type: appointment.type,
        status: appointment.status,
        reservation_type: appointment.reservation_type || 'Clinic',
        notes: appointment.notes || '',
        duration: durationMinutes,
      });
      
      // Load calendars for the doctor
      if (appointment.doctor_id) {
        loadDoctorCalendars(appointment.doctor_id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load appointment');
      navigate('/appointments');
    } finally {
      setLoadingData(false);
    }
  };

  const loadAvailableTimeSlots = async (appointmentDate: string) => {
    setLoadingSlots(true);
    try {
      // Build URL with calendarId if available
      let url = `/calendars/available-slots?doctorId=${formData.doctor_id}&date=${appointmentDate}`;
      if (formData.calendar_id) {
        url += `&calendarId=${formData.calendar_id}`;
      }
      
      // Use the backend API endpoint that handles all validation including past time slots
      const response: any = await api.get(url);
      
      const slotsData = response.data?.data || response.data || response;
      
      // Check if day is unavailable
      if (!slotsData.available) {
        setTimeSlots([]);
        toast.info(slotsData.reason || 'No available slots for this date');
        setLoadingSlots(false);
        return;
      }
      
      // Transform backend slots to frontend format
      const slots: TimeSlot[] = [];
      
      if (slotsData.slots && Array.isArray(slotsData.slots)) {
        slotsData.slots.forEach((slot: any) => {
          // Backend now returns 'YYYY-MM-DD HH:MM:SS' format without timezone
          // Extract just the time part
          const startTime = slot.start_time.split(' ')[1]; // Get 'HH:MM:SS'
          const [hours, minutes] = startTime.split(':');
          const time = `${hours}:${minutes}`;
          
          slots.push({
            time,
          available: slot.available,
          is_blocked: slot.is_blocked || false,
          block_reason: slot.block_reason || '',
          });
        });
      }
      setTimeSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      setTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadDoctorCalendars = async (doctorId: string) => {
    setLoadingCalendars(true);
    try {
      const response = await api.get<any>(`/calendars/doctor/${doctorId}/all`);
      const calendars = response.data?.data || response.data || [];
      setDoctorCalendars(Array.isArray(calendars) ? calendars : []);
      
      // Auto-select calendar if there's only one
      if (calendars.length === 1) {
        setFormData(prev => ({ ...prev, calendar_id: calendars[0].id }));
      } else if (calendars.length === 0) {
        // No calendars, clear selection
        setFormData(prev => ({ ...prev, calendar_id: '' }));
      }
    } catch (error) {
      console.error('Error loading doctor calendars:', error);
      setDoctorCalendars([]);
    } finally {
      setLoadingCalendars(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patient_id) {
      newErrors.patient_id = 'Patient is required';
    }
    if (!formData.doctor_id) {
      newErrors.doctor_id = 'Doctor is required';
    }
    if (!formData.start_at) {
      newErrors.start_at = 'Start time is required';
    }
    if (!formData.end_at) {
      newErrors.end_at = 'End time is required';
    }
    if (formData.start_at && formData.end_at) {
      if (new Date(formData.end_at) <= new Date(formData.start_at)) {
        newErrors.end_at = 'End time must be after start time';
      }
    }
    if (!formData.type.trim()) {
      newErrors.type = 'Appointment type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'start_at' || name === 'duration') {
      // Update end_at when start_at or duration changes
      const updatedFormData = { ...formData, [name]: name === 'duration' ? parseInt(value) || 30 : value };
      
      if (updatedFormData.start_at && updatedFormData.duration) {
        // Parse datetime-local value directly without timezone conversion
        const [datePart, timePart] = updatedFormData.start_at.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        
        // Create date in local timezone
        const startDate = new Date(year, month - 1, day, hours, minutes);
        const endDate = new Date(startDate.getTime() + updatedFormData.duration * 60000);
        
        // Format back to datetime-local format (YYYY-MM-DDTHH:mm)
        const endYear = endDate.getFullYear();
        const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
        const endDay = String(endDate.getDate()).padStart(2, '0');
        const endHours = String(endDate.getHours()).padStart(2, '0');
        const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
        
        updatedFormData.end_at = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}`;
      }
      
      setFormData(updatedFormData);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Check if selected time slot is blocked
    if (formData.start_at && timeSlots.length > 0) {
      const selectedTime = formData.start_at.split('T')[1]?.substring(0, 5); // Get HH:mm
      const selectedSlot = timeSlots.find(slot => slot.time === selectedTime);
      if (selectedSlot && selectedSlot.is_blocked) {
        toast.error(`Cannot schedule appointment: ${selectedSlot.block_reason || 'Time slot is blocked'}`);
        return;
      }
    }

    try {
      setLoading(true);

      if (isEditMode && id) {
        await appointmentService.update(id, formData);
        
        // Update patient color code if changed
        if (selectedPatientColorCode && formData.patient_id) {
          try {
            await patientService.update(formData.patient_id, {
              color_code_id: selectedPatientColorCode,
            });
          } catch (error) {
            console.error('Error updating patient color code:', error);
          }
        }
        
        toast.success('Appointment updated successfully');
      } else {
        await appointmentService.create(formData);
        
        // Update patient color code if specified
        if (selectedPatientColorCode && formData.patient_id) {
          try {
            await patientService.update(formData.patient_id, {
              color_code_id: selectedPatientColorCode,
            });
          } catch (error) {
            console.error('Error updating patient color code:', error);
          }
        }
        
        toast.success('Appointment created successfully');
      }

      navigate('/appointments', { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} appointment`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading appointment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {isEditMode ? 'Edit Appointment' : 'Schedule New Appointment'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditMode ? 'Update appointment details' : 'Enter appointment details'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {/* Patient & Doctor Selection */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient & Doctor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="flex items-center gap-2">
                  {formData.patient_id && patients.find(p => p.id === formData.patient_id)?.color_code && (
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-gray-300 flex-shrink-0" 
                      style={{ backgroundColor: patients.find(p => p.id === formData.patient_id)?.color_code }}
                      title={`Patient color: ${patients.find(p => p.id === formData.patient_id)?.color_code}`}
                    />
                  )}
                  <input
                    type="text"
                    placeholder="Search and select patient..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setShowPatientDropdown(true);
                      if (!e.target.value) {
                        setFormData({ ...formData, patient_id: '' });
                      }
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.patient_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {showPatientDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {patients
                      ?.filter((patient) => {
                        const searchTerm = patientSearch.toLowerCase();
                        const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
                        return fullName.includes(searchTerm);
                      })
                      .map((patient) => (
                        <div
                          key={patient.id}
                          onClick={async () => {
                            setFormData({ ...formData, patient_id: patient.id });
                            setPatientSearch(`${patient.first_name} ${patient.last_name}`);
                            setShowPatientDropdown(false);
                            setErrors((prev) => ({ ...prev, patient_id: '' }));
                            
                            // Load patient details to get color code
                            try {
                              const patientDetails = await patientService.getById(patient.id);
                              setSelectedPatientColorCode(patientDetails.color_code_id || '');
                            } catch (error) {
                              console.error('Error loading patient color code:', error);
                            }
                          }}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          {patient.first_name} {patient.last_name}
                        </div>
                      ))}
                    {patients?.filter((patient) => {
                      const searchTerm = patientSearch.toLowerCase();
                      const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
                      return fullName.includes(searchTerm);
                    }).length === 0 && (
                      <div className="px-4 py-2 text-gray-500 text-sm">No patients found</div>
                    )}
                  </div>
                )}
              </div>
              {errors.patient_id && <p className="text-red-500 text-sm mt-1">{errors.patient_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor <span className="text-red-500">*</span>
              </label>
              <select
                name="doctor_id"
                value={formData.doctor_id}
                onChange={async (e) => {
                  handleChange(e);
                  const doctorId = e.target.value;
                  
                  // Clear calendar selection and time slots when doctor changes
                  setFormData(prev => ({ ...prev, calendar_id: '', start_at: '' }));
                  setTimeSlots([]);
                  
                  if (doctorId) {
                    // Load calendars for selected doctor
                    await loadDoctorCalendars(doctorId);
                    
                    try {
                      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/calendars/doctor/${doctorId}`, {
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                      });
                      const calendarData = await response.json();
                      const calendar = calendarData.data || calendarData;
                      if (calendar.time_slots && calendar.time_slots.length > 0) {
                        setFormData(prev => ({ ...prev, duration: calendar.time_slots[0].slot_duration || 30 }));
                      }
                    } catch (error) {
                      console.error('Error loading doctor calendar:', error);
                    }
                  } else {
                    setDoctorCalendars([]);
                  }
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.doctor_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Doctor</option>
                {doctors?.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialty}
                  </option>
                ))}
              </select>
              {errors.doctor_id && <p className="text-red-500 text-sm mt-1">{errors.doctor_id}</p>}
            </div>

            {/* Calendar Selection - Show only if doctor has multiple calendars */}
            {formData.doctor_id && doctorCalendars.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calendar {doctorCalendars.length > 1 && <span className="text-red-500">*</span>}
                </label>
                {loadingCalendars ? (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Loading calendars...
                  </div>
                ) : (
                  <select
                    name="calendar_id"
                    value={formData.calendar_id}
                    onChange={(e) => {
                      setFormData({ ...formData, calendar_id: e.target.value });
                      // Clear time slots when calendar changes
                      setTimeSlots([]);
                      setFormData(prev => ({ ...prev, start_at: '' }));
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.calendar_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {doctorCalendars.length > 1 && <option value="">Select Calendar</option>}
                    {doctorCalendars.map((calendar) => (
                      <option key={calendar.id} value={calendar.id}>
                        {calendar.name}
                        {calendar.color_name && ` (${calendar.color_name})`}
                      </option>
                    ))}
                  </select>
                )}
                {errors.calendar_id && <p className="text-red-500 text-sm mt-1">{errors.calendar_id}</p>}
                {formData.calendar_id && doctorCalendars.length > 0 && (() => {
                  const selectedCalendar = doctorCalendars.find(c => c.id === formData.calendar_id);
                  return selectedCalendar?.color_code ? (
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm"
                        style={{ backgroundColor: selectedCalendar.color_code }}
                      />
                      <span className="text-sm text-gray-600 font-medium">
                        Calendar Color: {selectedCalendar.color_name || selectedCalendar.color_code}
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Color Code
              </label>
              <select
                value={selectedPatientColorCode}
                onChange={(e) => setSelectedPatientColorCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <span className="text-sm text-gray-600 font-medium">
                      {selectedColor.color_name}
                    </span>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Appointment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="appointment_date"
                value={formData.start_at ? formData.start_at.split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value;
                  const currentTime = formData.start_at ? formData.start_at.split('T')[1] : '09:00';
                  const newStartAt = `${date}T${currentTime}`;
                  handleChange({ target: { name: 'start_at', value: newStartAt } } as any);
                }}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.start_at ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.start_at && <p className="text-red-500 text-sm mt-1">{errors.start_at}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
              </select>
            </div>
          </div>

          {/* Time Slots */}
          {formData.doctor_id && formData.start_at && (
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
                  {timeSlots.map((slot) => {
                    const isBlocked = slot.is_blocked;
                    const blockReason = slot.block_reason;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => {
                          const date = formData.start_at.split('T')[0];
                          const newStartAt = `${date}T${slot.time}`;
                          handleChange({ target: { name: 'start_at', value: newStartAt } } as any);
                        }}
                        disabled={!slot.available || isBlocked}
                        title={isBlocked ? `Blocked: ${blockReason || 'Time slot unavailable'}` : ''}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                          isBlocked
                            ? 'bg-red-100 text-red-400 cursor-not-allowed line-through'
                            : formData.start_at.split('T')[1]?.startsWith(slot.time)
                            ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2'
                            : slot.available
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isBlocked && '🚫 '}{slot.time}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No available time slots for this date</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time (Select from slots above)
              </label>
              <input
                type="datetime-local"
                name="start_at"
                value={formData.start_at}
                onChange={handleChange}
                readOnly
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 ${
                  errors.start_at ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time (Auto-calculated)
              </label>
              <input
                type="datetime-local"
                name="end_at"
                value={formData.end_at}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
                placeholder="e.g., Prenatal Checkup, Annual Exam"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
                <option value="no-answer">No Answer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reservation Type <span className="text-red-500">*</span>
              </label>
              <select
                name="reservation_type"
                value={formData.reservation_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Clinic">Clinic</option>
                <option value="samar_phone">Samar Phone</option>
                <option value="Habiba_phone">Habiba Phone</option>
                <option value="Doctor">Doctor</option>
                <option value="website">Website</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Additional notes or instructions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave />
            {loading ? 'Saving...' : isEditMode ? 'Update Appointment' : 'Create Appointment'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/appointments')}
            className="flex items-center gap-2 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
          >
            <FiX />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;
