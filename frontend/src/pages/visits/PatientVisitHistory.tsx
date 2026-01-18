import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import visitService, { PatientVisitHistory as VisitHistoryType } from '../../services/visit.service';
import patientService, { Patient } from '../../services/patient.service';
import { FiArrowLeft, FiPlus, FiCalendar, FiHeart, FiUser, FiEdit2 } from 'react-icons/fi';

const PatientVisitHistory = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visitHistory, setVisitHistory] = useState<VisitHistoryType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      loadPatientData();
      loadVisitHistory();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    if (!patientId) return;
    try {
      const result = await patientService.getById(patientId);
      setPatient(result);
    } catch (error: any) {
      console.error('Error loading patient:', error);
      toast.error('Failed to load patient information');
    }
  };

  const loadVisitHistory = async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      const result = await visitService.getPatientHistory(patientId);
      setVisitHistory(result || []);
    } catch (error: any) {
      console.error('Error loading visit history:', error);
      toast.error(error.response?.data?.error || 'Failed to load visit history');
      setVisitHistory([]);
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

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPregnancyWeekText = (week?: number) => {
    if (!week) return null;
    const weeks = Math.floor(week);
    const days = Math.round((week - weeks) * 7);
    return `Week ${weeks}+${days}`;
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/visits')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <FiArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {patient ? `${patient.first_name} ${patient.last_name}'s Visit History` : 'Patient Visit History'}
              </h1>
              <p className="text-gray-600 mt-1">Complete pregnancy journey and visit records</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/visits/new?patientId=${patientId}`)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <FiPlus /> Add Visit
          </button>
        </div>

        {/* Patient Info Card */}
        {patient && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiUser className="text-blue-600" size={32} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-800">
                  {patient.first_name} {patient.last_name}
                </h2>
                <div className="flex gap-4 text-sm text-gray-600 mt-1">
                  {patient.phone && <span>📞 {patient.phone}</span>}
                  {patient.date_of_birth && (
                    <span>🎂 {formatShortDate(patient.date_of_birth)}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{visitHistory.length}</div>
                <div className="text-sm text-gray-600">Total Visits</div>
              </div>
            </div>
          </div>
        )}

        {/* Visit Timeline */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading visit history...</p>
          </div>
        ) : visitHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600">No visits found for this patient</p>
            <button
              onClick={() => navigate(`/visits/new?patientId=${patientId}`)}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Add First Visit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {visitHistory.map((visit, index) => (
              <div
                key={visit.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  {/* Visit Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {visitHistory.length - index}
                        </div>
                        {index < visitHistory.length - 1 && (
                          <div className="w-0.5 h-8 bg-blue-300 mt-2"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg">
                          <FiCalendar size={20} />
                          {formatDate(visit.visit_date)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Dr. {visit.doctor_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {visit.pregnancy_week && (
                        <div className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium flex items-center gap-1">
                          <FiHeart size={14} />
                          {getPregnancyWeekText(visit.pregnancy_week)}
                        </div>
                      )}
                      <button
                        onClick={() => navigate(`/visits/${visit.id}/edit`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Visit"
                      >
                        <FiEdit2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Visit Details */}
                  <div className="ml-16 space-y-3">
                    {/* Reason */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Reason for Visit:</p>
                      <p className="text-gray-900">{visit.reason}</p>
                    </div>

                    {/* Clinical Notes */}
                    {visit.clinical_notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Clinical Notes:</p>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-900 whitespace-pre-wrap">{visit.clinical_notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Pregnancy Notes */}
                    {visit.pregnancy_notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                          <FiHeart className="text-pink-600" size={16} />
                          Pregnancy Notes:
                        </p>
                        <div className="bg-pink-50 p-3 rounded-lg border-l-4 border-pink-400">
                          <p className="text-gray-900 whitespace-pre-wrap">{visit.pregnancy_notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Diagnosis */}
                    {visit.diagnosis && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Diagnosis:</p>
                        <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                          <p className="text-gray-900">{visit.diagnosis}</p>
                        </div>
                      </div>
                    )}

                    {/* Treatment Plan */}
                    {visit.treatment_plan && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Treatment Plan:</p>
                        <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                          <p className="text-gray-900 whitespace-pre-wrap">{visit.treatment_plan}</p>
                        </div>
                      </div>
                    )}

                    {/* View Full Details Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => navigate(`/visits/${visit.id}`)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Full Details →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientVisitHistory;
