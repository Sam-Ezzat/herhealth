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
      timezone: 'UTC'
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

export const createCalendar = async (calendarData: any) => {
  const calendar = await CalendarModel.createDoctorCalendar({
    doctor_id: calendarData.doctor_id,
    name: calendarData.name || 'Main Calendar',
    description: calendarData.description || 'Default calendar',
    is_active: calendarData.is_active !== undefined ? calendarData.is_active : true,
    timezone: calendarData.timezone || 'UTC'
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
export const getAvailableTimeSlots = async (doctorId: string, date: string) => {
  // Get doctor's calendar
  const calendar = await CalendarModel.findCalendarByDoctorId(doctorId);
  if (!calendar) {
    throw ApiError.notFound('Calendar not found for this doctor');
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
     AND DATE(end_datetime) >= $2`,
    [calendar.id, date]
  );

  if (exceptionsResult.rows.length > 0) {
    const exception = exceptionsResult.rows[0];
    return {
      date,
      available: false,
      reason: exception.reason || exception.exception_type,
      slots: []
    };
  }

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

  let currentTime = new Date(targetDate);
  currentTime.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(targetDate);
  endTime.setHours(endHour, endMinute, 0, 0);

  while (currentTime < endTime) {
    const slotStart = new Date(currentTime);
    const slotEnd = new Date(currentTime.getTime() + slotConfig.slot_duration * 60000);

    // Check if slot conflicts with existing appointments
    const bookedCount = existingAppointments.filter((apt: any) => {
      const aptStart = new Date(apt.start_at);
      const aptEnd = new Date(apt.end_at);
      return (slotStart < aptEnd && slotEnd > aptStart);
    }).length;

    const available = bookedCount < slotConfig.max_appointments_per_slot;

    slots.push({
      start_time: slotStart.toISOString(),
      end_time: slotEnd.toISOString(),
      available,
      booked_count: bookedCount,
      max_appointments: slotConfig.max_appointments_per_slot
    });

    // Move to next slot (slot_duration + break_duration)
    currentTime = new Date(slotEnd.getTime() + slotConfig.break_duration * 60000);
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

