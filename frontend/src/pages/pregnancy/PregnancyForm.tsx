import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import pregnancyJourneyService, { CreatePregnancyData, UpdatePregnancyData } from '../../services/pregnancyJourney.service';
import patientService from '../../services/patient.service';
import { FiSave, FiX, FiCalendar } from 'react-icons/fi';

const PregnancyForm = () => {
  const navigate = useNavigate();
  const { patientId, pregnancyId } = useParams<{ patientId: string; pregnancyId?: string }>();
  const isEditMode = !!pregnancyId;

  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [formData, setFormData] = useState({
    lmp: '',
    edd: '',
    gravida: 1,
    para: 0,
    abortion: 0,
    living: 0,
    risk_flags: '',
    status: 'active' as 'active' | 'delivered' | 'terminated' | 'miscarriage',
  });

  useEffect(() => {
    if (patientId) {
      loadPatient();
    }
    if (isEditMode && pregnancyId) {
      loadPregnancy();
    }
  }, [patientId, pregnancyId]);

  const loadPatient = async () => {
    try {
      const patient = await patientService.getById(patientId!);
      setPatientName(`${patient.first_name} ${patient.last_name}`);
    } catch (error: any) {
      toast.error('Failed to load patient');
      navigate(`/patients/${patientId}/pregnancies`);
    }
  };

  const loadPregnancy = async () => {
    try {
      setLoading(true);
      const pregnancy = await pregnancyJourneyService.getPregnancyById(pregnancyId!);
      console.log('Loaded pregnancy data:', pregnancy);
      
      // Handle date conversion - could be string or Date object
      const lmpDate = typeof pregnancy.lmp === 'string' 
        ? pregnancy.lmp.split('T')[0] 
        : new Date(pregnancy.lmp).toISOString().split('T')[0];
      const eddDate = typeof pregnancy.edd === 'string'
        ? pregnancy.edd.split('T')[0]
        : new Date(pregnancy.edd).toISOString().split('T')[0];
      
      setFormData({
        lmp: lmpDate,
        edd: eddDate,
        gravida: pregnancy.gravida,
        para: pregnancy.para,
        abortion: pregnancy.abortion,
        living: pregnancy.living,
        risk_flags: pregnancy.risk_flags || '',
        status: pregnancy.status,
      });
    } catch (error: any) {
      console.error('Error loading pregnancy:', error);
      toast.error(error.response?.data?.error || 'Failed to load pregnancy');
      navigate(`/patients/${patientId}/pregnancies`);
    } finally {
      setLoading(false);
    }
  };

  const calculateEDD = (lmpDate: string) => {
    if (!lmpDate) return '';
    const lmp = new Date(lmpDate);
    const edd = new Date(lmp);
    edd.setDate(edd.getDate() + 280); // 40 weeks = 280 days
    return edd.toISOString().split('T')[0];
  };

  const handleLMPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lmpDate = e.target.value;
    setFormData({
      ...formData,
      lmp: lmpDate,
      edd: calculateEDD(lmpDate),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'gravida' || name === 'para' || name === 'abortion' || name === 'living' 
        ? parseInt(value) || 0 
        : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lmp) {
      toast.error('Last Menstrual Period (LMP) is required');
      return;
    }

    try {
      setLoading(true);
      
      if (isEditMode && pregnancyId) {
        const updateData: UpdatePregnancyData = {
          lmp: formData.lmp,
          edd: formData.edd,
          gravida: formData.gravida,
          para: formData.para,
          abortion: formData.abortion,
          living: formData.living,
          risk_flags: formData.risk_flags || undefined,
          status: formData.status,
        };
        await pregnancyJourneyService.updatePregnancy(pregnancyId, updateData);
        toast.success('Pregnancy updated successfully');
      } else {
        const createData: CreatePregnancyData = {
          lmp: formData.lmp,
          edd: formData.edd,
          gravida: formData.gravida,
          para: formData.para,
          abortion: formData.abortion,
          living: formData.living,
          risk_flags: formData.risk_flags || undefined,
          status: formData.status,
        };
        await pregnancyJourneyService.createPregnancy(patientId!, createData);
        toast.success('Pregnancy created successfully');
      }
      
      navigate(`/patients/${patientId}/pregnancies`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} pregnancy`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading pregnancy data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {isEditMode ? 'Edit Pregnancy' : 'New Pregnancy'}
        </h1>
        <p className="text-gray-600 mt-1">
          Patient: {patientName}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {/* Dates Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiCalendar /> Pregnancy Dates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Menstrual Period (LMP) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="lmp"
                value={formData.lmp}
                onChange={handleLMPChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Delivery Date (EDD)
              </label>
              <input
                type="date"
                name="edd"
                value={formData.edd}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Auto-calculated from LMP (40 weeks)</p>
            </div>
          </div>
        </div>

        {/* GPAL Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Obstetric History (GPAL)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gravida (G)
              </label>
              <input
                type="number"
                name="gravida"
                value={formData.gravida}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Total pregnancies</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Para (P)
              </label>
              <input
                type="number"
                name="para"
                value={formData.para}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Deliveries ≥20 wks</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Abortion (A)
              </label>
              <input
                type="number"
                name="abortion"
                value={formData.abortion}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Losses &lt;20 wks</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Living (L)
              </label>
              <input
                type="number"
                name="living"
                value={formData.living}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Living children</p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Additional Information</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="delivered">Delivered</option>
              <option value="terminated">Terminated</option>
              <option value="miscarriage">Miscarriage</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Flags / Special Considerations
            </label>
            <textarea
              name="risk_flags"
              value={formData.risk_flags}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="E.g., High blood pressure, gestational diabetes, previous C-section..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(`/patients/${patientId}/pregnancies`)}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <FiX /> Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave /> {loading ? 'Saving...' : isEditMode ? 'Update Pregnancy' : 'Create Pregnancy'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PregnancyForm;
