import api from './api';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  calendar_id?: string;
  start_at: string;
  end_at: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no-show' | 'no-answer';
  reservation_type?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  patient_name?: string;
  doctor_name?: string;
  patient_phone?: string;
  patient_color_code?: string;
  patient_color_name?: string;
  created_by_name?: string;
  created_by_role?: string;
  calendar_color_code?: string;
  calendar_color_name?: string;
  calendar_name?: string;
}

export interface AppointmentStats {
  total_appointments: number;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  no_show: number;
  today: number;
  upcoming: number;
}

export interface AppointmentFilters {
  patient_id?: string;
  doctor_id?: string;
  status?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

const appointmentService = {
  getAll: async (filters?: AppointmentFilters): Promise<Appointment[]> => {
    const params: any = {};
    if (filters?.patient_id) params.patient_id = filters.patient_id;
    if (filters?.doctor_id) params.doctor_id = filters.doctor_id;
    if (filters?.status) params.status = filters.status;
    if (filters?.type) params.type = filters.type;
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.search) params.search = filters.search;

    const response = await api.get<{ success: boolean; data: Appointment[] }>('/appointments', params);
    return (response as any).data || response;
  },

  getById: async (id: string): Promise<Appointment> => {
    const response = await api.get<{ success: boolean; data: Appointment }>(`/appointments/${id}`);
    return (response as any).data || response;
  },

  create: async (data: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'patient_name' | 'doctor_name' | 'patient_phone'>): Promise<Appointment> => {
    const response = await api.post<{ success: boolean; data: Appointment }>('/appointments', data);
    return (response as any).data || response;
  },

  update: async (
    id: string,
    data: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'patient_name' | 'doctor_name' | 'patient_phone'>>
  ): Promise<Appointment> => {
    const response = await api.put<{ success: boolean; data: Appointment }>(`/appointments/${id}`, data);
    return (response as any).data || response;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  },

  getStats: async (): Promise<AppointmentStats> => {
    const response = await api.get<{ success: boolean; data: AppointmentStats }>('/appointments/stats');
    return (response as any).data || response;
  },
};

export default appointmentService;
