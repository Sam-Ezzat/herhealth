import api from './api';

export interface Pregnancy {
  id: string;
  patient_id: string;
  lmp: string;
  edd: string;
  gravida: number;
  para: number;
  abortion: number;
  living: number;
  pregnancy_number: number;
  risk_flags?: string;
  status: 'active' | 'delivered' | 'terminated' | 'miscarriage';
  delivery_date?: string;
  delivery_type?: string;
  baby_weight_kg?: number;
  complications?: string;
  outcome?: string;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  current_week?: number;
}

export interface PregnancyVisit {
  id: string;
  visit_date: string;
  pregnancy_week: number;
  clinical_notes?: string;
  pregnancy_notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
  doctor_name?: string;
  weight_kg?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  fundal_height_cm?: number;
  fetal_heart_rate?: string;
  ob_notes?: string;
}

export interface PregnancyJourney extends Pregnancy {
  visits: PregnancyVisit[];
  total_visits: number;
}

export interface CreatePregnancyData {
  lmp: string;
  edd?: string;
  gravida?: number;
  para?: number;
  abortion?: number;
  living?: number;
  risk_flags?: string;
  status?: 'active' | 'delivered' | 'terminated' | 'miscarriage';
}

export interface UpdatePregnancyData {
  lmp?: string;
  edd?: string;
  gravida?: number;
  para?: number;
  abortion?: number;
  living?: number;
  risk_flags?: string;
  status?: 'active' | 'delivered' | 'terminated' | 'miscarriage';
  delivery_date?: string;
  delivery_type?: string;
  baby_weight_kg?: number;
  complications?: string;
  outcome?: string;
}

export interface DeliveryData {
  delivery_date: string;
  delivery_type?: string;
  baby_weight_kg?: number;
  complications?: string;
  outcome?: string;
}

export interface OBRecordData {
  pregnancy_id: string;
  visit_id: string;
  record_date: string;
  pregnancy_week?: number;
  weight_kg?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  fundal_height_cm?: number;
  fetal_heart_rate?: string;
  notes?: string;
}

class PregnancyJourneyService {
  // Get all pregnancies for a patient
  async getPatientPregnancies(patientId: string): Promise<Pregnancy[]> {
    const response = await api.get(`/pregnancies/patient/${patientId}`);
    console.log('Full API response:', response);
    console.log('Response data:', response.data);
    return response.data.data || response.data;
  }

  // Get active pregnancy journey for a patient
  async getActivePregnancyJourney(patientId: string): Promise<PregnancyJourney> {
    const response = await api.get(`/pregnancies/patient/${patientId}/active-journey`);
    return response.data.data;
  }

  // Get specific pregnancy
  async getPregnancyById(pregnancyId: string): Promise<Pregnancy> {
    console.log('Fetching pregnancy by ID:', pregnancyId);
    const response = await api.get(`/pregnancies/${pregnancyId}`);
    console.log('getPregnancyById response:', response);
    return response.data.data || response.data;
  }

  // Get complete pregnancy journey with visits
  async getPregnancyJourney(pregnancyId: string): Promise<PregnancyJourney> {
    const response = await api.get(`/pregnancies/${pregnancyId}/journey`);
    return response.data.data;
  }

  // Create new pregnancy
  async createPregnancy(patientId: string, data: CreatePregnancyData): Promise<Pregnancy> {
    const response = await api.post(`/pregnancies/patient/${patientId}`, data);
    return response.data.data;
  }

  // Update pregnancy
  async updatePregnancy(pregnancyId: string, data: UpdatePregnancyData): Promise<Pregnancy> {
    const response = await api.put(`/pregnancies/${pregnancyId}`, data);
    return response.data.data;
  }

  // Mark pregnancy as delivered
  async markAsDelivered(pregnancyId: string, data: DeliveryData): Promise<Pregnancy> {
    const response = await api.post(`/pregnancies/${pregnancyId}/deliver`, data);
    return response.data.data;
  }

  // Delete pregnancy
  async deletePregnancy(pregnancyId: string): Promise<void> {
    await api.delete(`/pregnancies/${pregnancyId}`);
  }

  // Create OB record
  async createOBRecord(data: OBRecordData) {
    const response = await api.post('/pregnancies/ob-record', data);
    return response.data.data;
  }

  // Update OB record
  async updateOBRecord(visitId: string, data: Partial<OBRecordData>) {
    const response = await api.put(`/pregnancies/ob-record/visit/${visitId}`, data);
    return response.data.data;
  }
}

export default new PregnancyJourneyService();
