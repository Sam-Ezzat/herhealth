import * as visitPaymentModel from '../models/visit-payment.model';
import * as visitModel from '../models/visit.model';
import ApiError from '../utils/ApiError';

// Get payment by visit ID
export const getPaymentByVisitId = async (visitId: string) => {
  // Verify visit exists
  const visit = await visitModel.findVisitById(visitId);
  if (!visit) {
    throw ApiError.notFound('Visit not found');
  }
  
  const payment = await visitPaymentModel.findPaymentByVisitId(visitId);
  return payment;
};

// Get payment by ID
export const getPaymentById = async (paymentId: string) => {
  const payment = await visitPaymentModel.findPaymentById(paymentId);
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }
  return payment;
};

// Get all payments for a patient
export const getPatientPayments = async (patientId: string) => {
  return await visitPaymentModel.findPaymentsByPatientId(patientId);
};

// Get unpaid visits for a patient
export const getUnpaidVisits = async (patientId: string) => {
  return await visitPaymentModel.findUnpaidVisitsByPatientId(patientId);
};

// Create payment
export const createPayment = async (
  paymentData: visitPaymentModel.CreateVisitPaymentData
) => {
  // Verify visit exists
  const visit = await visitModel.findVisitById(paymentData.visit_id);
  if (!visit) {
    throw ApiError.notFound('Visit not found');
  }
  
  // Check if payment already exists for this visit
  const existingPayment = await visitPaymentModel.findPaymentByVisitId(paymentData.visit_id);
  if (existingPayment) {
    throw ApiError.badRequest('Payment already exists for this visit');
  }
  
  // Verify patient matches visit
  if (visit.patient_id !== paymentData.patient_id) {
    throw ApiError.badRequest('Patient ID does not match visit patient');
  }
  
  // If method is ReConsultation and amount not provided, set to 0
  if (paymentData.method === 'ReConsultation' && !paymentData.amount) {
    paymentData.amount = 0;
  }
  
  return await visitPaymentModel.createPayment(paymentData);
};

// Update payment
export const updatePayment = async (
  paymentId: string,
  paymentData: visitPaymentModel.UpdateVisitPaymentData
) => {
  // Verify payment exists
  const existingPayment = await visitPaymentModel.findPaymentById(paymentId);
  if (!existingPayment) {
    throw ApiError.notFound('Payment not found');
  }
  
  return await visitPaymentModel.updatePayment(paymentId, paymentData);
};

// Delete payment
export const deletePayment = async (paymentId: string) => {
  const payment = await visitPaymentModel.findPaymentById(paymentId);
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }
  
  await visitPaymentModel.deletePayment(paymentId);
  return { message: 'Payment deleted successfully' };
};

// Get patient payment statistics
export const getPatientPaymentStats = async (patientId: string) => {
  return await visitPaymentModel.getPatientPaymentStats(patientId);
};

// Get today's payment statistics
export const getTodayPaymentStats = async () => {
  return await visitPaymentModel.getTodayPaymentStats();
};
