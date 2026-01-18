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

  const [formData, setFormData] = useState<{
    patient_id: string;
    doctor_id: string;
    start_at: string;
    end_at: string;
    type: string;
    status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
    reservation_type: string;
    notes: string;
    duration: number;
  }>({
    patient_id: '',
    doctor_id: '',
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
    if (!isEditMode && formData.doctor_id && formData.start_at) {
      const appointmentDate = formData.start_at.split('T')[0];
      loadAvailableTimeSlots(appointmentDate);
    } else {
      setTimeSlots([]);
    }
  }, [formData.doctor_id, formData.start_at?.split('T')[0]]);

  const loadSelections = async () => {
    try {
      const [patientsData, doctorsData] = await Promise.all([
        patientService.getAll(),
        doctorService.getAll(),
      ]);
      setPatients(patientsData.patients || []);
      setDoctors(doctorsData || []);
    } catch (error: any) {
      toast.error('Failed to load patients or doctors');
      setPatients([]);
      setDoctors([]);
    }
  };

  const loadAppointment = async (appointmentId: string) => {
    try {
      setLoadingData(true);
      const appointment = await appointmentService.getById(appointmentId);
      const start = new Date(appointment.start_at);
      const end = new Date(appointment.end_at);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      
      setFormData({
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        start_at: start.toISOString().slice(0, 16),
        end_at: end.toISOString().slice(0, 16),
        type: appointment.type,
        status: appointment.status,
        reservation_type: appointment.reservation_type || 'Clinic',
        notes: appointment.notes || '',
        duration: durationMinutes,
      });
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

    try {
      setLoading(true);

      if (isEditMode && id) {
        await appointmentService.update(id, formData);
        toast.success('Appointment updated successfully');
      } else {
        await appointmentService.create(formData);
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
                          onClick={() => {
                            setFormData({ ...formData, patient_id: patient.id });
                            setPatientSearch(`${patient.first_name} ${patient.last_name}`);
                            setShowPatientDropdown(false);
                            setErrors((prev) => ({ ...prev, patient_id: '' }));
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
                  if (e.target.value && !isEditMode) {
                    try {
                      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/calendars/doctor/${e.target.value}`, {
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
          {!isEditMode && formData.doctor_id && formData.start_at && (
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
                        const newStartAt = `${date}T${slot.time}`;
                        handleChange({ target: { name: 'start_at', value: newStartAt } } as any);
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time {!isEditMode && '(Select from slots above)'}
              </label>
              <input
                type="datetime-local"
                name="start_at"
                value={formData.start_at}
                onChange={handleChange}
                readOnly={!isEditMode}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !isEditMode ? 'bg-gray-50' : ''
                } ${errors.start_at ? 'border-red-500' : 'border-gray-300'}`}
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
                <option value="phone">Phone</option>
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
