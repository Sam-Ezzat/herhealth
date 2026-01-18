import { Request, Response, NextFunction } from 'express';
import * as doctorService from '../services/doctor.service';
import ApiResponse from '../utils/ApiResponse';

export const getAllDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    const doctors = await doctorService.getAllDoctors(search as string);

    res.json(ApiResponse.success(doctors, 'Doctors retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const getDoctorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doctor = await doctorService.getDoctorById(id);

    res.json(ApiResponse.success(doctor, 'Doctor retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const createDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await doctorService.createDoctor(req.body);

    res.status(201).json(ApiResponse.success(doctor, 'Doctor created successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doctor = await doctorService.updateDoctor(id, req.body);

    res.json(ApiResponse.success(doctor, 'Doctor updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await doctorService.deleteDoctor(id);

    res.json(ApiResponse.success(null, 'Doctor deleted successfully'));
  } catch (error) {
    next(error);
  }
};

export const getDoctorStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await doctorService.getDoctorStatistics();

    res.json(ApiResponse.success(stats, 'Doctor statistics retrieved successfully'));
  } catch (error) {
    next(error);
  }
};
