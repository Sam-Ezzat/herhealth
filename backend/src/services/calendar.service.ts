import * as CalendarModel from '../models/calendar.model';
import * as AppointmentModel from '../models/appointment.model';
import * as WhatsAppService from './whatsapp.service';
import ApiError from '../utils/ApiError';

// Get all calendars with working hours and time slots
export const getAllCalendars = async () => {
  // Get all active calendars directly from the model
  const calendars = await CalendarModel.findAllCalendars();
  
  // For each calendar, get working hours and time slots
  const calendarsWithDetails = await Promise.all(
    calendars.map(async (calendar: any) => {
      const working_hours = await CalendarModel.findWorkingHoursByCalendarId(calendar.id);
      const time_slots = await CalendarModel.findTimeSlotsByCalendarId(calendar.id);
      
      return {
        ...calendar,
        working_hours,
        time_slots
      };
    })
  );
  
  return calendarsWithDetails;
};

// Doctor Calendar Management
export const getCalendarById = async (calendarId: string) => {
  const calendar = await CalendarModel.findCalendarById(calendarId);
  
  if (!calendar) {
    throw ApiError.notFound('Calendar not found');
  }
  
  const working_hours = await CalendarModel.findWorkingHoursByCalendarId(calendarId);
  const time_slots = await CalendarModel.findTimeSlotsByCalendarId(calendarId);
  
  return {
    ...calendar,
    working_hours,
    time_slots
  };
};

export const getOrCreateDoctorCalendar = async (doctorId: string) => {
  let calendar = await CalendarModel.findCalendarByDoctorId(doctorId);
  
  if (!calendar) {
    // Create default calendar for doctor
    calendar = await CalendarModel.createDoctorCalendar({
      doctor_id: doctorId,
      name: 'Main Calendar',
      description: 'Default calendar',
      is_active: true,
      timezone: 'UTC',
      color_code: '#3B82F6',
      color_name: 'Blue'
    });
  }
  
  // Get working hours and time slots
  const working_hours = await CalendarModel.findWorkingHoursByCalendarId(calendar.id);
  const time_slots = await CalendarModel.findTimeSlotsByCalendarId(calendar.id);
  
  return {
    ...calendar,
    working_hours,
    time_slots
  };
};

// Get all calendars for a specific doctor
export const getDoctorCalendars = async (doctorId: string) => {
  const calendars = await CalendarModel.findCalendarsByDoctorId(doctorId);
  
  // For each calendar, get working hours and time slots
  const calendarsWithDetails = await Promise.all(
    calendars.map(async (calendar: any) => {
      const working_hours = await CalendarModel.findWorkingHoursByCalendarId(calendar.id);
      const time_slots = await CalendarModel.findTimeSlotsByCalendarId(calendar.id);
      
      return {
        ...calendar,
        working_hours,
        time_slots
      };
    })
  );
  
  return calendarsWithDetails;
};

export const createCalendar = async (calendarData: any) => {
  const calendar = await CalendarModel.createDoctorCalendar({
    doctor_id: calendarData.doctor_id,
    name: calendarData.name || 'Main Calendar',
    description: calendarData.description || 'Default calendar',
    is_active: calendarData.is_active !== undefined ? calendarData.is_active : true,
    timezone: calendarData.timezone || 'UTC',
    color_code: calendarData.color_code || '#3B82F6',
    color_name: calendarData.color_name || 'Blue',
    notes: calendarData.notes || null
  });
  
  return calendar;
};

export const updateCalendar = async (calendarId: string, calendarData: any) => {
  const updated = await CalendarModel.updateDoctorCalendar(calendarId, calendarData);
  
  if (!updated) {
    throw ApiError.notFound('Calendar not found');
  }
  
  return updated;
};

export const deleteCalendar = async (calendarId: string) => {
  // Check if calendar exists
  const calendar = await CalendarModel.findCalendarById(calendarId);
  if (!calendar) {
    throw ApiError.notFound('Calendar not found');
  }
  
  // Check if there are any future appointments
  const { query: dbQuery } = await import('../config/database');
  const futureAppointments = await dbQuery(
    `SELECT COUNT(*) as count FROM appointments 
     WHERE doctor_id = $1 
     AND start_at >= CURRENT_TIMESTAMP 
     AND status NOT IN ('cancelled', 'completed')`,
    [calendar.doctor_id]
  );
  
  if (futureAppointments.rows[0].count > 0) {
    throw ApiError.badRequest('Cannot delete calendar with future appointments. Please cancel or reschedule them first.');
  }
  
  // Soft delete by setting is_active to false instead of hard delete
  const updated = await CalendarModel.updateDoctorCalendar(calendarId, { is_active: false });
  
  return { message: 'Calendar deactivated successfully' };
};

