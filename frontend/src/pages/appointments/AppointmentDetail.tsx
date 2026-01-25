import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import appointmentService, { Appointment } from '../../services/appointment.service';
import { FiArrowLeft, FiEdit2, FiCalendar, FiClock, FiUser, FiFileText } from 'react-icons/fi';
import { formatTime, calculateDuration } from '../../utils/timeUtils';

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAppointment(id);
    }
  }, [id]);

  const loadAppointment = async (appointmentId: string) => {
    try {
      setLoading(true);
      const data = await appointmentService.getById(appointmentId);
      setAppointment(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load appointment');
      navigate('/appointments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-orange-100 text-orange-800';
      case 'no-answer': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading appointment...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/appointments"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <FiArrowLeft /> Back to Appointments
        </Link>
        <Link
          to={`/appointments/${appointment.id}/edit`}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition"
        >
          <FiEdit2 /> Edit Appointment
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{appointment.type}</h1>
              <p className="text-blue-100 mt-2 text-lg">{appointment.patient_name}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadgeColor(appointment.status)}`}>
              {appointment.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Appointment Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Appointment Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FiCalendar className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="text-gray-900 font-medium">{formatDate(appointment.start_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FiClock className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="text-gray-900 font-medium">
                      {formatTime(appointment.start_at)} - {formatTime(appointment.end_at)} ({calculateDuration(appointment.start_at, appointment.end_at)} minutes)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FiFileText className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="text-gray-900 font-medium">{appointment.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FiFileText className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Reservation Type</p>
                    <p className="text-gray-900 font-medium">{(appointment as any).reservation_type || 'Clinic'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient & Doctor Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Patient & Doctor</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FiUser className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Patient</p>
                    <p className="text-gray-900 font-medium">{appointment.patient_name}</p>
                    {appointment.patient_phone && (
                      <p className="text-sm text-gray-500">{appointment.patient_phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FiUser className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Doctor</p>
                    <p className="text-gray-900 font-medium">Dr. {appointment.doctor_name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            {appointment.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Notes</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{appointment.notes}</p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-2">
              {appointment.created_by_name && (
                <div className="text-sm">
                  <span className="text-gray-600">Appointment reserved by </span>
                  <span className="font-medium text-gray-900">{appointment.created_by_role || 'Staff'}</span>
                  <span className="text-gray-600">: </span>
                  <span className="font-medium text-gray-900">{appointment.created_by_name}</span>
                </div>
              )}
              <div className="text-sm text-gray-500">
                Created: {new Date(appointment.created_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetail;
