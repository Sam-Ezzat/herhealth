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
  return await visitModel.createVisit(visitData);
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
