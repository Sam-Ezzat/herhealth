import { Router } from 'express';
import * as visitController from '../controllers/visit.controller';
import * as pregnancyTrackingController from '../controllers/pregnancy-tracking.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Specific routes MUST come before parameterized routes
router.get('/stats', visitController.getVisitStatistics);
router.get('/patient-summaries', visitController.getPatientVisitSummaries);
router.get('/patient/:patientId/history', visitController.getPatientVisitHistory);
router.get('/patient/:patientId/pregnancy-journey', pregnancyTrackingController.getPregnancyJourney);
router.put('/patient/:patientId/pregnancy-tracking', pregnancyTrackingController.updatePregnancyTracking);
router.post('/pregnancy/calculate-week', pregnancyTrackingController.calculatePregnancyWeek);

// General CRUD routes (parameterized routes come last)
router.get('/', visitController.getAllVisits);
router.get('/:id', visitController.getVisitById);
router.post('/', visitController.createVisit);
router.put('/:id', visitController.updateVisit);
router.delete('/:id', visitController.deleteVisit);

export default router;
