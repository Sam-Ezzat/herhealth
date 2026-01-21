import { useState, useEffect } from 'react';
import { FiCalendar, FiUsers, FiUserCheck, FiClipboard, FiSearch, FiFilter, FiDollarSign } from 'react-icons/fi';
import QuickAppointmentModal from '../../components/QuickAppointmentModal';
import PaymentInvoiceModal from '../../components/PaymentInvoiceModal';
import api from '../../services/api';
import visitPaymentService from '../../services/visit-payment.service';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  activeDoctors: number;
  pendingVisits: number;
}

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_at: string;
  end_at: string;
  status: string;
  appointment_type: string;
  reason?: string;
  patient_name?: string;
  doctor_name?: string;
  patient_color_code?: string;
}

const Dashboard = () => {
  const [showQuickAppointment, setShowQuickAppointment] = useState(false);
  const [showPaymentInvoice, setShowPaymentInvoice] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    activeDoctors: 0,
    pendingVisits: 0,
  });
  const [todayPayments, setTodayPayments] = useState<number>(0);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDashboardStats();
    fetchTodayAppointments();
    fetchTodayPayments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, statusFilter]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [patientsRes, appointmentsRes, doctorsRes, visitsRes] = await Promise.all([
        api.get('/patients/stats'),
        api.get('/appointments/stats'),
        api.get('/doctors/stats'),
        api.get('/visits/stats'),
      ]);

      const patientsData = patientsRes.data.data || patientsRes.data;
      const appointmentsData = appointmentsRes.data.data || appointmentsRes.data;
      const doctorsData = doctorsRes.data.data || doctorsRes.data;
      const visitsData = visitsRes.data.data || visitsRes.data;

      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointmentsData.by_date?.find(
        (d: any) => d.date === today
      )?.count || appointmentsData.today || 0;

      setStats({
        totalPatients: parseInt(patientsData.total_patients) || 0,
        todayAppointments: parseInt(todayAppointments) || 0,
        activeDoctors: parseInt(doctorsData.total_doctors) || 0,
        pendingVisits: parseInt(visitsData.pending_count) || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/appointments?date_from=${today}&date_to=${today}`);
      const appointmentsData = response.data.data || response.data;
      const sorted = Array.isArray(appointmentsData) 
        ? appointmentsData.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
        : [];
      setAppointments(sorted);
    } catch (error) {
      console.error('Error fetching today appointments:', error);
      setAppointments([]);
    }
  };

  const fetchTodayPayments = async () => {
    try {
      const stats = await visitPaymentService.getTodayStats();
      console.log('Today payment stats:', stats);
      setPaymentStats(stats);
      setTodayPayments(stats ? parseFloat(stats.total_amount) || 0 : 0);
    } catch (error) {
      console.error('Error fetching today payments:', error);
      setTodayPayments(0);
      setPaymentStats(null);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    setFilteredAppointments(filtered);
  };

  const handleAppointmentSuccess = () => {
    fetchDashboardStats();
    fetchTodayAppointments();
    fetchTodayPayments();
  };

  const handleOpenModal = () => {
    setShowQuickAppointment(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-yellow-100 text-yellow-800';
      case 'no-answer': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    // Parse datetime string directly without timezone conversion
    // Expected format: 'YYYY-MM-DDTHH:MM:SS' or 'YYYY-MM-DD HH:MM:SS'
    const timePart = dateString.includes('T') ? dateString.split('T')[1] : dateString.split(' ')[1];
    const [hours, minutes] = timePart.split(':').map(Number);
    
    // Format to 12-hour time
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition transform hover:scale-105"
        >
          <FiCalendar size={20} />
          <span className="font-semibold">Quick Appointment</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Total Patients</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {loading ? '...' : stats.totalPatients.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiUsers className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Today's Appointments</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {loading ? '...' : stats.todayAppointments.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiCalendar className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Active Doctors</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {loading ? '...' : stats.activeDoctors.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FiUserCheck className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Pending Visits</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {loading ? '...' : stats.pendingVisits.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FiClipboard className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
        <div 
          onClick={() => setShowPaymentInvoice(true)}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all cursor-pointer hover:scale-105 border-2 border-transparent hover:border-emerald-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Today's Payments</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {loading ? '...' : `EGP ${todayPayments.toFixed(2)}`}
              </p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">Click to view invoice</p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-full">
              <FiDollarSign className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Invoice Modal */}
      <PaymentInvoiceModal 
        isOpen={showPaymentInvoice}
        onClose={() => setShowPaymentInvoice(false)}
        stats={paymentStats}
      />

      {/* Today's Appointments Section */}
      <div className="mt-8 bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Appointments</h2>
          
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by patient, doctor, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
                <option value="no-answer">No Answer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading appointments...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'No appointments found matching your filters'
                : 'No appointments scheduled for today'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => {
                  const calendarColor = (appointment as any).calendar_color_code;
                  const rowStyle = calendarColor 
                    ? { 
                        backgroundColor: `${calendarColor}15`, // 15 is hex for ~8% opacity
                        borderLeft: `4px solid ${calendarColor}`
                      }
                    : {};
                  
                  return (
                  <tr 
                    key={appointment.id} 
                    className="hover:brightness-95 transition-all"
                    style={rowStyle}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(appointment.start_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {appointment.patient_color_code && (
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: appointment.patient_color_code }}
                            title={`Patient: ${appointment.patient_color_name || appointment.patient_color_code}`}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        to={`/patients/${appointment.patient_id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {appointment.patient_name || 'N/A'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.doctor_name || 'N/A'}
                      {(appointment as any).calendar_name && (
                        <div className="text-xs text-gray-500">
                          📅 {(appointment as any).calendar_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.appointment_type || 'General'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {appointment.reason || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/appointments/${appointment.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <QuickAppointmentModal
        isOpen={showQuickAppointment}
        onClose={() => setShowQuickAppointment(false)}
        onSuccess={handleAppointmentSuccess}
      />
    </div>
  );
};

export default Dashboard;
