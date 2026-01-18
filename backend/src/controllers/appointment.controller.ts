import { Request, Response, NextFunction } from 'express';
import * as appointmentService from '../services/appointment.service';
import ApiResponse from '../utils/ApiResponse';

export const getAllAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      patient_id: req.query.patient_id as string,
      doctor_id: req.query.doctor_id as string,
      status: req.query.status as string,
      type: req.query.type as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      search: req.query.search as string,
    };

    const appointments = await appointmentService.getAllAppointments(filters);
    res.json(ApiResponse.success(appointments));
  } catch (error) {
    next(error);
  }
};

export const getAppointmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);
    res.json(ApiResponse.success(appointment));
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add created_by from the authenticated user
    const appointmentData = {
      ...req.body,
      created_by: (req as any).user?.id, // Get user ID from auth middleware
    };
    const appointment = await appointmentService.createAppointment(appointmentData);
    res.status(201).json(ApiResponse.success(appointment, 'Appointment created successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await appointmentService.updateAppointment(req.params.id, req.body);
    res.json(ApiResponse.success(appointment, 'Appointment updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await appointmentService.deleteAppointment(req.params.id);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

export const getAppointmentStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await appointmentService.getAppointmentStatistics();
    res.json(ApiResponse.success(stats));
  } catch (error) {
    next(error);
  }
};
