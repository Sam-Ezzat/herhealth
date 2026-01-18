import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import pregnancyJourneyService, { Pregnancy } from '../../services/pregnancyJourney.service';
import patientService from '../../services/patient.service';
import { FiPlus, FiCalendar, FiHeart, FiCheckCircle, FiAlertCircle, FiEdit } from 'react-icons/fi';

const PregnancyJourneyList = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);
  const [patientName, setPatientName] = useState('');

  useEffect(() => {
    if (patientId) {
      loadData();
    }
  }, [patientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading pregnancies for patient:', patientId);
      const [pregnanciesData, patientData] = await Promise.all([
        pregnancyJourneyService.getPatientPregnancies(patientId!),
        patientService.getById(patientId!),
      ]);
      console.log('Pregnancies data received:', pregnanciesData);
      console.log('Number of pregnancies:', pregnanciesData?.length || 0);
      setPregnancies(pregnanciesData || []);
      setPatientName(`${patientData.first_name} ${patientData.last_name}`);
    } catch (error: any) {
      console.error('Error loading pregnancy data:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to load pregnancy data');
      setPregnancies([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'delivered':
      case 'completed': // Handle legacy status
        return 'bg-blue-100 text-blue-800';
      case 'terminated':
        return 'bg-gray-100 text-gray-800';
      case 'miscarriage':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FiHeart className="text-green-600" />;
      case 'delivered':
        return <FiCheckCircle className="text-blue-600" />;
      default:
        return <FiAlertCircle className="text-gray-600" />;
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
          <p className="mt-4 text-gray-600">Loading pregnancy data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Pregnancy Journeys</h1>
          <p className="text-gray-600 mt-1">Patient: {patientName}</p>
        </div>
        <button
          onClick={() => navigate(`/patients/${patientId}/pregnancy/new`)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus /> New Pregnancy
        </button>
      </div>

      {/* Pregnancies List */}
      {!pregnancies || pregnancies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FiCalendar className="mx-auto text-gray-400 text-5xl mb-4" />
          <p className="text-gray-600 mb-4">No pregnancy records found</p>
          <p className="text-xs text-gray-500">Debug: pregnancies = {JSON.stringify(pregnancies)}</p>
          <button
            onClick={() => navigate(`/patients/${patientId}/pregnancy/new`)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <FiPlus /> Add First Pregnancy
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pregnancies.map((pregnancy) => (
            <div
              key={pregnancy.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
              onClick={() => navigate(`/patients/${patientId}/pregnancy/${pregnancy.id}`)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(pregnancy.status)}
                    <h3 className="text-xl font-semibold text-gray-800">
                      Pregnancy #{pregnancy.pregnancy_number}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/patients/${patientId}/pregnancy/${pregnancy.id}/edit`);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit pregnancy"
                    >
                      <FiEdit />
                    </button>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pregnancy.status)}`}>
                      {pregnancy.status.charAt(0).toUpperCase() + pregnancy.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">LMP</p>
                    <p className="font-medium">{formatDate(pregnancy.lmp)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">EDD</p>
                    <p className="font-medium">{formatDate(pregnancy.edd)}</p>
                  </div>
                </div>

                {/* Current Week (for active pregnancies) */}
                {pregnancy.status === 'active' && pregnancy.current_week !== undefined && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Current Week</p>
                    <p className="text-2xl font-bold text-blue-600">{pregnancy.current_week} weeks</p>
                  </div>
                )}

                {/* GPAL */}
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">G:</span>
                    <span className="font-medium ml-1">{pregnancy.gravida}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">P:</span>
                    <span className="font-medium ml-1">{pregnancy.para}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">A:</span>
                    <span className="font-medium ml-1">{pregnancy.abortion}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">L:</span>
                    <span className="font-medium ml-1">{pregnancy.living}</span>
                  </div>
                </div>

                {/* Delivery Info (for delivered pregnancies) */}
                {pregnancy.status === 'delivered' && pregnancy.delivery_date && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">Delivered</p>
                    <p className="font-medium">{formatDate(pregnancy.delivery_date)}</p>
                    {pregnancy.delivery_type && (
                      <p className="text-sm text-gray-600">{pregnancy.delivery_type}</p>
                    )}
                    {pregnancy.baby_weight_kg && (
                      <p className="text-sm text-gray-600">Weight: {pregnancy.baby_weight_kg} kg</p>
                    )}
                  </div>
                )}

                {/* Risk Flags */}
                {pregnancy.risk_flags && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">Risk Flags</p>
                    <p className="text-sm text-yellow-700">{pregnancy.risk_flags}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Back Button */}
      <div className="mt-6">
        <button
          onClick={() => navigate(`/patients/${patientId}`)}
          className="text-blue-600 hover:text-blue-700"
        >
          ← Back to Patient Details
        </button>
      </div>
    </div>
  );
};

export default PregnancyJourneyList;
