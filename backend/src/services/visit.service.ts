import * as visitModel from '../models/visit.model';
import ApiError from '../utils/ApiError';

export const getAllVisits = async (filters: visitModel.VisitFilters = {}) => {
  return await visitModel.findAllVisits(filters);
};

export const getVisitById = async (id: string) => {
  const visit = await visitModel.findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'Visit not found');
  }
  return visit;
};

export const createVisit = async (
  visitData: Omit<visitModel.Visit, 'id' | 'created_at' | 'updated_at' | 'patient_name' | 'doctor_name' | 'patient_phone'>
) => {
  const visit = await visitModel.createVisit(visitData);
  
  // Auto-complete appointment if patient has an appointment today
  if (visitData.patient_id) {
    try {
      const { query } = await import('../config/database');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Find appointment for this patient today
      const result = await query(
        `SELECT id FROM appointments 
         WHERE patient_id = $1 
         AND start_at >= $2 
         AND start_at < $3 
         AND status NOT IN ('completed', 'cancelled', 'no-show')
         LIMIT 1`,
        [visitData.patient_id, today.toISOString(), tomorrow.toISOString()]
      );
      
      if (result.rows.length > 0) {
        // Update appointment status to completed
        await query(
          'UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2',
          ['completed', result.rows[0].id]
        );
      }
    } catch (error) {
      console.error('Error auto-completing appointment:', error);
      // Don't fail visit creation if appointment update fails
    }
  }
  
  return visit;
};

export const updateVisit = async (
  id: string,
  visitData: Partial<Omit<visitModel.Visit, 'id' | 'created_at' | 'updated_at' | 'patient_name' | 'doctor_name' | 'patient_phone'>>
) => {
  const existingVisit = await visitModel.findVisitById(id);
  if (!existingVisit) {
    throw new ApiError(404, 'Visit not found');
  }

  const updatedVisit = await visitModel.updateVisit(id, visitData);
  return updatedVisit;
};

export const deleteVisit = async (id: string) => {
  const visit = await visitModel.findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'Visit not found');
  }

  await visitModel.deleteVisit(id);
  return { message: 'Visit deleted successfully' };
};

export const getVisitStatistics = async () => {
  return await visitModel.getVisitStats();
};

export const getPatientVisitSummaries = async (filters: visitModel.VisitFilters = {}) => {
  return await visitModel.findPatientVisitSummaries(filters);
};

export const getPatientVisitHistory = async (patientId: string) => {
  return await visitModel.findPatientVisitHistory(patientId);
};
