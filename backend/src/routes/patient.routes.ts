import { Router } from 'express';
import * as patientController from '../controllers/patient.controller';
import { authenticate } from '../middleware/auth';
import { authorize as checkPermissions } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import * as patientValidator from '../validators/patient.validator';
import { Permissions } from '../constants/permissions';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all patients with search/filter
router.get(
  '/',
  checkPermissions([Permissions.PATIENTS_VIEW]),
  validate(patientValidator.searchPatientsSchema, 'query'),
  patientController.getAllPatients
);

// Get patient statistics
router.get(
  '/stats',
  checkPermissions([Permissions.STATS_VIEW_BASIC, Permissions.STATS_VIEW_ALL]),
  patientController.getPatientStats
);

// Get color codes
router.get(
  '/color-codes',
  checkPermissions([Permissions.COLORCODES_VIEW]),
  patientController.getColorCodes
);

// Get patient by ID
router.get(
  '/:id',
  checkPermissions([Permissions.PATIENTS_VIEW]),
  patientController.getPatientById
);

// Create new patient
router.post(
  '/',
  checkPermissions([Permissions.PATIENTS_CREATE]),
  validate(patientValidator.createPatientSchema),
  patientController.createPatient
);

// Update patient
router.put(
  '/:id',
  checkPermissions([Permissions.PATIENTS_UPDATE]),
  validate(patientValidator.updatePatientSchema),
  patientController.updatePatient
);

// Delete patient
router.delete(
  '/:id',
  checkPermissions([Permissions.PATIENTS_DELETE]),
  patientController.deletePatient
);

export default router;
