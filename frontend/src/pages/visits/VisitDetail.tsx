import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import visitService, { Visit } from '../../services/visit.service';
import visitPaymentService, { VisitPayment } from '../../services/visit-payment.service';
import PaymentModal from '../../components/PaymentModal';
import { FiArrowLeft, FiEdit2, FiTrash2, FiCalendar, FiUser, FiFileText, FiHeart, FiDollarSign, FiCheckCircle } from 'react-icons/fi';

const VisitDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [payment, setPayment] = useState<VisitPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadVisit();
      loadPayment();
    }
  }, [id]);

  const loadVisit = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const result = await visitService.getById(id);
      setVisit(result);
    } catch (error: any) {
      toast.error('Failed to load visit');
      navigate('/visits');
    } finally {
      setLoading(false);
    }
  };

  const loadPayment = async () => {
    if (!id) return;
    try {
      const result = await visitPaymentService.getByVisitId(id);
      setPayment(result);
    } catch (error: any) {
      console.error('Error loading payment:', error);
      setPayment(null);
    }
  };

  const handleDelete = async () => {
    if (!id || !visit) return;
    if (!window.confirm(`Are you sure you want to delete this visit for ${visit.patient_name}?`)) {
      return;
    }

    try {
      await visitService.delete(id);
      toast.success('Visit deleted successfully');
      navigate('/visits');
    } catch (error: any) {
      toast.error('Failed to delete visit');
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
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading visit...</p>
        </div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Visit not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/visits')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FiArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Visit Details</h1>
              <p className="text-gray-600 mt-1">View visit information</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/visits/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition"
            >
              <FiEdit2 /> Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <FiTrash2 /> Delete
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Patient and Doctor Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FiUser className="text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-800">Patient</h3>
              </div>
              <p className="text-gray-900 font-medium">{visit.patient_name}</p>
              {visit.patient_phone && (
                <p className="text-gray-600 text-sm">{visit.patient_phone}</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <FiUser className="text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-800">Doctor</h3>
              </div>
              <p className="text-gray-900 font-medium">Dr. {visit.doctor_name}</p>
            </div>
          </div>

          {/* Visit Date */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FiCalendar className="text-blue-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-800">Visit Date</h3>
            </div>
            <p className="text-gray-900">{formatDate(visit.visit_date)}</p>
          </div>

          {/* Reason */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FiFileText className="text-blue-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-800">Reason for Visit</h3>
            </div>
            <p className="text-gray-900 whitespace-pre-wrap">{visit.reason}</p>
          </div>

          {/* Clinical Notes */}
          {visit.clinical_notes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Clinical Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{visit.clinical_notes}</p>
              </div>
            </div>
          )}

          {/* Diagnosis */}
          {visit.diagnosis && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Diagnosis</h3>
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
                <p className="text-gray-900">{visit.diagnosis}</p>
              </div>
            </div>
          )}

          {/* Treatment Plan */}
          {visit.treatment_plan && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Treatment Plan</h3>
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
                <p className="text-gray-900 whitespace-pre-wrap">{visit.treatment_plan}</p>
              </div>
            </div>
          )}

          {/* Pregnancy Information */}
          {(visit.pregnancy_id || visit.pregnancy_notes || visit.pregnancy_week) && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FiHeart className="text-pink-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-800">Pregnancy Information</h3>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg space-y-3">
                {visit.pregnancy_week && (
                  <div>
                    <span className="font-medium text-gray-700">Pregnancy Week:</span>
                    <span className="ml-2 text-gray-900">Week {visit.pregnancy_week}</span>
                  </div>
                )}
                {visit.pregnancy_notes && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Pregnancy Notes:</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{visit.pregnancy_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiDollarSign className="text-green-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-800">Payment Information</h3>
              </div>
              {!payment && (
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm"
                >
                  <FiDollarSign />
                  Add Payment
                </button>
              )}
            </div>
            {payment ? (
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600 space-y-3">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <FiCheckCircle />
                  Payment Recorded
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Amount:</span>
                    <p className="font-semibold text-gray-900">EGP {Number(payment.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Method:</span>
                    <p className="font-semibold text-gray-900">{payment.method}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Payment Date:</span>
                    <p className="text-gray-900">{formatDate(payment.payment_date)}</p>
                  </div>
                  {payment.created_by_name && (
                    <div>
                      <span className="text-sm text-gray-600">Recorded By:</span>
                      <p className="text-gray-900">{payment.created_by_name}</p>
                    </div>
                  )}
                </div>
                {payment.notes && (
                  <div className="pt-3 border-t border-green-200">
                    <span className="text-sm text-gray-600">Notes:</span>
                    <p className="text-gray-900 mt-1">{payment.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                <p className="text-yellow-800">
                  <strong>No payment recorded for this visit.</strong>
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Click "Add Payment" to record payment information.
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Created:</span> {formatDate(visit.created_at)}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {formatDate(visit.updated_at)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {visit && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          patientId={visit.patient_id}
          patientName={visit.patient_name || 'Unknown Patient'}
          preSelectedVisitId={visit.id}
          onPaymentCreated={() => {
            loadPayment();
          }}
        />
      )}
    </div>
  );
};

export default VisitDetail;
