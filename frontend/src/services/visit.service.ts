import api from './api';

export interface Visit {
  id: string;
  appointment_id?: string;
  patient_id: string;
  doctor_id: string;
  visit_date: string;
  reason: string;
  clinical_notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
  pregnancy_id?: string;
  pregnancy_notes?: string;
  pregnancy_week?: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  patient_name?: string;
  doctor_name?: string;
  patient_phone?: string;
}

export interface VisitStats {
  total_visits: number;
  today: number;
  this_week: number;
  this_month: number;
}

export interface VisitFilters {
  patient_id?: string;
  doctor_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface PatientVisitSummary {
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  pregnancy_id?: string;
  pregnancy_status?: string;
  current_pregnancy_week?: number;
  lmp?: string;
  edd?: string;
  total_visits: number;
  last_visit_id: string;
  last_visit_date: string;
  last_visit_notes?: string;
  last_diagnosis?: string;
  last_doctor_name?: string;
  last_pregnancy_week?: number;
}

export interface PatientVisitHistory {
  id: string;
  visit_date: string;
  pregnancy_week?: number;
  reason: string;
  clinical_notes?: string;
  pregnancy_notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
  doctor_name: string;
  doctor_id: string;
  created_at: string;
}

const visitService = {
  getAll: async (filters?: VisitFilters): Promise<Visit[]> => {
    const params: any = {};
    if (filters?.patient_id) params.patient_id = filters.patient_id;
    if (filters?.doctor_id) params.doctor_id = filters.doctor_id;
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.search) params.search = filters.search;

    const response = await api.get<{ success: boolean; data: Visit[] }>('/visits', params);
    return (response as any).data || response;
  },

  getById: async (id: string): Promise<Visit> => {
    const response = await api.get<{ success: boolean; data: Visit }>(`/visits/${id}`);
    return (response as any).data || response;
  },

  create: async (data: Omit<Visit, 'id' | 'created_at' | 'updated_at' | 'patient_name' | 'doctor_name' | 'patient_phone'>): Promise<Visit> => {
    const response = await api.post<{ success: boolean; data: Visit }>('/visits', data);
    return (response as any).data || response;
  },

  update: async (
    id: string,
    data: Partial<Omit<Visit, 'id' | 'created_at' | 'updated_at' | 'patient_name' | 'doctor_name' | 'patient_phone'>>
  ): Promise<Visit> => {
    const response = await api.put<{ success: boolean; data: Visit }>(`/visits/${id}`, data);
    return (response as any).data || response;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/visits/${id}`);
  },

  getStats: async (): Promise<VisitStats> => {
    const response = await api.get<{ success: boolean; data: VisitStats }>('/visits/stats');
    return (response as any).data || response;
  },

  getPatientSummaries: async (search?: string): Promise<PatientVisitSummary[]> => {
    const params: any = {};
    if (search) params.search = search;
    const response = await api.get<{ success: boolean; data: PatientVisitSummary[] }>('/visits/patient-summaries', params);
    return (response as any).data || response;
  },

  getPatientHistory: async (patientId: string): Promise<PatientVisitHistory[]> => {
    const response = await api.get<{ success: boolean; data: PatientVisitHistory[] }>(`/visits/patient/${patientId}/history`);
    return (response as any).data || response;
  },
};

export default visitService;
