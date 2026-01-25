import * as doctorModel from '../models/doctor.model';
import { Doctor } from '../models/doctor.model';
import ApiError from '../utils/ApiError';
import { deleteCache, getCache, setCache } from '../utils/cache';

const DOCTORS_CACHE_TTL_SECONDS = 60;
const DOCTORS_LIST_CACHE_KEY = 'doctors:list:all';
const DOCTORS_STATS_CACHE_KEY = 'doctors:stats';

const shouldCacheDoctorsList = (search?: string, offset?: number) => !search && (offset ?? 0) === 0;

export const getAllDoctors = async (
  search?: string,
  options: { limit?: number; offset?: number } = {}
) => {
  if (shouldCacheDoctorsList(search, options.offset)) {
    const cached = await getCache<Doctor[]>(DOCTORS_LIST_CACHE_KEY);
    if (cached) {
      return cached;
    }
  }

  const doctors = await doctorModel.findAllDoctors(search, options);
  if (shouldCacheDoctorsList(search, options.offset)) {
    await setCache(DOCTORS_LIST_CACHE_KEY, doctors, DOCTORS_CACHE_TTL_SECONDS);
  }
  return doctors;
};

export const getDoctorById = async (id: string) => {
  const doctor = await doctorModel.findDoctorById(id);

  if (!doctor) {
    throw ApiError.notFound('Doctor not found');
  }

  return doctor;
};

export const createDoctor = async (
  doctorData: Omit<Doctor, 'id' | 'created_at'>
) => {
  const doctor = await doctorModel.createDoctor(doctorData);
  await deleteCache(DOCTORS_LIST_CACHE_KEY);
  await deleteCache(DOCTORS_STATS_CACHE_KEY);
  return doctor;
};

export const updateDoctor = async (
  id: string,
  doctorData: Partial<Omit<Doctor, 'id' | 'created_at'>>
) => {
  const existingDoctor = await doctorModel.findDoctorById(id);

  if (!existingDoctor) {
    throw ApiError.notFound('Doctor not found');
  }

  const updated = await doctorModel.updateDoctor(id, doctorData);
  await deleteCache(DOCTORS_LIST_CACHE_KEY);
  await deleteCache(DOCTORS_STATS_CACHE_KEY);
  return updated;
};

export const deleteDoctor = async (id: string) => {
  const existingDoctor = await doctorModel.findDoctorById(id);

  if (!existingDoctor) {
    throw ApiError.notFound('Doctor not found');
  }

  const deleted = await doctorModel.deleteDoctor(id);

  if (!deleted) {
    throw ApiError.internal('Failed to delete doctor');
  }

  await deleteCache(DOCTORS_LIST_CACHE_KEY);
  await deleteCache(DOCTORS_STATS_CACHE_KEY);

  return true;
};

export const getDoctorStatistics = async () => {
  const cached = await getCache<Record<string, string | number>>(DOCTORS_STATS_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const stats = await doctorModel.getDoctorStats();
  await setCache(DOCTORS_STATS_CACHE_KEY, stats, DOCTORS_CACHE_TTL_SECONDS);
  return stats;
};
