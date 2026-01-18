import api from './api';

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_type?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  insurance_provider?: string;
  insurance_number?: string;
  color_code_id?: string;
  color_code_name?: string;
  color_code_hex?: string;
  is_pregnant?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientSearchParams {
  search?: string;
  gender?: string;
  colorCodeId?: number;
  minAge?: number;
  maxAge?: number;
  limit?: number;
  offset?: number;
}

export interface PatientsResponse {
  patients: Patient[];
  total: number;
}

export interface ColorCode {
  id: number;
  color_name: string;
  color_hex: string;
  is_customizable?: boolean;
}

export interface PatientStats {
  total_patients: number;
  female_count: number;
  male_count: number;
  color_coded_count: number;
}

const patientService = {
  // Get all patients with optional filters
  getAll: async (params?: PatientSearchParams): Promise<PatientsResponse> => {
    const response = await api.get<{ success: boolean; data: PatientsResponse }>('/patients', params);
    return (response as any).data || response;
  },

  // Get patient by ID
  getById: async (id: string): Promise<Patient> => {
    const response = await api.get<{ success: boolean; data: Patient }>(`/patients/${id}`);
    return (response as any).data || response;
  },

  // Create new patient
  create: async (patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'color_code_name' | 'color_code_hex'>): Promise<Patient> => {
    const response = await api.post<{ success: boolean; data: Patient }>('/patients', patientData);
    return (response as any).data || response;
  },

  // Update patient
  update: async (id: string, patientData: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'color_code_name' | 'color_code_hex'>>): Promise<Patient> => {
    const response = await api.put<{ success: boolean; data: Patient }>(`/patients/${id}`, patientData);
    return (response as any).data || response;
  },

  // Delete patient
  delete: async (id: string): Promise<void> => {
    await api.delete(`/patients/${id}`);
  },

  // Get color codes
  getColorCodes: async (): Promise<ColorCode[]> => {
    const response = await api.get<{ success: boolean; data: ColorCode[] }>('/patients/color-codes');
    return (response as any).data || response;
  },

  // Get patient statistics
  getStats: async (): Promise<PatientStats> => {
    const response = await api.get<{ success: boolean; data: PatientStats }>('/patients/stats');
    return (response as any).data || response;
  },
};

export default patientService;
