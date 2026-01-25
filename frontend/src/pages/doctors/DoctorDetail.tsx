import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import doctorService, { Doctor } from '../../services/doctor.service';
import { FiArrowLeft, FiEdit2, FiMail, FiPhone } from 'react-icons/fi';

const DoctorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadDoctor(id);
    }
  }, [id]);

  const loadDoctor = async (doctorId: string) => {
    try {
      setLoading(true);
      const data = await doctorService.getById(doctorId);
      setDoctor(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load doctor');
      navigate('/doctors');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading doctor...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/doctors"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <FiArrowLeft /> Back to Doctors
        </Link>
        <Link
          to={`/doctors/${doctor.id}/edit`}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition"
        >
          <FiEdit2 /> Edit Doctor
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8 text-white">
          <h1 className="text-3xl font-bold">
            Dr. {doctor.first_name} {doctor.last_name}
          </h1>
          <p className="text-blue-100 mt-2 text-lg">{doctor.specialty}</p>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FiPhone className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-gray-900 font-medium">{doctor.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FiMail className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-gray-900 font-medium">{doctor.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Joined</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(doctor.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {doctor.user_full_name && (
                  <div>
                    <p className="text-sm text-gray-600">User Account</p>
                    <p className="text-gray-900 font-medium">{doctor.user_full_name}</p>
                    <p className="text-sm text-gray-500">@{doctor.username}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetail;
