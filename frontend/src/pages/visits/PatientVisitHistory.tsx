import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import visitService, { PatientVisitHistory as VisitHistoryType } from '../../services/visit.service';
import visitPaymentService, { VisitPayment } from '../../services/visit-payment.service';
import patientService, { Patient } from '../../services/patient.service';
import PaymentModal from '../../components/PaymentModal';
import { FiArrowLeft, FiPlus, FiCalendar, FiHeart, FiUser, FiEdit2, FiDollarSign, FiCheckCircle, FiTrash2 } from 'react-icons/fi';

const PatientVisitHistory = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visitHistory, setVisitHistory] = useState<VisitHistoryType[]>([]);
  const [payments, setPayments] = useState<VisitPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (patientId) {
      loadPatientData();
      loadVisitHistory();
      loadPayments();
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

  const loadPayments = async () => {
    if (!patientId) return;
    try {
      const result = await visitPaymentService.getPatientPayments(patientId);
      setPayments(result || []);
    } catch (error: any) {
      console.error('Error loading payments:', error);
      setPayments([]);
    }
  };

  const hasPayment = (visitId: string) => {
    return payments.some(p => p.visit_id === visitId);
  };

  const getPaymentForVisit = (visitId: string) => {
    return payments.find(p => p.visit_id === visitId);
  };

  const handleAddPayment = (visitId?: string) => {
    setSelectedVisitId(visitId);
    setIsPaymentModalOpen(true);
  };

  const handleDeleteVisit = async (visitId: string, visitDate: string) => {
    if (!window.confirm(`Are you sure you want to delete this visit from ${formatDate(visitDate)}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(visitId);
      await visitService.delete(visitId);
      toast.success('Visit deleted successfully');
      
      // Reload visit history
      await loadVisitHistory();
    } catch (error: any) {
      console.error('Error deleting visit:', error);
      toast.error(error.response?.data?.error || 'Failed to delete visit');
    } finally {
      setDeletingId(null);
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
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition"
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
                      {hasPayment(visit.id) ? (
                        <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
                          <FiCheckCircle size={14} />
                          Paid
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddPayment(visit.id)}
                          className="px-3 py-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded-full text-sm font-medium flex items-center gap-1 transition"
                        >
                          <FiDollarSign size={14} />
                          Add Payment
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/visits/${visit.id}/edit`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Visit"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteVisit(visit.id, visit.visit_date)}
                        disabled={deletingId === visit.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Visit"
                      >
                        {deletingId === visit.id ? (
                          <div className="animate-spin rounded-full h-[18px] w-[18px] border-b-2 border-red-600"></div>
                        ) : (
                          <FiTrash2 size={18} />
                        )}
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

                    {/* Payment Information */}
                    {hasPayment(visit.id) && (
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Payment:</p>
                        {(() => {
                          const payment = getPaymentForVisit(visit.id);
                          return payment ? (
                            <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div>
                                  <span className="text-xs text-gray-600">Amount:</span>
                                  <p className="font-semibold text-gray-900">EGP {Number(payment.amount).toFixed(2)}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-600">Method:</span>
                                  <p className="text-sm text-gray-900">{payment.method}</p>
                                </div>
                                {payment.created_by_name && (
                                  <div>
                                    <span className="text-xs text-gray-600">By:</span>
                                    <p className="text-sm text-gray-900">{payment.created_by_name}</p>
                                  </div>
                                )}
                              </div>
                              <FiCheckCircle className="text-green-600" size={20} />
                            </div>
                          ) : null;
                        })()}
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

      {/* Payment Modal */}
      {patient && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedVisitId(undefined);
          }}
          patientId={patient.id}
          patientName={`${patient.first_name} ${patient.last_name}`}
          preSelectedVisitId={selectedVisitId}
          onPaymentCreated={() => {
            loadPayments();
          }}
        />
      )}
    </div>
  );
};

export default PatientVisitHistory;
