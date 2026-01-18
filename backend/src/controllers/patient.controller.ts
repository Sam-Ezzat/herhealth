import { Request, Response, NextFunction } from 'express';
import * as patientService from '../services/patient.service';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';

export const getAllPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, gender, colorCodeId, minAge, maxAge, limit, offset } = req.query;

    const params = {
      search: search as string,
      gender: gender as string,
      colorCodeId: colorCodeId as string,
      minAge: minAge ? parseInt(minAge as string) : undefined,
      maxAge: maxAge ? parseInt(maxAge as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    };

    const result = await patientService.getAllPatients(params);

    res.json(ApiResponse.success(result, 'Patients retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const getPatientById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const patient = await patientService.getPatientById(id);

    res.json(ApiResponse.success(patient, 'Patient retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const createPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('User not authenticated');
    }

    const patient = await patientService.createPatient(req.body, req.user.id);

    res.status(201).json(ApiResponse.success(patient, 'Patient created successfully'));
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('User not authenticated');
    }

    const { id } = req.params;

    const patient = await patientService.updatePatient(id, req.body, req.user.id);

    res.json(ApiResponse.success(patient, 'Patient updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deletePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await patientService.deletePatient(id);

    res.json(ApiResponse.success(result, 'Patient deleted successfully'));
  } catch (error) {
    next(error);
  }
};

export const getColorCodes = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const colorCodes = await patientService.getColorCodes();

    res.json(ApiResponse.success(colorCodes, 'Color codes retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const getPatientStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await patientService.getPatientStatistics();

    res.json(ApiResponse.success(stats, 'Patient statistics retrieved successfully'));
  } catch (error) {
    next(error);
  }
};
