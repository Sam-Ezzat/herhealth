import express from 'express';
import * as pregnancyController from '../controllers/pregnancy.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { Permissions } from '../constants/permissions';

const router = express.Router();

// All pregnancy routes require authentication
router.use(authenticate);

// Get all pregnancies for a patient
router.get(
  '/patient/:patientId',
  authorize([Permissions.PREGNANCY_VIEW]),
  pregnancyController.getPatientPregnancies
);

// Get active pregnancy journey for a patient
router.get(
  '/patient/:patientId/active-journey',
  authorize([Permissions.PREGNANCY_VIEW]),
  pregnancyController.getActivePregnancyJourney
);

// Create new pregnancy for a patient
router.post(
  '/patient/:patientId',
  authorize([Permissions.PREGNANCY_UPDATE]),
  pregnancyController.createPregnancy
);

// Get specific pregnancy details
router.get(
  '/:pregnancyId',
  authorize([Permissions.PREGNANCY_VIEW]),
  pregnancyController.getPregnancy
);

// Get complete pregnancy journey with visits
router.get(
  '/:pregnancyId/journey',
  authorize([Permissions.PREGNANCY_VIEW]),
  pregnancyController.getPregnancyJourney
);

// Update pregnancy
router.put(
  '/:pregnancyId',
  authorize([Permissions.PREGNANCY_UPDATE]),
  pregnancyController.updatePregnancy
);

// Mark pregnancy as delivered
router.post(
  '/:pregnancyId/deliver',
  authorize([Permissions.PREGNANCY_UPDATE]),
  pregnancyController.markAsDelivered
);

// Delete pregnancy
router.delete(
  '/:pregnancyId',
  authorize([Permissions.PATIENTS_DELETE]),
  pregnancyController.deletePregnancy
);

// Create OB record for a visit
router.post(
  '/ob-record',
  authorize([Permissions.PREGNANCY_UPDATE]),
  pregnancyController.createOBRecord
);

// Update OB record for a visit
router.put(
  '/ob-record/visit/:visitId',
  authorize([Permissions.PREGNANCY_UPDATE]),
  pregnancyController.updateOBRecord
);

export default router;
