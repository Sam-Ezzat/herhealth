import { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiUser, FiPhone } from 'react-icons/fi';
import api from '../services/api';
import { toast } from 'react-toastify';
import { parseTimeSlot, createAppointmentDateTime, calculateEndTime } from '../utils/timeUtils';

interface QuickAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialty?: string;
}

interface ColorCode {
  id: number;
  color_name: string;
  color_hex: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  is_blocked?: boolean;
  block_reason?: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  color_code_id?: number;
  color_code_name?: string;
  color_code_hex?: string;
}

const QuickAppointmentModal = ({ isOpen, onClose, onSuccess }: QuickAppointmentModalProps) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'Female',
    phone: '',
    color_code_id: '',
    doctor_id: '',
    calendar_id: '',
    appointment_date: '',
    appointment_time: '',
    duration: '30',
    reservation_type: 'Clinic',
    notes: ''
  });

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [colorCodes, setColorCodes] = useState<ColorCode[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [matchingPatients, setMatchingPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
  const [doctorCalendars, setDoctorCalendars] = useState<any[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDoctors();
      loadColorCodes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.doctor_id && formData.appointment_date) {
      // If multiple calendars exist, wait for calendar selection
      if (doctorCalendars.length > 1 && !formData.calendar_id) {
        setTimeSlots([]);
        return;
      }
      loadAvailableTimeSlots();
    } else {
      setTimeSlots([]);
    }
  }, [formData.doctor_id, formData.calendar_id, formData.appointment_date, doctorCalendars.length]);

  useEffect(() => {
    // Debounced patient search
    const searchTerm = formData.first_name || formData.last_name || formData.phone;
    if (searchTerm && searchTerm.length >= 2 && !selectedPatient) {
      const timer = setTimeout(() => {
        searchPatients(searchTerm);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setMatchingPatients([]);
      setShowPatientSuggestions(false);
    }
  }, [formData.first_name, formData.last_name, formData.phone, selectedPatient]);

  const loadDoctors = async () => {
    try {
      const response: any = await api.get('/doctors');
      const doctorsList = response.data || response;
      setDoctors(Array.isArray(doctorsList) ? doctorsList : []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error('Failed to load doctors');
    }
  };

  const loadColorCodes = async () => {
    try {
      const response: any = await api.get('/patients/color-codes');
      const colorCodesList = response.data || response;
      setColorCodes(Array.isArray(colorCodesList) ? colorCodesList : []);
    } catch (error) {
      console.error('Error loading color codes:', error);
      toast.error('Failed to load color codes');
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

  const searchPatients = async (searchTerm: string) => {
    setSearchingPatients(true);
    try {
      const response: any = await api.get('/patients', { search: searchTerm, limit: 5 });
      const data = response.data || response;
      const patients = data.patients || data;
      
      if (Array.isArray(patients) && patients.length > 0) {
        setMatchingPatients(patients);
        setShowPatientSuggestions(true);
      } else {
        setMatchingPatients([]);
        setShowPatientSuggestions(false);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setMatchingPatients([]);
      setShowPatientSuggestions(false);
    } finally {
      setSearchingPatients(false);
    }
  };

  const selectExistingPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    
    // Format date of birth to YYYY-MM-DD for input field
    let formattedDOB = '';
    if (patient.date_of_birth) {
      const date = new Date(patient.date_of_birth);
      if (!isNaN(date.getTime())) {
        formattedDOB = date.toISOString().split('T')[0];
      }
    }
    
    setFormData(prev => ({
      ...prev,
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: formattedDOB,
      phone: patient.phone,
      color_code_id: patient.color_code_id ? patient.color_code_id.toString() : '',
      gender: patient.gender || 'Female'
    }));
    setShowPatientSuggestions(false);
    setMatchingPatients([]);
    toast.info(`Using existing patient: ${patient.first_name} ${patient.last_name}`);
  };

  const clearPatientSelection = () => {
    setSelectedPatient(null);
    toast.info('Creating new patient record');
  };

  const loadAvailableTimeSlots = async () => {
    setLoadingSlots(true);
    try {
      // Use the backend API that checks for calendar blocks
      let queryString = `doctorId=${formData.doctor_id}&date=${formData.appointment_date}`;
      
      if (formData.calendar_id) {
        queryString += `&calendarId=${formData.calendar_id}`;
      }
      
      const response = await api.get(`/calendars/available-slots?${queryString}`);
      const slotsData = response.data?.data || response.data;
      
      if (!slotsData.available) {
        setTimeSlots([]);
        if (slotsData.reason) {
          toast.info('This day is marked as closed (weekend/holiday) for this doctor');
        }
        setLoadingSlots(false);
        return;
      }
      
      // Map backend slots to frontend format
      const slots: TimeSlot[] = (slotsData.slots || []).map((slot: any) => {
        const time = parseTimeSlot(slot.start_time);
        
        return {
          time,
          available: slot.available && !slot.is_blocked,
          is_blocked: slot.is_blocked,
          block_reason: slot.block_reason,
        };
      });
      
      setTimeSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      toast.error('Failed to load time slots');
      setTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear selected patient if user modifies name or phone
    if ((name === 'first_name' || name === 'last_name' || name === 'phone') && selectedPatient) {
      setSelectedPatient(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.phone || 
        !formData.doctor_id || !formData.appointment_date || !formData.appointment_time) {
      toast.error('Please fill all required fields');
      return;
    }

    // Check if the selected time slot is blocked
    const selectedSlot = timeSlots.find(slot => slot.time === formData.appointment_time);
    if (selectedSlot && selectedSlot.is_blocked) {
      toast.error(`Cannot schedule appointment: ${selectedSlot.block_reason || 'Time is blocked'}`);
      return;
    }

    setSubmitting(true);
    try {
      let patientId: string;
      
      // Use existing patient if selected, otherwise create new
      if (selectedPatient) {
        patientId = selectedPatient.id;
        console.log('Using existing patient:', selectedPatient.first_name, selectedPatient.last_name);
      } else {
        // Create new patient
        const patientData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender,
          phone: formData.phone,
          color_code_id: formData.color_code_id ? parseInt(formData.color_code_id) : null
        };
        
        const patientResponse: any = await api.post('/patients', patientData);
        const patient = patientResponse.data || patientResponse;
        patientId = patient.id;
        console.log('Created new patient:', patient.first_name, patient.last_name);
      }
      
      // Create appointment
      const startAt = createAppointmentDateTime(formData.appointment_date, formData.appointment_time);
      const endAt = calculateEndTime(startAt, parseInt(formData.duration));
      
      const appointmentData = {
        patient_id: patientId,
        doctor_id: formData.doctor_id,
        calendar_id: formData.calendar_id || undefined,
        start_at: startAt,
        end_at: endAt,
        type: 'Walk-in Appointment',
        status: 'scheduled',
        notes: formData.notes
      };
      
      await api.post('/appointments', appointmentData);
      
      toast.success('Quick appointment created successfully!');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast.error(error.response?.data?.error || 'Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'Female',
      phone: '',
      color_code_id: '',
      doctor_id: '',
      calendar_id: '',
      appointment_date: '',
      appointment_time: '',
      duration: '30',
      reservation_type: 'Clinic',
      notes: ''
    });
    setTimeSlots([]);
    setMatchingPatients([]);
    setSelectedPatient(null);
    setShowPatientSuggestions(false);
    setSearchingPatients(false);
    setDoctorCalendars([]);
    onClose();
  };

  if (!isOpen) return null;

  const selectedColorCode = Array.isArray(colorCodes) 
    ? colorCodes.find(c => c.id === parseInt(formData.color_code_id))
    : undefined;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiCalendar size={28} />
            <h2 className="text-2xl font-bold">Quick Appointment</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiUser className="text-blue-600" />
              Patient Information
              {selectedPatient && (
                <span className="text-sm font-normal text-green-600 flex items-center gap-1">
                  ✓ Using existing patient
                  <button
                    type="button"
                    onClick={clearPatientSelection}
                    className="ml-2 text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    Create new instead
                  </button>
                </span>
              )}
            </h3>

            {/* Patient Suggestions Dropdown */}
            {showPatientSuggestions && matchingPatients.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  Found {matchingPatients.length} existing patient{matchingPatients.length > 1 ? 's' : ''}:
                </p>
                <div className="space-y-2">
                  {matchingPatients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => selectExistingPatient(patient)}
                      className="w-full text-left p-3 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-gray-800">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {patient.phone}
                          {patient.date_of_birth && ` • DOB: ${new Date(patient.date_of_birth).toLocaleDateString()}`}
                        </div>
                        {patient.color_code_name && (
                          <div className="flex items-center gap-2 mt-1">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: patient.color_code_hex }}
                            />
                            <span className="text-xs text-gray-500">{patient.color_code_name}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-blue-600 font-medium">Select</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Code
                </label>
                <select
                  name="color_code_id"
                  value={formData.color_code_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select color code</option>
                  {Array.isArray(colorCodes) && colorCodes.length > 0 ? (
                    colorCodes.map((code) => (
                      <option key={code.id} value={code.id}>
                        {code.color_name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Loading...</option>
                  )}
                </select>
                {selectedColorCode && (
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border-2 border-gray-300"
                      style={{ backgroundColor: selectedColorCode.color_hex }}
                    />
                    <span className="text-sm text-gray-600">{selectedColorCode.color_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiCalendar className="text-blue-600" />
              Appointment Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor <span className="text-red-500">*</span>
                </label>
                <select
                  name="doctor_id"
                  value={formData.doctor_id}
                  onChange={(e) => {
                    const newDoctorId = e.target.value;
                    setFormData(prev => ({ ...prev, doctor_id: newDoctorId, calendar_id: '' }));
                    setTimeSlots([]);
                    if (newDoctorId) {
                      loadDoctorCalendars(newDoctorId);
                    } else {
                      setDoctorCalendars([]);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a doctor</option>
                  {Array.isArray(doctors) && doctors.length > 0 ? (
                    doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.first_name} {doctor.last_name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Loading...</option>
                  )}
                </select>
              </div>

              {/* Calendar Selection - Show only if doctor has multiple calendars */}
              {formData.doctor_id && doctorCalendars.length > 0 && (
                <div className="md:col-span-2">
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
                        setFormData(prev => ({ ...prev, calendar_id: e.target.value }));
                        setTimeSlots([]);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={doctorCalendars.length > 1}
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
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="appointment_date"
                  value={formData.appointment_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
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
                  required
                >
                  <option value="Clinic">Clinic</option>
                  <option value="samar_phone">Samar Phone</option>
                  <option value="Habiba_phone">Habiba Phone</option>
                  <option value="Doctor">Doctor</option>
                  <option value="website">Website</option>
                </select>
              </div>
            </div>
          </div>

          {/* Time Slots */}
          {formData.doctor_id && formData.appointment_date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Available Time Slots <span className="text-red-500">*</span>
              </label>
              
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {timeSlots.map((slot) => {
                    const isBlocked = slot.is_blocked;
                    const blockReason = slot.block_reason;
                    
                    return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, appointment_time: slot.time }))}
                      disabled={!slot.available || isBlocked}
                      title={isBlocked ? `Blocked: ${blockReason || 'Time unavailable'}` : (slot.available ? 'Available' : 'Booked')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        formData.appointment_time === slot.time
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white ring-2 ring-purple-500 ring-offset-2'
                          : isBlocked
                          ? 'bg-red-100 text-red-400 cursor-not-allowed line-through'
                          : slot.available
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isBlocked && '🚫 '}{slot.time}
                    </button>
                  )})}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAppointmentModal;
