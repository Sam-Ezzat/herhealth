import { Request, Response, NextFunction } from 'express';
import * as CalendarService from '../services/calendar.service';

// Get all calendars
export const getAllCalendars = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const calendars = await CalendarService.getAllCalendars();
    
    res.json({
      success: true,
      data: calendars
    });
  } catch (error) {
    next(error);
  }
};

// Get calendar by ID
export const getCalendarById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const calendar = await CalendarService.getCalendarById(id);
    
    res.json({
      success: true,
      data: calendar
    });
  } catch (error) {
    next(error);
  }
};

// Create new calendar
export const createCalendar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const calendar = await CalendarService.createCalendar(req.body);
    
    res.status(201).json({
      success: true,
      data: calendar
    });
  } catch (error) {
    next(error);
  }
};

// Get or create doctor calendar
export const getDoctorCalendar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId } = req.params;
    const calendar = await CalendarService.getOrCreateDoctorCalendar(doctorId);
    
    res.json({
      success: true,
      data: calendar
    });
  } catch (error) {
    next(error);
  }
};

// Get all calendars for a specific doctor
export const getDoctorCalendars = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId } = req.params;
    const calendars = await CalendarService.getDoctorCalendars(doctorId);
    
    res.json({
      success: true,
      data: calendars
    });
  } catch (error) {
    next(error);
  }
};

// Update calendar
export const updateCalendar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const calendar = await CalendarService.updateCalendar(id, req.body);
    
    res.json({
      success: true,
      data: calendar
    });
  } catch (error) {
    next(error);
  }
};

// Delete calendar
export const deleteCalendar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await CalendarService.deleteCalendar(id);
    
    res.json({
      success: true,
      message: 'Calendar deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Working Hours
export const getWorkingHours = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { calendarId } = req.params;
    const hours = await CalendarService.getWorkingHours(calendarId);
    
    res.json({
      success: true,
      data: hours
    });
  } catch (error) {
    next(error);
  }
};

export const createWorkingHours = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { calendarId } = req.params;
    const hours = await CalendarService.addWorkingHours(calendarId, req.body);
    
    res.status(201).json({
      success: true,
      data: hours
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkingHours = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const hours = await CalendarService.updateWorkingHoursById(id, req.body);
    
    res.json({
      success: true,
      data: hours
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkingHours = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await CalendarService.removeWorkingHours(id);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// Time Slots
export const getTimeSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { calendarId } = req.params;
    const slots = await CalendarService.getTimeSlots(calendarId);
    
    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    next(error);
  }
};

export const createTimeSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { calendarId } = req.params;
    const slot = await CalendarService.addTimeSlot(calendarId, req.body);
    
    res.status(201).json({
      success: true,
      data: slot
    });
  } catch (error) {
    next(error);
  }
};

export const updateTimeSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const slot = await CalendarService.updateTimeSlotById(id, req.body);
    
    res.json({
      success: true,
      data: slot
    });
  } catch (error) {
    next(error);
  }
};

// Exceptions
export const getExceptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { calendarId } = req.params;
    const { startDate, endDate } = req.query;
    
    const exceptions = await CalendarService.getExceptions(
      calendarId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    res.json({
      success: true,
      data: exceptions
    });
  } catch (error) {
    next(error);
  }
};

export const createException = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { calendarId } = req.params;
    const userId = req.user?.id || '';
    
    const exception = await CalendarService.addException(calendarId, req.body, userId);
    
    res.status(201).json({
      success: true,
      data: exception
    });
  } catch (error) {
    next(error);
  }
};

export const updateException = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const exception = await CalendarService.updateExceptionById(id, req.body);
    
    res.json({
      success: true,
      data: exception
    });
  } catch (error) {
    next(error);
  }
};

export const deleteException = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await CalendarService.removeException(id);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// Preview affected appointments
export const previewAffectedAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { calendarId } = req.params;
    const { startDatetime, endDatetime } = req.query;
    
    if (!startDatetime || !endDatetime) {
      res.status(400).json({
        success: false,
        error: 'startDatetime and endDatetime are required'
      });
      return;
    }
    
    const appointments = await CalendarService.getAffectedAppointments(
      calendarId,
      new Date(startDatetime as string),
      new Date(endDatetime as string)
    );
    
    res.json({
      success: true,
      data: appointments,
      count: appointments.length
    });
  } catch (error) {
    next(error);
  }
};

// Get available time slots for a doctor on a specific date
export const getAvailableTimeSlotsForDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId, date, calendarId } = req.query;
    
    if (!doctorId || !date) {
      res.status(400).json({
        success: false,
        error: 'doctorId and date are required'
      });
      return;
    }
    
    const slotsData = await CalendarService.getAvailableTimeSlots(
      doctorId as string,
      date as string,
      calendarId as string | undefined
    );
    
    res.json({
      success: true,
      data: slotsData
    });
  } catch (error) {
    next(error);
  }
};

// Block time range
export const blockTimeRange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { calendarId } = req.params;
    const userId = req.user?.id || '';
    const { startDatetime, endDatetime, reason, cancelExisting, notifyPatients } = req.body;
    
    const result = await CalendarService.blockTimeRange(
      calendarId,
      new Date(startDatetime),
      new Date(endDatetime),
      reason,
      cancelExisting,
      notifyPatients,
      userId
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Emergency cancel range
export const emergencyCancelRange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { calendarId } = req.params;
    const userId = req.user?.id || '';
    const { startDatetime, endDatetime, reason } = req.body;
    
    const result = await CalendarService.emergencyCancelRange(
      calendarId,
      new Date(startDatetime),
      new Date(endDatetime),
      reason,
      userId
    );
    
    res.json({
      success: true,
      data: result,
      message: `Emergency cancellation completed. ${result.cancellation.cancelled} appointments cancelled, ${result.cancellation.notified} patients notified.`
    });
  } catch (error) {
    next(error);
  }
};

// Bulk reschedule range
export const bulkRescheduleRange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { calendarId } = req.params;
    const { startDatetime, endDatetime, method, offsetMinutes, targetTime, notifyPatients, appointmentIds } = req.body;

    const result = await CalendarService.bulkRescheduleRange(
      calendarId,
      new Date(startDatetime),
      new Date(endDatetime),
      method,
      { offsetMinutes, targetTime, appointmentIds },
      notifyPatients !== false
    );

    res.json({
      success: true,
      data: result,
      message: `Bulk reschedule completed. ${result.updated} updated, ${result.failed} failed.`
    });
  } catch (error) {
    next(error);
  }
};
