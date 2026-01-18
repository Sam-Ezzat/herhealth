import * as pregnancyModel from '../models/pregnancy.model';
import ApiError from '../utils/ApiError';

// Get all pregnancies for a patient
export const getPregnanciesByPatientId = async (patientId: string) => {
  return await pregnancyModel.findPregnanciesByPatientId(patientId);
};

// Get specific pregnancy with details
export const getPregnancyById = async (pregnancyId: string) => {
  const pregnancy = await pregnancyModel.findPregnancyById(pregnancyId);
  
  if (!pregnancy) {
    throw ApiError.notFound('Pregnancy not found');
  }
  
  return pregnancy;
};

// Get complete pregnancy journey with all visits
export const getPregnancyJourneyById = async (pregnancyId: string) => {
  const journey = await pregnancyModel.findPregnancyJourneyById(pregnancyId);
  
  if (!journey) {
    throw ApiError.notFound('Pregnancy journey not found');
  }
  
  return journey;
};

// Get active pregnancy journey for patient
export const getActivePregnancyJourneyByPatientId = async (patientId: string) => {
  const journey = await pregnancyModel.findActivePregnancyJourneyByPatientId(patientId);
  
  if (!journey) {
    throw ApiError.notFound('No active pregnancy found for this patient');
  }
  
  return journey;
};

// Create new pregnancy
export const createPregnancy = async (data: {
  patient_id: string;
  lmp: Date | string;
  edd?: Date | string;
  gravida?: number;
  para?: number;
  abortion?: number;
  living?: number;
  risk_flags?: string;
  status?: 'active' | 'delivered' | 'terminated' | 'miscarriage';
}) => {
  // Calculate EDD if not provided
  let edd = data.edd;
  if (!edd && data.lmp) {
    const lmpDate = new Date(data.lmp);
    const eddDate = new Date(lmpDate);
    eddDate.setDate(eddDate.getDate() + 280); // 40 weeks
    edd = eddDate.toISOString().split('T')[0];
  }

  const pregnancyData: any = {
    patient_id: data.patient_id,
    lmp: data.lmp,
    edd: edd || data.lmp,
    gravida: data.gravida || 1,
    para: data.para || 0,
    abortion: data.abortion || 0,
    living: data.living || 0,
    risk_flags: data.risk_flags,
    status: data.status || 'active',
  };

  return await pregnancyModel.createPregnancy(pregnancyData);
};

// Update pregnancy
export const updatePregnancy = async (
  pregnancyId: string,
  data: Partial<{
    lmp: Date | string;
    edd: Date | string;
    gravida: number;
    para: number;
    abortion: number;
    living: number;
    risk_flags: string;
    status: 'active' | 'delivered' | 'terminated' | 'miscarriage';
    delivery_date: Date | string;
    delivery_type: string;
    baby_weight_kg: number;
    complications: string;
    outcome: string;
  }>
) => {
  // Convert string dates to Date objects
  const updateData: any = { ...data };
  if (updateData.lmp && typeof updateData.lmp === 'string') {
    updateData.lmp = new Date(updateData.lmp);
  }
  if (updateData.edd && typeof updateData.edd === 'string') {
    updateData.edd = new Date(updateData.edd);
  }
  if (updateData.delivery_date && typeof updateData.delivery_date === 'string') {
    updateData.delivery_date = new Date(updateData.delivery_date);
  }
  
  const pregnancy = await pregnancyModel.updatePregnancy(pregnancyId, updateData);
  
  if (!pregnancy) {
    throw ApiError.notFound('Pregnancy not found');
  }
  
  return pregnancy;
};

// Mark pregnancy as delivered
export const markPregnancyAsDelivered = async (
  pregnancyId: string,
  deliveryData: {
    delivery_date: Date | string;
    delivery_type?: string;
    baby_weight_kg?: number;
    complications?: string;
    outcome?: string;
  }
) => {
  // Convert string date to Date object
  const data: any = { ...deliveryData };
  if (data.delivery_date && typeof data.delivery_date === 'string') {
    data.delivery_date = new Date(data.delivery_date);
  }
  
  return await pregnancyModel.updatePregnancy(pregnancyId, {
    ...data,
    status: 'delivered',
  });
};

// Delete pregnancy
export const deletePregnancy = async (pregnancyId: string) => {
  const deleted = await pregnancyModel.deletePregnancy(pregnancyId);
  
  if (!deleted) {
    throw ApiError.notFound('Pregnancy not found');
  }
  
  return { message: 'Pregnancy deleted successfully' };
};

// Create OB record for a visit
export const createOBRecord = async (data: {
  pregnancy_id: string;
  visit_id: string;
  record_date: Date | string;
  pregnancy_week?: number;
  weight_kg?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  fundal_height_cm?: number;
  fetal_heart_rate?: string;
  notes?: string;
}) => {
  // Convert string date to Date object
  const obData: any = { ...data };
  if (obData.record_date && typeof obData.record_date === 'string') {
    obData.record_date = new Date(obData.record_date);
  }
  
  return await pregnancyModel.createOBRecord(obData);
};

// Update OB record
export const updateOBRecord = async (
  visitId: string,
  data: Partial<{
    weight_kg: number;
    bp_systolic: number;
    bp_diastolic: number;
    fundal_height_cm: number;
    fetal_heart_rate: string;
    notes: string;
  }>
) => {
  const obRecord = await pregnancyModel.updateOBRecord(visitId, data);
  
  if (!obRecord) {
    throw ApiError.notFound('OB record not found for this visit');
  }
  
  return obRecord;
};
