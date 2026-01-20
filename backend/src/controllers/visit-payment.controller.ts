import { Request, Response, NextFunction } from 'express';
import * as visitPaymentService from '../services/visit-payment.service';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';

// Get payment by visit ID
export const getPaymentByVisitId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { visitId } = req.params;
    const payment = await visitPaymentService.getPaymentByVisitId(visitId);
    
    if (!payment) {
      res.json(ApiResponse.success(null, 'No payment found for this visit'));
      return;
    }
    
    res.json(ApiResponse.success(payment, 'Payment retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

// Get payment by ID
export const getPaymentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const payment = await visitPaymentService.getPaymentById(paymentId);
    res.json(ApiResponse.success(payment, 'Payment retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

// Get all payments for a patient
export const getPatientPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const payments = await visitPaymentService.getPatientPayments(patientId);
    res.json(ApiResponse.success(payments, 'Patient payments retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

// Get unpaid visits for a patient
export const getUnpaidVisits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const visits = await visitPaymentService.getUnpaidVisits(patientId);
    res.json(ApiResponse.success(visits, 'Unpaid visits retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

// Create payment
export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('User not authenticated');
    }
    
    const paymentData = {
      ...req.body,
      created_by: req.user.id
    };
    
    const payment = await visitPaymentService.createPayment(paymentData);
    res.status(201).json(ApiResponse.success(payment, 'Payment created successfully'));
  } catch (error) {
    next(error);
  }
};

// Update payment
export const updatePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const payment = await visitPaymentService.updatePayment(paymentId, req.body);
    res.json(ApiResponse.success(payment, 'Payment updated successfully'));
  } catch (error) {
    next(error);
  }
};

// Delete payment
export const deletePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const result = await visitPaymentService.deletePayment(paymentId);
    res.json(ApiResponse.success(result, 'Payment deleted successfully'));
  } catch (error) {
    next(error);
  }
};

// Get patient payment statistics
export const getPatientPaymentStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const stats = await visitPaymentService.getPatientPaymentStats(patientId);
    res.json(ApiResponse.success(stats, 'Payment statistics retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

// Get today's payment statistics
export const getTodayPaymentStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await visitPaymentService.getTodayPaymentStats();
    res.json(ApiResponse.success(stats, 'Today\'s payment statistics retrieved successfully'));
  } catch (error) {
    next(error);
  }
};
