import { Router } from 'express';
import * as appointmentController from '../controllers/appointment.controller';
import * as appointmentValidator from '../validators/appointment.validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.get(
  '/',
  authenticate,
  validate(appointmentValidator.searchAppointmentsSchema),
  appointmentController.getAllAppointments
);

router.get('/stats', authenticate, appointmentController.getAppointmentStats);

router.get('/:id', authenticate, appointmentController.getAppointmentById);

router.post(
  '/',
  authenticate,
  validate(appointmentValidator.createAppointmentSchema),
  appointmentController.createAppointment
);

router.put(
  '/:id',
  authenticate,
  validate(appointmentValidator.updateAppointmentSchema),
  appointmentController.updateAppointment
);

router.delete('/:id', authenticate, appointmentController.deleteAppointment);

export default router;
