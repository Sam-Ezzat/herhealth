import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import visitService, { PatientVisitSummary } from '../../services/visit.service';
import { FiSearch, FiPlus, FiCalendar, FiFileText, FiHeart, FiUser } from 'react-icons/fi';

const VisitList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [patientSummaries, setPatientSummaries] = useState<PatientVisitSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPatientSummaries();
  }, [search, location.key]);

  const loadPatientSummaries = async () => {
    try {
      setLoading(true);
      const result = await visitService.getPatientSummaries(search || undefined);
      setPatientSummaries(result || []);
    } catch (error: any) {
      console.error('Error loading patient summaries:', error);
      toast.error(error.response?.data?.error || 'Failed to load patient visit records');
      setPatientSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPregnancyWeekText = (week?: number) => {
    if (!week) return 'N/A';
    const weeks = Math.floor(week);
    const days = Math.round((week - weeks) * 7);
    return `${weeks}w ${days}d`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Patient Pregnancy Journey</h1>
          <p className="text-gray-600 mt-1">Track patient visits and pregnancy progress</p>
        </div>
        <Link
          to="/visits/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus /> Add Visit
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Patient Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading patient records...</p>
          </div>
        ) : !patientSummaries || patientSummaries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600">No patient visit records found</p>
          </div>
        ) : (
          patientSummaries.map((summary) => (
            <div
              key={summary.patient_id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/visits/patient/${summary.patient_id}/history`)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  {/* Patient Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FiUser className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {summary.patient_name}
                        </h3>
                        {summary.patient_phone && (
                          <p className="text-sm text-gray-500">{summary.patient_phone}</p>
                        )}
                      </div>
                    </div>

                    {/* Pregnancy Info */}
                    {summary.pregnancy_id && summary.pregnancy_status === 'active' && (
                      <div className="flex items-center gap-2 mb-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                        <FiHeart className="text-pink-600" size={18} />
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium text-pink-900">
                            Week: {getPregnancyWeekText(summary.current_pregnancy_week)}
                          </span>
                          {summary.edd && (
                            <span className="text-pink-700">
                              EDD: {formatDate(summary.edd)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Last Visit Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <FiCalendar size={16} />
                          <span className="font-medium">Last Visit:</span>
                        </div>
                        <p className="text-gray-900 ml-6">
                          {formatDate(summary.last_visit_date)}
                        </p>
                        {summary.last_doctor_name && (
                          <p className="text-sm text-gray-600 ml-6">
                            Dr. {summary.last_doctor_name}
                          </p>
                        )}
                      </div>

                      <div>
                        {summary.last_diagnosis && (
                          <>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <FiFileText size={16} />
                              <span className="font-medium">Last Diagnosis:</span>
                            </div>
                            <p className="text-gray-900 ml-6 line-clamp-2">
                              {summary.last_diagnosis}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Last Notes */}
                    {summary.last_visit_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-1">Last Notes:</p>
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {summary.last_visit_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Visit Count Badge */}
                  <div className="ml-4 flex flex-col items-center">
                    <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{summary.total_visits}</div>
                        <div className="text-xs">visits</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/visits/patient/${summary.patient_id}/history`);
                      }}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View History
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VisitList;
