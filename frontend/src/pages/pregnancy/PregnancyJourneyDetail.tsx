import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import pregnancyJourneyService, { PregnancyJourney, PregnancyVisit } from '../../services/pregnancyJourney.service';
import { FiCalendar, FiHeart, FiActivity, FiFileText, FiEdit, FiCheckCircle, FiPlus } from 'react-icons/fi';

const PregnancyJourneyDetail = () => {
  const { patientId, pregnancyId } = useParams<{ patientId: string; pregnancyId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState<PregnancyJourney | null>(null);

  useEffect(() => {
    if (pregnancyId) {
      loadJourney();
    }
  }, [pregnancyId]);

  const loadJourney = async () => {
    try {
      setLoading(true);
      console.log('Loading pregnancy journey for ID:', pregnancyId);
      const data = await pregnancyJourneyService.getPregnancyJourney(pregnancyId!);
      console.log('Journey data received:', data);
      console.log('Number of visits:', data?.visits?.length || 0);
      setJourney(data);
    } catch (error: any) {
      console.error('Error loading journey:', error);
      toast.error(error.response?.data?.error || 'Failed to load pregnancy journey');
      navigate(`/patients/${patientId}/pregnancies`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getWeekLabel = (week: number) => {
    if (week < 13) return { text: 'First Trimester', color: 'text-green-600' };
    if (week < 27) return { text: 'Second Trimester', color: 'text-blue-600' };
    return { text: 'Third Trimester', color: 'text-purple-600' };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading pregnancy journey...</p>
        </div>
      </div>
    );
  }

  if (!journey) {
    return null;
  }

  const trimesterLabel = getWeekLabel(journey.current_week);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Pregnancy Journey #{journey.pregnancy_number}</h1>
            <p className="text-gray-600 mt-1">{journey.patient_name}</p>
          </div>
          <button
            onClick={() => navigate(`/patients/${patientId}/pregnancy/${pregnancyId}/edit`)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <FiEdit /> Edit Details
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <FiHeart />
            <span className="text-sm">Current Week</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{journey.current_week}</p>
          <p className={`text-sm ${trimesterLabel.color}`}>{trimesterLabel.text}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <FiCalendar />
            <span className="text-sm">LMP</span>
          </div>
          <p className="text-lg font-semibold">{formatDate(journey.lmp)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <FiCalendar />
            <span className="text-sm">EDD</span>
          </div>
          <p className="text-lg font-semibold">{formatDate(journey.edd)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <FiActivity />
            <span className="text-sm">Total Visits</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{journey.total_visits}</p>
        </div>
      </div>

      {/* GPAL Card */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Obstetric History (GPAL)</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Gravida</p>
            <p className="text-xl font-bold">{journey.gravida}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Para</p>
            <p className="text-xl font-bold">{journey.para}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Abortion</p>
            <p className="text-xl font-bold">{journey.abortion}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Living</p>
            <p className="text-xl font-bold">{journey.living}</p>
          </div>
        </div>
      </div>

      {/* Risk Flags */}
      {journey.risk_flags && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Risk Flags</h3>
          <p className="text-yellow-700">{journey.risk_flags}</p>
        </div>
      )}

      {/* Visits Timeline */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Visit Timeline</h2>
            <p className="text-gray-600 text-sm">Chronological record of prenatal visits ({journey.total_visits} total)</p>
          </div>
          <button
            onClick={() => navigate(`/visits/new?patientId=${patientId}&pregnancyId=${pregnancyId}`)}
            className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition"
          >
            <FiPlus /> Add Visit Note
          </button>
        </div>

        {journey.visits.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FiFileText className="mx-auto text-4xl mb-2" />
            <p className="mb-4">No visits recorded yet</p>
            <button
              onClick={() => navigate(`/visits/new?patientId=${patientId}&pregnancyId=${pregnancyId}`)}
              className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition"
            >
              <FiPlus /> Record First Visit
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {journey.visits.map((visit, index) => (
                <VisitCard key={visit.id} visit={visit} isLatest={index === journey.visits.length - 1} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => navigate(`/patients/${patientId}/pregnancies`)}
          className="text-blue-600 hover:text-blue-700"
        >
          ← Back to All Pregnancies
        </button>
        <button
          onClick={() => navigate(`/patients/${patientId}`)}
          className="text-blue-600 hover:text-blue-700"
        >
          ← Back to Patient
        </button>
      </div>
    </div>
  );
};

// Visit Card Component
const VisitCard = ({ visit, isLatest }: { visit: PregnancyVisit; isLatest: boolean }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`border-l-4 ${isLatest ? 'border-pink-500 bg-pink-50' : 'border-gray-300 bg-white'} rounded-r-lg p-4 mb-4 shadow-sm`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiCalendar className="text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-800">{formatDateTime(visit.visit_date)}</h3>
            {isLatest && (
              <span className="px-2 py-1 bg-pink-500 text-white text-xs rounded-full">Latest Visit</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="font-medium">Week {visit.pregnancy_week}</span>
            <span>•</span>
            <span>Dr. {visit.doctor_name}</span>
          </div>
        </div>
      </div>

      {/* OB Measurements */}
      {(visit.weight_kg || visit.bp_systolic || visit.fundal_height_cm || visit.fetal_heart_rate) && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Measurements</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {visit.weight_kg && (
              <div>
                <p className="text-gray-500">Weight</p>
                <p className="font-medium">{visit.weight_kg} kg</p>
              </div>
            )}
            {visit.bp_systolic && visit.bp_diastolic && (
              <div>
                <p className="text-gray-500">Blood Pressure</p>
                <p className="font-medium">{visit.bp_systolic}/{visit.bp_diastolic}</p>
              </div>
            )}
            {visit.fundal_height_cm && (
              <div>
                <p className="text-gray-500">Fundal Height</p>
                <p className="font-medium">{visit.fundal_height_cm} cm</p>
              </div>
            )}
            {visit.fetal_heart_rate && (
              <div>
                <p className="text-gray-500">FHR</p>
                <p className="font-medium">{visit.fetal_heart_rate}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pregnancy Notes */}
      {visit.pregnancy_notes && (
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Pregnancy Notes</h4>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{visit.pregnancy_notes}</p>
        </div>
      )}

      {/* Clinical Notes */}
      {visit.clinical_notes && (
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Clinical Notes</h4>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{visit.clinical_notes}</p>
        </div>
      )}

      {/* Diagnosis */}
      {visit.diagnosis && (
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Diagnosis</h4>
          <p className="text-gray-700 text-sm">{visit.diagnosis}</p>
        </div>
      )}

      {/* Treatment Plan */}
      {visit.treatment_plan && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Treatment Plan</h4>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{visit.treatment_plan}</p>
        </div>
      )}

      {/* OB Notes */}
      {visit.ob_notes && (
        <div className="mt-3 bg-blue-50 rounded p-3">
          <h4 className="text-sm font-semibold text-blue-800 mb-1">OB Specific Notes</h4>
          <p className="text-blue-700 text-sm whitespace-pre-wrap">{visit.ob_notes}</p>
        </div>
      )}
    </div>
  );
};

export default PregnancyJourneyDetail;
