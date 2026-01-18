import { Request, Response, NextFunction } from 'express';
import * as pregnancyService from '../services/pregnancy.service';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';

// Get all pregnancies for a patient
export const getPatientPregnancies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { patientId } = req.params;
    const pregnancies = await pregnancyService.getPregnanciesByPatientId(patientId);
    
    res.json(ApiResponse.success(pregnancies, 'Pregnancies retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

// Get specific pregnancy
export const getPregnancy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { pregnancyId } = req.params;
    const pregnancy = await pregnancyService.getPregnancyById(pregnancyId);
    
    res.json(ApiResponse.success(pregnancy, 'Pregnancy retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

// Get complete pregnancy journey with visits
export const getPregnancyJourney = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { pregnancyId } = req.params;
    const journey = await pregnancyService.getPregnancyJourneyById(pregnancyId);
    
    res.json(ApiResponse.success(journey, 'Pregnancy journey retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

// Get active pregnancy journey for patient
export const getActivePregnancyJourney = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { patientId } = req.params;
    const journey = await pregnancyService.getActivePregnancyJourneyByPatientId(patientId);
    
    res.json(ApiResponse.success(journey, 'Active pregnancy journey retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

// Create new pregnancy
export const createPregnancy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { patientId } = req.params;
    const pregnancyData = {
      ...req.body,
      patient_id: patientId,
    };
    
    const pregnancy = await pregnancyService.createPregnancy(pregnancyData);
    
    res.status(201).json(ApiResponse.success(pregnancy, 'Pregnancy created successfully'));
  } catch (error) {
    next(error);
  }
};

// Update pregnancy
export const updatePregnancy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { pregnancyId } = req.params;
    const pregnancy = await pregnancyService.updatePregnancy(pregnancyId, req.body);
    
    res.json(ApiResponse.success(pregnancy, 'Pregnancy updated successfully'));
  } catch (error) {
    next(error);
  }
};

// Mark pregnancy as delivered
export const markAsDelivered = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { pregnancyId } = req.params;
    const pregnancy = await pregnancyService.markPregnancyAsDelivered(
      pregnancyId,
      req.body
    );
    
    res.json(ApiResponse.success(pregnancy, 'Pregnancy marked as delivered'));
  } catch (error) {
    next(error);
  }
};

// Delete pregnancy
export const deletePregnancy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { pregnancyId } = req.params;
    const result = await pregnancyService.deletePregnancy(pregnancyId);
    
    res.json(ApiResponse.success(result, 'Pregnancy deleted successfully'));
  } catch (error) {
    next(error);
  }
};

// Create OB record for visit
export const createOBRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const obRecord = await pregnancyService.createOBRecord(req.body);
    
    res.status(201).json(ApiResponse.success(obRecord, 'OB record created successfully'));
  } catch (error) {
    next(error);
  }
};

// Update OB record
export const updateOBRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { visitId } = req.params;
    const obRecord = await pregnancyService.updateOBRecord(visitId, req.body);
    
    res.json(ApiResponse.success(obRecord, 'OB record updated successfully'));
  } catch (error) {
    next(error);
  }
};
