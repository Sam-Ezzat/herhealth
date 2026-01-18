import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import patientService from '../../services/patient.service';
import { FiEdit2, FiTrash2, FiArrowLeft, FiPhone, FiMail, FiMapPin, FiUser, FiHeart } from 'react-icons/fi';

const PatientDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPatient(id);
    }
  }, [id]);

  const loadPatient = async (patientId: string) => {
    try {
      setLoading(true);
      const data = await patientService.getById(patientId);
      setPatient(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load patient');
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!patient || !id) return;
    
    if (!window.confirm(`Are you sure you want to delete ${patient.first_name} ${patient.last_name}?`)) {
      return;
    }

    try {
      await patientService.delete(id);
      toast.success('Patient deleted successfully');
      navigate('/patients');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete patient');
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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
          <p className="mt-4 text-gray-600">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <FiArrowLeft /> Back to Patients
        </Link>
        
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {patient.color_code_hex && (
              <div
                className="w-16 h-16 rounded-full border-4 border-gray-300 flex-shrink-0"
                style={{ backgroundColor: patient.color_code_hex }}
                title={patient.color_code_name}
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-gray-600 mt-1">
                {calculateAge(patient.date_of_birth)} years old • {patient.gender}
                {patient.color_code_name && ` • ${patient.color_code_name}`}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link
              to={`/patients/${id}/edit`}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <FiEdit2 /> Edit
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              <FiTrash2 /> Delete
            </button>
            {patient?.gender === 'Female' && (
              <Link
                to={`/patients/${id}/pregnancies`}
                className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition"
              >
                <FiHeart /> Pregnancy Journeys
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                <p className="mt-1 text-gray-900">{formatDate(patient.date_of_birth)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Blood Type</label>
                <p className="mt-1 text-gray-900">{patient.blood_type || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FiPhone className="text-gray-400" />
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{patient.phone}</p>
                </div>
              </div>
              {patient.email && (
                <div className="flex items-center gap-3">
                  <FiMail className="text-gray-400" />
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{patient.email}</p>
                  </div>
                </div>
              )}
              {patient.address && (
                <div className="flex items-center gap-3">
                  <FiMapPin className="text-gray-400" />
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-900">{patient.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Emergency Contact</h2>
              <div className="space-y-3">
                {patient.emergency_contact_name && (
                  <div className="flex items-center gap-3">
                    <FiUser className="text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-900">{patient.emergency_contact_name}</p>
                    </div>
                  </div>
                )}
                {patient.emergency_contact_phone && (
                  <div className="flex items-center gap-3">
                    <FiPhone className="text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{patient.emergency_contact_phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Medical Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Medical Information</h2>
            <div className="space-y-4">
              {patient.allergies && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Allergies</label>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-900">{patient.allergies}</p>
                  </div>
                </div>
              )}
              {patient.chronic_conditions && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Chronic Conditions</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-gray-900 whitespace-pre-wrap">{patient.chronic_conditions}</p>
                  </div>
                </div>
              )}
              {patient.current_medications && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Current Medications</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-gray-900 whitespace-pre-wrap">{patient.current_medications}</p>
                  </div>
                </div>
              )}
              {!patient.allergies && !patient.chronic_conditions && !patient.current_medications && (
                <p className="text-gray-500 italic">No medical information recorded</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Insurance Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Insurance</h2>
            {patient.insurance_provider || patient.insurance_number ? (
              <div className="space-y-3">
                {patient.insurance_provider && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Provider</label>
                    <p className="mt-1 text-gray-900">{patient.insurance_provider}</p>
                  </div>
                )}
                {patient.insurance_number && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Policy Number</label>
                    <p className="mt-1 text-gray-900">{patient.insurance_number}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">No insurance information</p>
            )}
          </div>

          {/* Record Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Record Info</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">Created</label>
                <p className="mt-1 text-gray-900 text-sm">{formatDate(patient.created_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-gray-900 text-sm">{formatDate(patient.updated_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Patient ID</label>
                <p className="mt-1 text-gray-900 text-sm font-mono">{patient.id}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Schedule Appointment
              </button>
              <button className="w-full text-left px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                View Visits
              </button>
              <button className="w-full text-left px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Add Clinical Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