// Working Hours Management
export const getWorkingHours = async (calendarId: string) => {
  return await CalendarModel.findWorkingHoursByCalendarId(calendarId);
};

export const addWorkingHours = async (calendarId: string, hoursData: any) => {
  // Validate calendar exists
  const calendar = await CalendarModel.findCalendarById(calendarId);
  if (!calendar) {
    throw ApiError.notFound('Calendar not found');
  }
  
  return await CalendarModel.createWorkingHours({
    calendar_id: calendarId,
    ...hoursData
  });
};

export const updateWorkingHoursById = async (id: string, hoursData: any) => {
  const updated = await CalendarModel.updateWorkingHours(id, hoursData);
  
  if (!updated) {
    throw ApiError.notFound('Working hours not found');
  }
  
  return updated;
};

export const removeWorkingHours = async (id: string) => {
  const deleted = await CalendarModel.deleteWorkingHours(id);
  
  if (!deleted) {
    throw ApiError.notFound('Working hours not found');
  }
  
  return { message: 'Working hours deleted successfully' };
};

// Time Slots Management
export const getTimeSlots = async (calendarId: string) => {
  return await CalendarModel.findTimeSlotsByCalendarId(calendarId);
};

export const addTimeSlot = async (calendarId: string, slotData: any) => {
  return await CalendarModel.createTimeSlot({
    calendar_id: calendarId,
    ...slotData
  });
};

export const updateTimeSlotById = async (id: string, slotData: any) => {
  const updated = await CalendarModel.updateTimeSlot(id, slotData);
  
  if (!updated) {
    throw ApiError.notFound('Time slot not found');
  }
  
  return updated;
};

// Calendar Exceptions Management
export const getExceptions = async (calendarId: string, startDate?: Date, endDate?: Date) => {
  return await CalendarModel.findExceptionsByCalendarId(calendarId, startDate, endDate);
};

export const addException = async (calendarId: string, exceptionData: any, userId: string) => {
  const exception = await CalendarModel.createException({
    calendar_id: calendarId,
    ...exceptionData,
    created_by: userId
  });
  
  // If cancel_appointments is true, cancel all affected appointments
  if (exceptionData.cancel_appointments) {
    await cancelAffectedAppointments(
      calendarId,
      exceptionData.start_datetime,
      exceptionData.end_datetime,
      exceptionData.reason,
      exceptionData.notify_patients,
      exceptionData.exception_type === 'emergency'
    );
  }
  
  return exception;
};

export const updateExceptionById = async (id: string, exceptionData: any) => {
  const updated = await CalendarModel.updateException(id, exceptionData);
  
  if (!updated) {
    throw ApiError.notFound('Exception not found');
  }
  
  return updated;
};

export const removeException = async (id: string) => {
  const deleted = await CalendarModel.deleteException(id);
  
  if (!deleted) {
    throw ApiError.notFound('Exception not found');
  }
  
  return { message: 'Exception deleted successfully' };
};

// Emergency Cancellation Feature
export const cancelAffectedAppointments = async (
  calendarId: string,
  startDatetime: Date,
  endDatetime: Date,
  reason: string,
  notifyPatients: boolean,
  isEmergency: boolean
): Promise<{ cancelled: number; notified: number }> => {
  try {
    // Get all affected appointments
    const appointments = await CalendarModel.findAffectedAppointments(calendarId, startDatetime, endDatetime);
    
    let cancelledCount = 0;
    let notifiedCount = 0;
    
    // Cancel each appointment
    for (const appointment of appointments) {
      try {
        // Update appointment status to cancelled
        await AppointmentModel.updateAppointment(appointment.id, {
          status: 'cancelled',
          notes: appointment.notes 
            ? `${appointment.notes}\n\nCancelled: ${reason}` 
            : `Cancelled: ${reason}`
        });
        
        cancelledCount++;
        
        // Send WhatsApp notification if requested
        if (notifyPatients) {
          try {
            await WhatsAppService.sendAppointmentCancelled(appointment.id, reason, isEmergency);
            notifiedCount++;
          } catch (notifyError) {
            console.error(`Failed to notify patient for appointment ${appointment.id}:`, notifyError);
            // Continue even if notification fails
          }
        }
      } catch (error) {
        console.error(`Failed to cancel appointment ${appointment.id}:`, error);
        // Continue with other appointments
      }
    }
    
    return {
      cancelled: cancelledCount,
      notified: notifiedCount
    };
  } catch (error: any) {
    console.error('Error cancelling affected appointments:', error);
    throw ApiError.internal('Failed to cancel appointments');
  }
};

