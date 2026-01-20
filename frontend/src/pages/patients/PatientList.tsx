import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import patientService, { Patient, ColorCode } from '../../services/patient.service';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';

const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [colorCodes, setColorCodes] = useState<ColorCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [colorCodeFilter, setColorCodeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    loadColorCodes();
  }, []);

  useEffect(() => {
    loadPatients();
  }, [search, colorCodeFilter, currentPage]);

  const loadColorCodes = async () => {
    try {
      const codes = await patientService.getColorCodes();
      setColorCodes(codes);
    } catch (error: any) {
      console.error('Failed to load color codes:', error);
    }
  };

  const loadPatients = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * limit;
      const result = await patientService.getAll({
        search: search || undefined,
        colorCodeId: colorCodeFilter ? Number(colorCodeFilter) : undefined,
        limit,
        offset,
      });
      
      // Handle response structure
      if (result && typeof result === 'object') {
        if ('patients' in result && 'total' in result) {
          setPatients(result.patients || []);
          setTotal(result.total || 0);
        } else {
          console.error('Unexpected response structure:', result);
          toast.error('Invalid response format from server');
          setPatients([]);
          setTotal(0);
        }
      } else {
        console.error('Invalid response:', result);
        toast.error('Invalid response from server');
        setPatients([]);
        setTotal(0);
      }
    } catch (error: any) {
      console.error('Error loading patients:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to load patients');
      setPatients([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      await patientService.delete(id);
      toast.success('Patient deleted successfully');
      loadPatients();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete patient');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    loadPatients();
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Patients</h1>
          <p className="text-gray-600 mt-1">Manage patient records</p>
        </div>
        <Link
          to="/patients/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <FiPlus /> Add Patient
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Color Code Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Code
            </label>
            <select
              value={colorCodeFilter}
              onChange={(e) => {
                setColorCodeFilter(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Codes</option>
              {colorCodes.map((code) => (
                <option key={code.id} value={code.id}>
                  {code.color_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading patients...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No patients found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {patient.color_code_hex ? (
                            <div
                              className="w-8 h-8 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: patient.color_code_hex }}
                              title={patient.color_code_name}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-gray-300" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {calculateAge(patient.date_of_birth)}y
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/patients/${patient.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View"
                          >
                            <FiEye size={18} />
                          </button>
                          <button
                            onClick={() => navigate(`/patients/${patient.id}/edit`)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(patient.id, `${patient.first_name} ${patient.last_name}`)}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, total)} of {total} patients
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PatientList;
