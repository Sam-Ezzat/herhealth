import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import patientService, { ColorCode } from '../../services/patient.service';
import { FiSave, FiX } from 'react-icons/fi';

const PatientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [colorCodes, setColorCodes] = useState<ColorCode[]>([]);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'Female' as 'Male' | 'Female' | 'Other',
    phone: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_type: '',
    notes: '',
    insurance_provider: '',
    insurance_number: '',
    color_code_id: '',
    is_pregnant: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadColorCodes();
    if (isEditMode && id) {
      loadPatient(id);
    }
  }, [id]);

  const loadColorCodes = async () => {
    try {
      const codes = await patientService.getColorCodes();
      setColorCodes(codes);
    } catch (error) {
      console.error('Failed to load color codes:', error);
    }
  };

  const loadPatient = async (patientId: string) => {
    try {
      setLoadingData(true);
      const patient = await patientService.getById(patientId);
      console.log('Loaded patient data:', patient);
      
      if (!patient || !patient.first_name) {
        throw new Error('Invalid patient data received');
      }
      
      setFormData({
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '',
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email || '',
        address: patient.address || '',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || '',
        blood_type: patient.blood_type || '',
        notes: patient.notes || '',
        insurance_provider: patient.insurance_provider || '',
        insurance_number: patient.insurance_number || '',
        color_code_id: patient.color_code_id || '',
        is_pregnant: patient.is_pregnant ?? true,
      });
    } catch (error: any) {
      console.error('Error loading patient:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to load patient');
      navigate('/patients');
    } finally {
      setLoadingData(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        email: formData.email || undefined,
        address: formData.address || undefined,
        emergency_contact_name: formData.emergency_contact_name || undefined,
        emergency_contact_phone: formData.emergency_contact_phone || undefined,
        blood_type: formData.blood_type || undefined,
        notes: formData.notes || undefined,
        insurance_provider: formData.insurance_provider || undefined,
        insurance_number: formData.insurance_number || undefined,
        color_code_id: formData.color_code_id || undefined,
        is_pregnant: formData.is_pregnant,
      };

      if (isEditMode && id) {
        await patientService.update(id, submitData);
        toast.success('Patient updated successfully');
      } else {
        await patientService.create(submitData as any);
        toast.success('Patient created successfully');
      }
      
      navigate('/patients');
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} patient`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  if (loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {isEditMode ? 'Edit Patient' : 'Add New Patient'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditMode ? 'Update patient information' : 'Enter patient details'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {/* Personal Information */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.first_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.first_name && <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.last_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.last_name && <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date_of_birth && <p className="mt-1 text-sm text-red-500">{errors.date_of_birth}</p>}
            </div>

            {/* Gender is automatically set to Female for OBGYN clinic */}
            <input type="hidden" name="gender" value="Female" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
              <select
                name="blood_type"
                value={formData.blood_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Blood Type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_pregnant"
                  checked={formData.is_pregnant}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Currently Pregnant</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color Code</label>
              <select
                name="color_code_id"
                value={formData.color_code_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Color Code</option>
                {colorCodes.map((code) => (
                  <option key={code.id} value={code.id}>
                    {code.color_name}
                  </option>
                ))}
              </select>
              {formData.color_code_id && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-600">Selected:</span>
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-gray-300" 
                    style={{ 
                      backgroundColor: colorCodes.find(c => String(c.id) === String(formData.color_code_id))?.color_hex 
                    }}
                  ></div>
                  <span className="text-sm font-medium">
                    {colorCodes.find(c => String(c.id) === String(formData.color_code_id))?.color_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Emergency Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
              <input
                type="text"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
              <input
                type="tel"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* General Notes */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">General Notes</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes about patient</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={6}
              placeholder="Add any notes about the patient..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Insurance Information */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Insurance Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Provider</label>
              <input
                type="text"
                name="insurance_provider"
                value={formData.insurance_provider}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Number</label>
              <input
                type="text"
                name="insurance_number"
                value={formData.insurance_number}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <FiX /> Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave /> {loading ? 'Saving...' : isEditMode ? 'Update Patient' : 'Create Patient'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