// Get affected appointments (preview before cancelling)
export const getAffectedAppointments = async (
  calendarId: string,
  startDatetime: Date,
  endDatetime: Date
) => {
  return await CalendarModel.findAffectedAppointments(calendarId, startDatetime, endDatetime);
};

// Bulk operations for time range
export const blockTimeRange = async (
  calendarId: string,
  startDatetime: Date,
  endDatetime: Date,
  reason: string,
  cancelExisting: boolean,
  notifyPatients: boolean,
  userId: string
): Promise<any> => {
  // Create exception
  const exception = await CalendarModel.createException({
    calendar_id: calendarId,
    exception_type: 'block',
    start_datetime: startDatetime,
    end_datetime: endDatetime,
    reason,
    cancel_appointments: cancelExisting,
    notify_patients: notifyPatients,
    created_by: userId
  });
  
  let result: any = { exception };
  
  if (cancelExisting) {
    const cancellationResult = await cancelAffectedAppointments(
      calendarId,
      startDatetime,
      endDatetime,
      reason,
      notifyPatients,
      false
    );
    
    result.cancellation = cancellationResult;
  }
  
  return result;
};

export const emergencyCancelRange = async (
  calendarId: string,
  startDatetime: Date,
  endDatetime: Date,
  reason: string,
  userId: string
): Promise<any> => {
  // Create emergency exception
  const exception = await CalendarModel.createException({
    calendar_id: calendarId,
    exception_type: 'emergency',
    start_datetime: startDatetime,
    end_datetime: endDatetime,
    reason,
    cancel_appointments: true,
    notify_patients: true,
    created_by: userId
  });
  
  // Cancel all appointments and notify patients
  const cancellationResult = await cancelAffectedAppointments(
    calendarId,
    startDatetime,
    endDatetime,
    reason,
    true,
    true
  );
  
  return {
    exception,
    cancellation: cancellationResult
  };
};

