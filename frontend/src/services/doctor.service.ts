import api from './api';

export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  phone: string;
  email: string;
  user_id?: string;
  username?: string;
  user_full_name?: string;
  created_at: string;
}

export interface DoctorStats {
  total_doctors: number;
  specialties_count: number;
  doctors_with_users: number;
}

const doctorService = {
  // Get all doctors with optional search
  getAll: async (search?: string): Promise<Doctor[]> => {
    const params = search ? { search } : undefined;
    const response = await api.get<{ success: boolean; data: Doctor[] }>('/doctors', params);
    return response.data;
  },

  // Get doctor by ID
  getById: async (id: string): Promise<Doctor> => {
    const response = await api.get<{ success: boolean; data: Doctor }>(`/doctors/${id}`);
    return response.data;
  },

  // Create new doctor
  create: async (doctorData: Omit<Doctor, 'id' | 'created_at' | 'username' | 'user_full_name'>): Promise<Doctor> => {
    const response = await api.post<{ success: boolean; data: Doctor }>('/doctors', doctorData);
    return response.data;
  },

  // Update doctor
  update: async (id: string, doctorData: Partial<Omit<Doctor, 'id' | 'created_at' | 'username' | 'user_full_name'>>): Promise<Doctor> => {
    const response = await api.put<{ success: boolean; data: Doctor }>(`/doctors/${id}`, doctorData);
    return response.data;
  },

  // Delete doctor
  delete: async (id: string): Promise<void> => {
    await api.delete(`/doctors/${id}`);
  },

  // Get doctor statistics
  getStats: async (): Promise<DoctorStats> => {
    const response = await api.get<{ success: boolean; data: DoctorStats }>('/doctors/stats');
    return response.data;
  },
};

export default doctorService;
