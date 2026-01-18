import * as PatientModel from '../models/patient.model';
import ApiError from '../utils/ApiError';

export const getAllPatients = async (params: PatientModel.PatientSearchParams) => {
  return await PatientModel.findAllPatients(params);
};

export const getPatientById = async (id: string) => {
  const patient = await PatientModel.findPatientById(id);
  
  if (!patient) {
    throw ApiError.notFound('Patient not found');
  }
  
  return patient;
};

export const createPatient = async (
  patientData: Omit<PatientModel.Patient, 'id' | 'created_at' | 'updated_at'>,
  userId: string
) => {
  // Check if patient with same phone already exists
  const existingPatient = await PatientModel.findPatientByPhone(patientData.phone);
  
  if (existingPatient) {
    throw ApiError.conflict('A patient with this phone number already exists');
  }

  // Validate date of birth (not in future)
  const dob = new Date(patientData.date_of_birth);
  if (dob > new Date()) {
    throw ApiError.badRequest('Date of birth cannot be in the future');
  }

  return await PatientModel.createPatient(patientData);
};

export const updatePatient = async (
  id: string,
  patientData: Partial<Omit<PatientModel.Patient, 'id' | 'created_at' | 'updated_at'>>,
  userId: string
) => {
  // Check if patient exists
  const existingPatient = await PatientModel.findPatientById(id);
  
  if (!existingPatient) {
    throw ApiError.notFound('Patient not found');
  }

  // If phone is being updated, check for duplicates
  if (patientData.phone && patientData.phone !== existingPatient.phone) {
    const duplicatePatient = await PatientModel.findPatientByPhone(patientData.phone);
    if (duplicatePatient) {
      throw ApiError.conflict('A patient with this phone number already exists');
    }
  }

  // Validate date of birth if provided
  if (patientData.date_of_birth) {
    const dob = new Date(patientData.date_of_birth);
    if (dob > new Date()) {
      throw ApiError.badRequest('Date of birth cannot be in the future');
    }
  }

  const updatedPatient = await PatientModel.updatePatient(id, patientData);
  
  if (!updatedPatient) {
    throw ApiError.notFound('Patient not found');
  }

  return updatedPatient;
};

export const deletePatient = async (id: string) => {
  // Check if patient exists
  const existingPatient = await PatientModel.findPatientById(id);
  
  if (!existingPatient) {
    throw ApiError.notFound('Patient not found');
  }

  const deleted = await PatientModel.deletePatient(id);
  
  if (!deleted) {
    throw ApiError.internal('Failed to delete patient');
  }

  return { message: 'Patient deleted successfully' };
};

export const getColorCodes = async () => {
  return await PatientModel.getAllColorCodes();
};

export const getPatientStatistics = async () => {
  return await PatientModel.getPatientStats();
};
