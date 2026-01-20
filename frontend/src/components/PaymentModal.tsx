import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import visitPaymentService, {
  PaymentMethod,
  UnpaidVisit,
  CreateVisitPaymentData,
} from '../services/visit-payment.service';
import { FiX, FiDollarSign, FiCalendar, FiUser } from 'react-icons/fi';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  preSelectedVisitId?: string;
  onPaymentCreated?: () => void;
}

const PaymentModal = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  preSelectedVisitId,
  onPaymentCreated,
}: PaymentModalProps) => {
  const [unpaidVisits, setUnpaidVisits] = useState<UnpaidVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CreateVisitPaymentData>({
    visit_id: preSelectedVisitId || '',
    patient_id: patientId,
    amount: 0,
    method: 'Cash',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadUnpaidVisits();
      if (preSelectedVisitId) {
        setFormData((prev: CreateVisitPaymentData) => ({ ...prev, visit_id: preSelectedVisitId }));
      }
    }
  }, [isOpen, patientId, preSelectedVisitId]);

  useEffect(() => {
    // Auto-set amount to 0 for ReConsultation
    if (formData.method === 'ReConsultation') {
      setFormData((prev: CreateVisitPaymentData) => ({ ...prev, amount: 0 }));
    }
  }, [formData.method]);

  const loadUnpaidVisits = async () => {
    try {
      setLoading(true);
      const visits = await visitPaymentService.getUnpaidVisits(patientId);
      setUnpaidVisits(visits);
      
      // If no visits available
      if (visits.length === 0 && !preSelectedVisitId) {
        toast.info('No unpaid visits found for this patient');
      }
    } catch (error: any) {
      console.error('Error loading unpaid visits:', error);
      toast.error('Failed to load unpaid visits');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.visit_id) {
      toast.error('Please select a visit');
      return;
    }

    if (formData.amount < 0) {
      toast.error('Amount cannot be negative');
      return;
    }

    try {
      setSubmitting(true);
      await visitPaymentService.create(formData);
      toast.success('Payment recorded successfully!');
      
      if (onPaymentCreated) {
        onPaymentCreated();
      }
      
      handleClose();
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error(error.response?.data?.error || 'Failed to create payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      visit_id: '',
      patient_id: patientId,
      amount: 0,
      method: 'Cash',
      notes: '',
    });
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiDollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add Payment</h2>
                <p className="text-sm text-gray-600 mt-1">
                  <FiUser className="inline mr-1" />
                  Patient: <span className="font-medium">{patientName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading visits...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visit Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Visit <span className="text-red-500">*</span>
                  </label>
                  {preSelectedVisitId ? (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Pre-selected visit from current page
                      </p>
                    </div>
                  ) : unpaidVisits.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        No unpaid visits found for this patient. All visits have been paid.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={formData.visit_id}
                      onChange={(e) =>
                        setFormData({ ...formData, visit_id: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">-- Select a visit --</option>
                      {unpaidVisits.map((visit) => (
                        <option key={visit.id} value={visit.id}>
                          {formatDate(visit.visit_date)} - {visit.reason}
                          {visit.diagnosis && ` (${visit.diagnosis})`} - Dr. {visit.doctor_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.method}
                    onChange={(e) =>
                      setFormData({ ...formData, method: e.target.value as PaymentMethod })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="Instapay">Instapay</option>
                    <option value="No Payment">No Payment</option>
                    <option value="ReConsultation">ReConsultation (Free)</option>
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      EGP
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                      }
                      disabled={formData.method === 'ReConsultation'}
                      className="w-full pl-16 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  {formData.method === 'ReConsultation' && (
                    <p className="mt-1 text-sm text-gray-500">
                      ReConsultation visits default to 0. You can enable editing if needed.
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Add any additional notes about this payment..."
                  />
                </div>

                {/* Payment Date Info */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiCalendar className="text-gray-400" />
                    <span>Payment will be recorded with current date and time</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || loading || unpaidVisits.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiDollarSign />
                    Record Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