// Get available time slots for a doctor on a specific date
export const getAvailableTimeSlots = async (doctorId: string, date: string, calendarId?: string) => {
  // Get doctor's calendar - use specific calendar if provided, otherwise get default
  let calendar;
  if (calendarId) {
    calendar = await CalendarModel.findCalendarById(calendarId);
    if (!calendar) {
      throw ApiError.notFound('Calendar not found');
    }
    // Verify calendar belongs to the doctor
    if (calendar.doctor_id !== doctorId) {
      throw ApiError.forbidden('Calendar does not belong to this doctor');
    }
  } else {
    calendar = await CalendarModel.findCalendarByDoctorId(doctorId);
    if (!calendar) {
      throw ApiError.notFound('Calendar not found for this doctor');
    }
  }

  // Parse the date
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday

  // Get working hours for this day
  const workingHours = await CalendarModel.findWorkingHoursByCalendarId(calendar.id);
  const dayHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);

  // If no working hours or day is closed, return empty slots
  if (!dayHours || !dayHours.is_active || dayHours.is_closed) {
    return {
      date,
      available: false,
      reason: dayHours?.is_closed ? 'Closed/Weekend' : 'No working hours configured',
      slots: []
    };
  }

  // Check for calendar exceptions on this date
  const { query: dbQuery } = await import('../config/database');
  const exceptionsResult = await dbQuery(
    `SELECT * FROM calendar_exceptions 
     WHERE calendar_id = $1 
     AND DATE(start_datetime) <= $2 
     AND DATE(end_datetime) >= $2
     ORDER BY start_datetime`,
    [calendar.id, date]
  );

  // Get exceptions that affect specific time ranges
  const dayExceptions = exceptionsResult.rows;

  // Get time slot configuration
  const timeSlots = await CalendarModel.findTimeSlotsByCalendarId(calendar.id);
  const slotConfig = timeSlots.find(ts => ts.is_active) || {
    slot_duration: 30,
    break_duration: 0,
    max_appointments_per_slot: 1
  };

  // Get existing appointments for this date
  const appointmentsResult = await dbQuery(
    `SELECT start_at, end_at 
     FROM appointments 
     WHERE doctor_id = $1 
     AND DATE(start_at) = $2 
     AND status NOT IN ('cancelled', 'no-show')
     ORDER BY start_at`,
    [doctorId, date]
  );

  const existingAppointments = appointmentsResult.rows;

  // Generate time slots
  const slots = [];
  const [startHour, startMinute] = dayHours.start_time.split(':').map(Number);
  const [endHour, endMinute] = dayHours.end_time.split(':').map(Number);

  // Work with time in minutes from start of day to avoid timezone issues
  let currentMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  // Get current time to check for past slots
  const now = new Date();
  const isToday = targetDate.toDateString() === now.toDateString();

  while (currentMinutes < endMinutes) {
    const slotStartMinutes = currentMinutes;
    const slotEndMinutes = currentMinutes + slotConfig.slot_duration;

    const slotStartHour = Math.floor(slotStartMinutes / 60);
    const slotStartMin = slotStartMinutes % 60;
    const slotEndHour = Math.floor(slotEndMinutes / 60);
    const slotEndMin = slotEndMinutes % 60;

    // Format as YYYY-MM-DD HH:MM:SS (local time, no timezone conversion)
    const dateStr = date; // YYYY-MM-DD format
    const startTimeStr = `${dateStr} ${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}:00`;
    const endTimeStr = `${dateStr} ${String(slotEndHour).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}:00`;

    // Check if slot is in the past (only for today)
    let isPast = false;
    if (isToday) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      isPast = slotEndMinutes <= nowMinutes;
    }

    // Check if slot conflicts with existing appointments
    const bookedCount = existingAppointments.filter((apt: any) => {
      const aptStart = new Date(apt.start_at);
      const aptEnd = new Date(apt.end_at);
      const aptStartMinutes = aptStart.getHours() * 60 + aptStart.getMinutes();
      const aptEndMinutes = aptEnd.getHours() * 60 + aptEnd.getMinutes();
      return (slotStartMinutes < aptEndMinutes && slotEndMinutes > aptStartMinutes);
    }).length;

    // Check if slot is blocked by any exception
    let isBlocked = false;
    let blockReason = '';
    for (const exception of dayExceptions) {
      const exceptionStart = new Date(exception.start_datetime);
      const exceptionEnd = new Date(exception.end_datetime);
      
      // Get date-only parts for comparison (ignoring time)
      const exceptionStartDateOnly = new Date(exceptionStart.getFullYear(), exceptionStart.getMonth(), exceptionStart.getDate());
      const exceptionEndDateOnly = new Date(exceptionEnd.getFullYear(), exceptionEnd.getMonth(), exceptionEnd.getDate());
      const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      
      // Check if target date is within the exception date range
      const isInDateRange = targetDateOnly >= exceptionStartDateOnly && targetDateOnly <= exceptionEndDateOnly;
      
      if (!isInDateRange) continue;
      
      // If exception spans multiple days, determine the effective start/end times for this specific day
      let effectiveStartMinutes = 0; // Start of day (00:00)
      let effectiveEndMinutes = 24 * 60; // End of day (24:00)
      
      // If exception starts on this day, use the actual start time
      if (targetDateOnly.getTime() === exceptionStartDateOnly.getTime()) {
        effectiveStartMinutes = exceptionStart.getHours() * 60 + exceptionStart.getMinutes();
      }
      
      // If exception ends on this day, use the actual end time
      if (targetDateOnly.getTime() === exceptionEndDateOnly.getTime()) {
        effectiveEndMinutes = exceptionEnd.getHours() * 60 + exceptionEnd.getMinutes();
      }
      
      // Check if this slot overlaps with the effective exception time range
      // Slot overlaps if: slot_start < exception_end AND slot_end > exception_start
      if (slotStartMinutes < effectiveEndMinutes && slotEndMinutes > effectiveStartMinutes) {
        isBlocked = true;
        blockReason = exception.reason || exception.exception_type;
        break;
      }
    }

    // Slot is available if: not in the past AND not fully booked AND not blocked
    const available = !isPast && !isBlocked && bookedCount < slotConfig.max_appointments_per_slot;

    slots.push({
      start_time: startTimeStr,
      end_time: endTimeStr,
      available,
      booked_count: bookedCount,
      max_appointments: slotConfig.max_appointments_per_slot,
      is_blocked: isBlocked,
      block_reason: isBlocked ? blockReason : undefined
    });

    // Move to next slot (slot_duration + break_duration)
    currentMinutes = slotEndMinutes + slotConfig.break_duration;
  }

  return {
    date,
    available: true,
    working_hours: {
      start: dayHours.start_time,
      end: dayHours.end_time
    },
    slot_config: slotConfig,
    slots
  };
};

