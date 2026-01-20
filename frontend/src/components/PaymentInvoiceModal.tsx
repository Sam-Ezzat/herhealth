import { FiX, FiDollarSign, FiCreditCard } from 'react-icons/fi';

interface PaymentStats {
  payment_count: number;
  cash_count: number;
  instapay_count: number;
  no_payment_count: number;
  reconsultation_count: number;
  total_amount: number;
  cash_total: number;
  instapay_total: number;
}

interface PaymentInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PaymentStats | null;
}

const PaymentInvoiceModal = ({ isOpen, onClose, stats }: PaymentInvoiceModalProps) => {
  if (!isOpen || !stats) return null;

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Payment Invoice</h2>
              <p className="text-emerald-100 mt-1">{today}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-emerald-700 p-2 rounded-full transition"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Section */}
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Payments Collected</p>
                <p className="text-4xl font-bold text-emerald-600 mt-1">
                  EGP {Number(stats.total_amount).toFixed(2)}
                </p>
              </div>
              <div className="bg-emerald-100 p-4 rounded-full">
                <FiDollarSign className="text-emerald-600" size={32} />
              </div>
            </div>
          </div>

          {/* Payment Counts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FiCreditCard className="text-emerald-600" />
              Payment Methods Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <p className="text-sm text-gray-600 font-medium">Cash Payments</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.cash_count}</p>
                <p className="text-sm text-emerald-600 font-semibold mt-1">
                  EGP {Number(stats.cash_total).toFixed(2)}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <p className="text-sm text-gray-600 font-medium">Instapay Payments</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.instapay_count}</p>
                <p className="text-sm text-emerald-600 font-semibold mt-1">
                  EGP {Number(stats.instapay_total).toFixed(2)}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <p className="text-sm text-gray-600 font-medium">No Payment</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.no_payment_count}</p>
                <p className="text-sm text-gray-500 font-semibold mt-1">EGP 0.00</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <p className="text-sm text-gray-600 font-medium">ReConsultation</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.reconsultation_count}</p>
                <p className="text-sm text-gray-500 font-semibold mt-1">EGP 0.00</p>
              </div>
            </div>
          </div>

          {/* Total Summary */}
          <div className="border-t-2 border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">Total Transactions</span>
              <span className="text-xl font-bold text-gray-800">{stats.payment_count}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">Cash Collected</span>
              <span className="text-xl font-bold text-gray-800">
                EGP {Number(stats.cash_total).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">Instapay Collected</span>
              <span className="text-xl font-bold text-gray-800">
                EGP {Number(stats.instapay_total).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t-2 border-emerald-200">
              <span className="text-lg font-bold text-gray-800">Grand Total</span>
              <span className="text-2xl font-bold text-emerald-600">
                EGP {Number(stats.total_amount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            Print Invoice
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentInvoiceModal;
