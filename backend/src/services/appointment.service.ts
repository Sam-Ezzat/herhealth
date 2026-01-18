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
  appointmentData: Partial<Omit<appointmentModel.Appointment, 'id' | 'created_at' | 'updated_at' | 'patient_name' | 'doctor_name' | 'patient_phone'>>,
  sendNotification = false
) => {
  const existingAppointment = await appointmentModel.findAppointmentById(id);
  if (!existingAppointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  // Track if rescheduled
  const isRescheduled = appointmentData.start_at && 
    new Date(appointmentData.start_at).getTime() !== new Date(existingAppointment.start_at).getTime();
  const oldStartAt = existingAppointment.start_at;

  // Track if status changed to confirmed
  const isConfirmed = appointmentData.status === 'confirmed' && existingAppointment.status !== 'confirmed';
  
  // Track if status changed to cancelled
  const isCancelled = appointmentData.status === 'cancelled' && existingAppointment.status !== 'cancelled';

  // If updating start time, validate it's not in the past
  if (appointmentData.start_at) {
    const startTime = new Date(appointmentData.start_at);
    const now = new Date();

    if (startTime < now) {
      throw new ApiError(400, 'Appointment start time cannot be in the past');
    }
  }

  const updatedAppointment = await appointmentModel.updateAppointment(id, appointmentData);
  
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
