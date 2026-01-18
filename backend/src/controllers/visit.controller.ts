import { Request, Response, NextFunction } from 'express';
import * as visitService from '../services/visit.service';
import ApiResponse from '../utils/ApiResponse';

export const getAllVisits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      patient_id: req.query.patient_id as string,
      doctor_id: req.query.doctor_id as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      search: req.query.search as string,
    };

    const visits = await visitService.getAllVisits(filters);
    res.json(ApiResponse.success(visits));
  } catch (error) {
    next(error);
  }
};

export const getVisitById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visit = await visitService.getVisitById(req.params.id);
    res.json(ApiResponse.success(visit));
  } catch (error) {
    next(error);
  }
};

export const createVisit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visit = await visitService.createVisit(req.body);
    res.status(201).json(ApiResponse.success(visit, 'Visit created successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateVisit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visit = await visitService.updateVisit(req.params.id, req.body);
    res.json(ApiResponse.success(visit, 'Visit updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteVisit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await visitService.deleteVisit(req.params.id);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

export const getVisitStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await visitService.getVisitStatistics();
    res.json(ApiResponse.success(stats));
  } catch (error) {
    next(error);
  }
};

export const getPatientVisitSummaries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      search: req.query.search as string,
    };
    const summaries = await visitService.getPatientVisitSummaries(filters);
    res.json(ApiResponse.success(summaries));
  } catch (error) {
    next(error);
  }
};

export const getPatientVisitHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.params.patientId;
    const history = await visitService.getPatientVisitHistory(patientId);
    res.json(ApiResponse.success(history));
  } catch (error) {
    next(error);
  }
};
