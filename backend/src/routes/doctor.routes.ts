import { Router } from 'express';
import * as doctorController from '../controllers/doctor.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as doctorValidator from '../validators/doctor.validator';

const router = Router();

// Get all doctors with search (protected)
router.get(
  '/',
  authenticate,
  validate(doctorValidator.searchDoctorsSchema, 'query'),
  doctorController.getAllDoctors
);

// Get doctor statistics (protected)
router.get('/stats', authenticate, doctorController.getDoctorStats);

// Get doctor by ID (protected)
router.get('/:id', authenticate, doctorController.getDoctorById);

// Create new doctor (protected)
router.post(
  '/',
  authenticate,
  validate(doctorValidator.createDoctorSchema),
  doctorController.createDoctor
);

// Update doctor (protected)
router.put(
  '/:id',
  authenticate,
  validate(doctorValidator.updateDoctorSchema),
  doctorController.updateDoctor
);

// Delete doctor (protected)
router.delete('/:id', authenticate, doctorController.deleteDoctor);

export default router;
