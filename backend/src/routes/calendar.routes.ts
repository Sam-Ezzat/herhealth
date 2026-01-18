import express from 'express';
import * as calendarController from '../controllers/calendar.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as calendarValidator from '../validators/calendar.validator';

const router = express.Router();

// Get all calendars
router.get('/', authenticate, calendarController.getAllCalendars);

// Calendar CRUD
router.get('/:id', authenticate, calendarController.getCalendarById);
router.post('/', authenticate, validate(calendarValidator.createCalendarSchema), calendarController.createCalendar);
router.put('/:id', authenticate, validate(calendarValidator.updateCalendarSchema), calendarController.updateCalendar);
router.delete('/:id', authenticate, calendarController.deleteCalendar);

// Doctor Calendar
router.get('/doctor/:doctorId', authenticate, calendarController.getDoctorCalendar);

// Working Hours
router.get('/:calendarId/working-hours', authenticate, calendarController.getWorkingHours);
router.post('/:calendarId/working-hours', authenticate, validate(calendarValidator.createWorkingHoursSchema), calendarController.createWorkingHours);
router.put('/working-hours/:id', authenticate, validate(calendarValidator.updateWorkingHoursSchema), calendarController.updateWorkingHours);
router.delete('/working-hours/:id', authenticate, calendarController.deleteWorkingHours);

// Time Slots
router.get('/:calendarId/time-slots', authenticate, calendarController.getTimeSlots);
router.post('/:calendarId/time-slots', authenticate, validate(calendarValidator.createTimeSlotSchema), calendarController.createTimeSlot);
router.put('/time-slots/:id', authenticate, validate(calendarValidator.updateTimeSlotSchema), calendarController.updateTimeSlot);

// Exceptions (Holidays, Vacations, Emergency Closures)
router.get('/:calendarId/exceptions', authenticate, calendarController.getExceptions);
router.post('/:calendarId/exceptions', authenticate, calendarController.createException);
router.put('/exceptions/:id', authenticate, calendarController.updateException);
router.delete('/exceptions/:id', authenticate, calendarController.deleteException);

// Preview affected appointments
router.get('/:calendarId/affected-appointments', authenticate, calendarController.previewAffectedAppointments);

// Get available time slots for a doctor on a specific date
router.get('/available-slots', authenticate, calendarController.getAvailableTimeSlotsForDoctor);

// Block time range
router.post('/:calendarId/block-time-range', authenticate, calendarController.blockTimeRange);

// Emergency cancel range
router.post('/:calendarId/emergency-cancel', authenticate, calendarController.emergencyCancelRange);

export default router;
