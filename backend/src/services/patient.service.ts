import * as PatientModel from '../models/patient.model';
import ApiError from '../utils/ApiError';
import { deleteCache, getCache, setCache } from '../utils/cache';

const PATIENTS_CACHE_TTL_SECONDS = 60;
const PATIENTS_LIST_CACHE_KEY = 'patients:list:all';
const PATIENTS_STATS_CACHE_KEY = 'patients:stats';
const PATIENTS_COLOR_CODES_CACHE_KEY = 'patients:color-codes';

const shouldCachePatientsList = (params: PatientModel.PatientSearchParams) => {
  const { search, gender, colorCodeId, minAge, maxAge, offset } = params;
  return !search && !gender && !colorCodeId && minAge === undefined && maxAge === undefined && (offset ?? 0) === 0;
};

export const getAllPatients = async (params: PatientModel.PatientSearchParams) => {
  if (shouldCachePatientsList(params)) {
    const cached = await getCache<{ patients: PatientModel.PatientWithColorCode[]; total: number }>(PATIENTS_LIST_CACHE_KEY);
    if (cached) {
      return cached;
    }
  }

  const result = await PatientModel.findAllPatients(params);
  if (shouldCachePatientsList(params)) {
    await setCache(PATIENTS_LIST_CACHE_KEY, result, PATIENTS_CACHE_TTL_SECONDS);
  }
  return result;
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

  const patient = await PatientModel.createPatient(patientData);
  await deleteCache(PATIENTS_LIST_CACHE_KEY);
  await deleteCache(PATIENTS_STATS_CACHE_KEY);
  return patient;
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

  await deleteCache(PATIENTS_LIST_CACHE_KEY);
  await deleteCache(PATIENTS_STATS_CACHE_KEY);
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

  await deleteCache(PATIENTS_LIST_CACHE_KEY);
  await deleteCache(PATIENTS_STATS_CACHE_KEY);
  return { message: 'Patient deleted successfully' };
};

export const getColorCodes = async () => {
  const cached = await getCache<PatientModel.ColorCode[]>(PATIENTS_COLOR_CODES_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const colorCodes = await PatientModel.getAllColorCodes();
  await setCache(PATIENTS_COLOR_CODES_CACHE_KEY, colorCodes, PATIENTS_CACHE_TTL_SECONDS);
  return colorCodes;
};

export const getPatientStatistics = async () => {
  const cached = await getCache<Record<string, string | number>>(PATIENTS_STATS_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const stats = await PatientModel.getPatientStats();
  await setCache(PATIENTS_STATS_CACHE_KEY, stats, PATIENTS_CACHE_TTL_SECONDS);
  return stats;
};
