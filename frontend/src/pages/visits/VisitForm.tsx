import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import visitService from '../../services/visit.service';
import patientService, { Patient } from '../../services/patient.service';
import doctorService, { Doctor } from '../../services/doctor.service';
import pregnancyJourneyService, { Pregnancy } from '../../services/pregnancyJourney.service';
import { FiSave, FiArrowLeft, FiHeart } from 'react-icons/fi';

const VisitForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  // Get query parameters for pre-filling
  const searchParams = new URLSearchParams(window.location.search);
  const preselectedPatientId = searchParams.get('patientId');
  const preselectedPregnancyId = searchParams.get('pregnancyId');

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPregnancySection, setShowPregnancySection] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: preselectedPatientId || '',
    doctor_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    reason: '',
    clinical_notes: '',
    diagnosis: '',
    treatment_plan: '',
    pregnancy_id: preselectedPregnancyId || '',
    pregnancy_notes: '',
    pregnancy_week: '',
    weight_kg: '',
    bp_systolic: '',
    bp_diastolic: '',
    fundal_height_cm: '',
    fetal_heart_rate: '',
    ob_notes: '',
  });

  useEffect(() => {
    loadPatients();
    loadDoctors();
    if (isEditMode) {
      loadVisit();
    }
    // Load pregnancies if patient is preselected
    if (preselectedPatientId) {
      loadPatientPregnancies(preselectedPatientId);
    }
  }, [id]);

  useEffect(() => {
    if (formData.patient_id) {
      loadPatientPregnancies(formData.patient_id);
    } else {
      setPregnancies([]);
      setShowPregnancySection(false);
    }
  }, [formData.patient_id]);

  const loadPatients = async () => {
    try {
      const result = await patientService.getAll();
      if (result && 'patients' in result) {
        setPatients(result.patients || []);
      } else {
        setPatients([]);
      }
    } catch (error: any) {
      console.error('Error loading patients:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to load patients');
      setPatients([]);
    }
  };

  const loadDoctors = async () => {
    try {
      const result = await doctorService.getAll();
      setDoctors(result || []);
    } catch (error: any) {
      toast.error('Failed to load doctors');
    }
  };

  const loadPatientPregnancies = async (patientId: string) => {
    try {
      const result = await pregnancyJourneyService.getPatientPregnancies(patientId);
      const activePregnancies = result.filter(p => p.status === 'active');
      setPregnancies(activePregnancies);
      
      // Find selected patient
      const patient = patients.find(p => p.id === patientId);
      setSelectedPatient(patient || null);
      
      // Show pregnancy section if patient has active pregnancies
      setShowPregnancySection(activePregnancies.length > 0);
    } catch (error: any) {
      setPregnancies([]);
      setShowPregnancySection(false);
    }
  };

  const loadVisit = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const visit = await visitService.getById(id);
      setFormData({
        patient_id: visit.patient_id,
        doctor_id: visit.doctor_id,
        visit_date: visit.visit_date.split('T')[0],
        reason: visit.reason,
        clinical_notes: visit.clinical_notes || '',
        diagnosis: visit.diagnosis || '',
        treatment_plan: visit.treatment_plan || '',
        pregnancy_id: visit.pregnancy_id || '',
        pregnancy_notes: visit.pregnancy_notes || '',
        pregnancy_week: visit.pregnancy_week?.toString() || '',
        weight_kg: '',
        bp_systolic: '',
        bp_diastolic: '',
        fundal_height_cm: '',
        fetal_heart_rate: '',
        ob_notes: '',
      });
      
      if (visit.pregnancy_id) {
        setShowPregnancySection(true);
      }
    } catch (error: any) {
      toast.error('Failed to load visit');
      navigate('/visits');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Prepare visit data
      const visitData: any = {
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
        visit_date: formData.visit_date,
        reason: formData.reason,
        clinical_notes: formData.clinical_notes || undefined,
        diagnosis: formData.diagnosis || undefined,
        treatment_plan: formData.treatment_plan || undefined,
        pregnancy_id: formData.pregnancy_id || undefined,
        pregnancy_notes: formData.pregnancy_notes || undefined,
        pregnancy_week: formData.pregnancy_week ? parseInt(formData.pregnancy_week) : undefined,
      };
      
      let visitId: string;
      if (isEditMode && id) {
        await visitService.update(id, visitData);
        visitId = id;
        toast.success('Visit updated successfully');
      } else {
        const newVisit = await visitService.create(visitData);
        visitId = newVisit.id;
        toast.success('Visit created successfully');
      }
      
      // Create/update OB record if pregnancy data exists
      if (formData.pregnancy_id && (formData.weight_kg || formData.bp_systolic || formData.fundal_height_cm || formData.fetal_heart_rate || formData.ob_notes)) {
        try {
          const obData = {
            pregnancy_id: formData.pregnancy_id,
            visit_id: visitId,
            record_date: formData.visit_date,
            pregnancy_week: formData.pregnancy_week ? parseInt(formData.pregnancy_week) : undefined,
            weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
            bp_systolic: formData.bp_systolic ? parseInt(formData.bp_systolic) : undefined,
            bp_diastolic: formData.bp_diastolic ? parseInt(formData.bp_diastolic) : undefined,
            fundal_height_cm: formData.fundal_height_cm ? parseFloat(formData.fundal_height_cm) : undefined,
            fetal_heart_rate: formData.fetal_heart_rate || undefined,
            notes: formData.ob_notes || undefined,
          };
          
          if (isEditMode) {
            await pregnancyJourneyService.updateOBRecord(visitId, obData);
          } else {
            await pregnancyJourneyService.createOBRecord(obData);
          }
        } catch (error) {
          console.error('Failed to save OB record:', error);
          // Don't fail the whole save if OB record fails
        }
      }
      
      navigate('/visits');
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} visit`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading && isEditMode) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading visit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/visits')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {isEditMode ? 'Edit Visit' : 'Add Visit'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode ? 'Update visit information' : 'Record a new patient visit'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient <span className="text-red-500">*</span>
              </label>
              <select
                name="patient_id"
                value={formData.patient_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor <span className="text-red-500">*</span>
              </label>
              <select
                name="doctor_id"
                value={formData.doctor_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.first_name} {doctor.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visit Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="visit_date"
              value={formData.visit_date}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Visit <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="E.g., Routine checkup, Follow-up, Prenatal visit..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clinical Notes
            </label>
            <textarea
              name="clinical_notes"
              value={formData.clinical_notes}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observations, vital signs, examination findings..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnosis
            </label>
            <input
              type="text"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="E.g., Normal pregnancy, Gestational diabetes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Treatment Plan
            </label>
            <textarea
              name="treatment_plan"
              value={formData.treatment_plan}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Medications, follow-up schedule, recommendations..."
            />
          </div>

          {/* Pregnancy Section */}
          {pregnancies.length > 0 && (
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FiHeart className="text-pink-600" />
                <h3 className="text-lg font-semibold text-gray-800">Pregnancy Tracking</h3>
              </div>

              <div className="space-y-4 bg-pink-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link to Pregnancy Journey
                  </label>
                  <select
                    name="pregnancy_id"
                    value={formData.pregnancy_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                  >
                    <option value="">Not pregnancy-related</option>
                    {pregnancies.map((pregnancy) => (
                      <option key={pregnancy.id} value={pregnancy.id}>
                        Pregnancy #{pregnancy.pregnancy_number} - Week {pregnancy.current_week} (LMP: {new Date(pregnancy.lmp).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                {formData.pregnancy_id && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pregnancy Week at Visit
                      </label>
                      <input
                        type="number"
                        name="pregnancy_week"
                        value={formData.pregnancy_week}
                        onChange={handleChange}
                        min="0"
                        max="42"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="E.g., 20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pregnancy-Specific Notes
                      </label>
                      <textarea
                        name="pregnancy_notes"
                        value={formData.pregnancy_notes}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Pregnancy-related observations, concerns, or progress..."
                      />
                    </div>

                    {/* OB Measurements */}
                    <div className="border-t border-pink-200 pt-4 mt-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">OB Measurements</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Weight (kg)
                          </label>
                          <input
                            type="number"
                            name="weight_kg"
                            value={formData.weight_kg}
                            onChange={handleChange}
                            step="0.1"
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            placeholder="E.g., 65.5"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Blood Pressure
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              name="bp_systolic"
                              value={formData.bp_systolic}
                              onChange={handleChange}
                              min="0"
                              max="300"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              placeholder="Systolic"
                            />
                            <span className="self-center">/</span>
                            <input
                              type="number"
                              name="bp_diastolic"
                              value={formData.bp_diastolic}
                              onChange={handleChange}
                              min="0"
                              max="200"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              placeholder="Diastolic"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fundal Height (cm)
                          </label>
                          <input
                            type="number"
                            name="fundal_height_cm"
                            value={formData.fundal_height_cm}
                            onChange={handleChange}
                            step="0.1"
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            placeholder="E.g., 28.5"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fetal Heart Rate
                          </label>
                          <input
                            type="text"
                            name="fetal_heart_rate"
                            value={formData.fetal_heart_rate}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            placeholder="E.g., 140-150 bpm"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          OB-Specific Notes
                        </label>
                        <textarea
                          name="ob_notes"
                          value={formData.ob_notes}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Ultrasound findings, fetal movements, concerns..."
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/visits')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <FiSave />
              {loading ? 'Saving...' : isEditMode ? 'Update Visit' : 'Save Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisitForm;
