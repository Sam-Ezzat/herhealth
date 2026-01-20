import { Router } from 'express';
import * as visitPaymentController from '../controllers/visit-payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Payment routes
router.get('/visits/:visitId/payment', visitPaymentController.getPaymentByVisitId);
router.post('/payments', visitPaymentController.createPayment);
router.get('/payments/:paymentId', visitPaymentController.getPaymentById);
router.put('/payments/:paymentId', visitPaymentController.updatePayment);
router.delete('/payments/:paymentId', visitPaymentController.deletePayment);

// Patient-specific routes
router.get('/patients/:patientId/payments', visitPaymentController.getPatientPayments);
router.get('/patients/:patientId/payments/stats', visitPaymentController.getPatientPaymentStats);
router.get('/patients/:patientId/visits/unpaid', visitPaymentController.getUnpaidVisits);

// Today's statistics
router.get('/payments/stats/today', visitPaymentController.getTodayPaymentStats);

export default router;
