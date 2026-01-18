import api from './api';

export interface PregnancyWeek {
  week: number;
  trimester: number;
  title: string;
  baby_development: string;
  mother_changes: string;
  tips: string[];
  checkup_notes?: string;
}

export interface PregnancyJourney {
  patient_id: string;
  patient_name: string;
  lmp: string;
  edd: string;
  current_week: number;
  current_day: number;
  trimester: number;
  gravida?: number;
  para?: number;
  abortion?: number;
  living?: number;
  pregnancy_status: string;
  weeks_completed: PregnancyWeek[];
  current_week_info: PregnancyWeek;
  upcoming_milestones: string[];
}

export interface PregnancyTrackingUpdate {
  is_pregnant: boolean;
  lmp?: string;
  edd?: string;
  pregnancy_status?: string;
  gravida?: number;
  para?: number;
  abortion?: number;
  living?: number;
}

const pregnancyTrackingService = {
  // Get pregnancy journey for patient
  async getPregnancyJourney(patientId: string): Promise<PregnancyJourney> {
    const response = await api.get<PregnancyJourney>(`/visits/patient/${patientId}/pregnancy-journey`);
    return (response as any).data || response;
  },

  // Update pregnancy tracking
  async updatePregnancyTracking(patientId: string, data: PregnancyTrackingUpdate): Promise<void> {
    const response = await api.put(`/visits/patient/${patientId}/pregnancy-tracking`, data);
    return (response as any).data || response;
  },

  // Calculate pregnancy week from LMP
  async calculatePregnancyWeek(lmp: string): Promise<{ week: number; day: number; edd: string }> {
    const response = await api.post('/visits/pregnancy/calculate-week', { lmp});
    return (response as any).data || response;
  }
};

export default pregnancyTrackingService;
