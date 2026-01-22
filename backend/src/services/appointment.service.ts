import * as appointmentModel from '../models/appointment.model';
import * as WhatsAppService from './whatsapp.service';
import ApiError from '../utils/ApiError';

export const getAllAppointments = async (filters: appointmentModel.AppointmentFilters = {}) => {
  return await appointmentModel.findAllAppointments(filters);
};

export const getAppointmentById = async (id: string) => {
  const appointment = await appointmentModel.findAppointmentById(id);
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }
  return appointment;
};

export const createAppointment = async (
  appointmentData: Omit<appointmentModel.Appointment, 'id' | 'created_at' | 'updated_at' | 'patient_name' | 'doctor_name' | 'patient_phone'>,
  sendNotification = true
) => {
  // Validate that appointment start time is not in the past
  const startTime = new Date(appointmentData.start_at);
  const now = new Date();

  if (startTime < now) {
    throw new ApiError(400, 'Appointment start time cannot be in the past');
  }

  // Check if the time slot is blocked by a calendar exception
  if (appointmentData.calendar_id) {
    const { query } = await import('../config/database');
    const blocksResult = await query(
      `SELECT * FROM calendar_exceptions 
       WHERE calendar_id = $1 
       AND start_datetime < $2 
       AND end_datetime > $3
       LIMIT 1`,
      [appointmentData.calendar_id, appointmentData.end_at, appointmentData.start_at]
    );

    if (blocksResult.rows.length > 0) {
      const block = blocksResult.rows[0];
      throw new ApiError(400, `Cannot schedule appointment: ${block.reason || block.exception_type || 'Time slot is blocked'}`);
    }
  }

  const appointment = await appointmentModel.createAppointment(appointmentData);
  
  // Send WhatsApp notification
  if (sendNotification) {
    try {
      await WhatsAppService.sendAppointmentScheduled(appointment.id);
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
      // Don't fail the appointment creation if notification fails
    }
  }
  
  return appointment;
};

export const updateAppointment = async (
  id: string,
  appointmentData: Partial<Omit<appointmentModel.Appointment, 'id' | 'created_at' | 'updated_at' | 'patient_name' | 'doctor_name' | 'patient_phone'>> & { patient_color_code?: string },
  sendNotification = false
) => {
  const existingAppointment = await appointmentModel.findAppointmentById(id);
  if (!existingAppointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  // If patient_color_code is provided, update the patient's color code
  if (appointmentData.patient_color_code !== undefined && existingAppointment.patient_id) {
    try {
      const { query } = await import('../config/database');
      await query(
        'UPDATE patients SET color_code = $1 WHERE id = $2',
        [appointmentData.patient_color_code, existingAppointment.patient_id]
      );
    } catch (error) {
      console.error('Error updating patient color code:', error);
      // Continue with appointment update even if color update fails
    }
  }

  // Remove patient_color_code from appointmentData as it's not part of appointments table
  const { patient_color_code, ...appointmentUpdateData } = appointmentData as any;

  // Track if rescheduled
  const isRescheduled = appointmentUpdateData.start_at && 
    new Date(appointmentUpdateData.start_at).getTime() !== new Date(existingAppointment.start_at).getTime();
  const oldStartAt = existingAppointment.start_at;

  // Track if status changed to confirmed
  const isConfirmed = appointmentUpdateData.status === 'confirmed' && existingAppointment.status !== 'confirmed';
  
  // Track if status changed to cancelled
  const isCancelled = appointmentUpdateData.status === 'cancelled' && existingAppointment.status !== 'cancelled';

  // If updating start time (not just status), validate it's not in the past
  if (appointmentUpdateData.start_at) {
    const startTime = new Date(appointmentUpdateData.start_at);
    const now = new Date();

    // Only block past time if we're actually changing the start time
    const isChangingStartTime = new Date(appointmentUpdateData.start_at).getTime() !== new Date(existingAppointment.start_at).getTime();
    
    if (isChangingStartTime && startTime < now) {
      throw new ApiError(400, 'Appointment start time cannot be in the past');
    }

    // Check if the new time slot is blocked by a calendar exception (only if time is actually changing)
    if (isChangingStartTime && (appointmentUpdateData.calendar_id || existingAppointment.calendar_id)) {
      const { query } = await import('../config/database');
      const calendarId = appointmentUpdateData.calendar_id || existingAppointment.calendar_id;
      const endTime = appointmentUpdateData.end_at || existingAppointment.end_at;
      
      const blocksResult = await query(
        `SELECT * FROM calendar_exceptions 
         WHERE calendar_id = $1 
         AND start_datetime < $2 
         AND end_datetime > $3
         LIMIT 1`,
        [calendarId, endTime, appointmentUpdateData.start_at]
      );

      if (blocksResult.rows.length > 0) {
        const block = blocksResult.rows[0];
        throw new ApiError(400, `Cannot reschedule appointment: ${block.reason || block.exception_type || 'Time slot is blocked'}`);
      }
    }
  }

  const updatedAppointment = await appointmentModel.updateAppointment(id, appointmentUpdateData);
  
  // Send WhatsApp notifications based on what changed
  if (sendNotification && updatedAppointment) {
    try {
      if (isRescheduled) {
        await WhatsAppService.sendAppointmentRescheduled(id, oldStartAt, new Date(appointmentData.start_at!));
      } else if (isConfirmed) {
        await WhatsAppService.sendAppointmentConfirmed(id);
      } else if (isCancelled) {
        await WhatsAppService.sendAppointmentCancelled(id, appointmentData.notes);
      }
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
      // Don't fail the appointment update if notification fails
    }
  }
  
  return updatedAppointment;
};

export const deleteAppointment = async (id: string) => {
  const appointment = await appointmentModel.findAppointmentById(id);
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  await appointmentModel.deleteAppointment(id);
  return { message: 'Appointment deleted successfully' };
};

export const getAppointmentStatistics = async () => {
  return await appointmentModel.getAppointmentStats();
};
