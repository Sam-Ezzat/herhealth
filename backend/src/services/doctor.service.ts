import * as doctorModel from '../models/doctor.model';
import { Doctor } from '../models/doctor.model';
import ApiError from '../utils/ApiError';

export const getAllDoctors = async (search?: string) => {
  return await doctorModel.findAllDoctors(search);
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
  return await doctorModel.createDoctor(doctorData);
};

export const updateDoctor = async (
  id: string,
  doctorData: Partial<Omit<Doctor, 'id' | 'created_at'>>
) => {
  const existingDoctor = await doctorModel.findDoctorById(id);

  if (!existingDoctor) {
    throw ApiError.notFound('Doctor not found');
  }

  return await doctorModel.updateDoctor(id, doctorData);
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

  return true;
};

export const getDoctorStatistics = async () => {
  return await doctorModel.getDoctorStats();
};
