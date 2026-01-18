import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import appointmentService, { Appointment } from '../../services/appointment.service';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiCalendar, FiClock, FiArchive } from 'react-icons/fi';

const AppointmentList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');

  useEffect(() => {
    loadAppointments();
  }, [search, statusFilter, typeFilter, dateFrom, dateTo, location.key, activeTab]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (search) filters.search = search;
      if (statusFilter) filters.status = statusFilter;
      if (typeFilter) filters.type = typeFilter;
      
      // Set date filters based on active tab
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (activeTab === 'active') {
        // Active: appointments from today onwards
        if (dateFrom) filters.date_from = dateFrom;
        if (dateTo) filters.date_to = dateTo;
      } else {
        // Archive: appointments before today
        if (dateFrom) filters.date_from = dateFrom;
        if (dateTo) filters.date_to = dateTo;
      }
      
      const result = await appointmentService.getAll(filters);
      // Filter appointments based on tab
      let filteredAppointments = result || [];
      
      if (activeTab === 'active') {
        // Show appointments from today onwards
        filteredAppointments = filteredAppointments.filter(apt => 
          new Date(apt.start_at) >= today
        );
      } else {
        // Show appointments before today
        filteredAppointments = filteredAppointments.filter(apt => 
          new Date(apt.start_at) < today
        );
      }
      
      // Sort by date and time
      const sortedAppointments = filteredAppointments.sort((a, b) => {
        const dateCompare = new Date(b.start_at).getTime() - new Date(a.start_at).getTime();
        return activeTab === 'archive' ? dateCompare : -dateCompare; // Descending for archive, ascending for active
      });
      
      setAppointments(sortedAppointments);
    } catch (error: any) {
      console.error('Error loading appointments:', error);
      toast.error(error.response?.data?.error || 'Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, patientName: string) => {
    if (!window.confirm(`Are you sure you want to delete appointment for ${patientName}?`)) {
      return;
    }

    try {
      await appointmentService.delete(id);
      toast.success('Appointment deleted successfully');
      loadAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete appointment');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.round(diff / 60000); // Convert to minutes
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage patient appointments</p>
        </div>
        <Link
          to="/appointments/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus /> Schedule Appointment
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('active');
                clearFilters();
              }}
              className={`${
                activeTab === 'active'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <FiCalendar />
              Active Appointments
              {activeTab === 'active' && appointments.length > 0 && (
                <span className="bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs font-semibold">
                  {appointments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('archive');
                clearFilters();
              }}
              className={`${
                activeTab === 'archive'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <FiArchive />
              Archived Appointments
              {activeTab === 'archive' && appointments.length > 0 && (
                <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs font-semibold">
                  {appointments.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            {activeTab === 'active' ? 'Active Appointments Filters' : 'Archive Filters'}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showFilters ? 'Hide Advanced' : 'Show Advanced'}
            </button>
            {(search || statusFilter || typeFilter || dateFrom || dateTo) && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient, doctor, color, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No Show</option>
          </select>
          <input
            type="text"
            placeholder="Filter by type..."
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading appointments...</p>
          </div>
        ) : !appointments || appointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              {activeTab === 'active' ? <FiCalendar size={48} className="mx-auto text-gray-300" /> : <FiArchive size={48} className="mx-auto text-gray-300" />}
            </div>
            <p className="text-gray-600">
              {activeTab === 'active' 
                ? 'No active appointments found' 
                : 'No archived appointments found'}
            </p>
            {activeTab === 'active' && (
              <Link
                to="/appointments/new"
                className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800"
              >
                <FiPlus /> Schedule an appointment
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visit Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reservation Type
                  </th>
                  {activeTab === 'archive' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reserved By
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments?.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm">
                        <FiCalendar className="text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatDate(appointment.start_at)}
                          </div>
                          <div className="text-gray-500 flex items-center gap-1">
                            <FiClock size={12} />
                            {formatTime(appointment.start_at)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {appointment.patient_color_code && (
                          <div 
                            className="w-3 h-3 rounded-full border border-gray-300" 
                            style={{ backgroundColor: appointment.patient_color_code }}
                            title={`Patient color: ${appointment.patient_color_code}`}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.patient_name}
                          </div>
                          {appointment.patient_phone && (
                            <div className="text-sm text-gray-500">{appointment.patient_phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                       {appointment.doctor_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{appointment.type}</div>
                      <div className="text-xs text-gray-500">{calculateDuration(appointment.start_at, appointment.end_at)} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{(appointment as any).reservation_type || 'Clinic'}</div>
                    </td>
                    {activeTab === 'archive' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.created_by_name ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{appointment.created_by_name}</div>
                            <div className="text-xs text-gray-500">{appointment.created_by_role || 'Staff'}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/appointments/${appointment.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <FiEye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/appointments/${appointment.id}/edit`)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(appointment.id, appointment.patient_name || 'this patient')}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentList;
