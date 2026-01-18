import axios from 'axios';
import * as WhatsAppModel from '../models/whatsapp.model';
import WhatsAppMessageModel from '../models/whatsapp-message.model';
import * as AppointmentModel from '../models/appointment.model';
import * as PatientModel from '../models/patient.model';
import * as DoctorModel from '../models/doctor.model';
import { format } from 'date-fns';
import * as WhatsAppWebService from './whatsapp-web.service';

// WhatsApp Business API configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || '';
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WHATSAPP_MODE = process.env.WHATSAPP_MODE || 'api'; // 'api' or 'web'

interface MessageVariables {
  patient_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  doctor_name?: string;
  appointment_type?: string;
  old_date?: string;
  old_time?: string;
  new_date?: string;
  new_time?: string;
  cancellation_reason?: string;
  [key: string]: string | undefined;
}

// Replace template variables with actual values
const replaceTemplateVariables = (template: string, variables: MessageVariables): string => {
  let message = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, 'g'), value || '');
  });
  
  return message;
};

// Send WhatsApp message (routes to API or Web based on mode)
const sendWhatsAppMessage = async (
  phoneNumber: string, 
  message: string, 
  patientId?: string, 
  templateId?: string,
  messageType: string = 'custom'
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    // Format phone number (remove +, spaces, etc.)
    const formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    
    // Create message record with pending status
    let messageRecord;
    if (patientId) {
      messageRecord = await WhatsAppMessageModel.create({
        patient_id: patientId,
        phone_number: formattedPhone,
        message_content: message,
        template_id: templateId,
        message_type: messageType,
        status: 'pending'
      });
    }
    
    // Route based on mode
    const mode = process.env.WHATSAPP_MODE || 'api';
    let result: { success: boolean; messageId?: string; error?: string };
    
    if (mode === 'web') {
      // Use WhatsApp Web
      result = await WhatsAppWebService.sendWhatsAppWebMessage(formattedPhone, message);
    } else {
      // Use Business API
      if (!WHATSAPP_PHONE_ID || !WHATSAPP_TOKEN) {
        console.warn('WhatsApp credentials not configured. Message not sent.');
        if (messageRecord) {
          await WhatsAppMessageModel.updateStatus(messageRecord.id!, 'failed', {
            error_message: 'WhatsApp API not configured'
          });
        }
        return { success: false, error: 'WhatsApp API not configured' };
      }

      const response = await axios.post(
        `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const whatsappMessageId = response.data.messages?.[0]?.id;
      result = {
        success: true,
        messageId: whatsappMessageId
      };
    }
    
    // Update message record to sent
    if (messageRecord && result.success) {
      await WhatsAppMessageModel.updateStatus(messageRecord.id!, 'sent', {
        whatsapp_message_id: result.messageId,
        sent_at: new Date()
      });
    } else if (messageRecord && !result.success) {
      await WhatsAppMessageModel.updateStatus(messageRecord.id!, 'failed', {
        error_message: result.error
      });
    }

    return result;
  } catch (error: any) {
    console.error('WhatsApp Error:', error.response?.data || error.message);
    
    // Update message record to failed if exists
    if (patientId) {
      try {
        const messages = await WhatsAppMessageModel.findAll({ 
          patient_id: patientId, 
          status: 'pending' 
        });
        if (messages.length > 0) {
          await WhatsAppMessageModel.updateStatus(messages[0].id!, 'failed', {
            error_message: error.response?.data?.error?.message || error.message
          });
        }
      } catch (updateError) {
        console.error('Failed to update message status:', updateError);
      }
    }
    
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

// Send appointment scheduled notification
export const sendAppointmentScheduled = async (appointmentId: string): Promise<void> => {
  try {
    const appointment = await AppointmentModel.findAppointmentById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    const patient = await PatientModel.findPatientById(appointment.patient_id);
    if (!patient || !patient.phone) throw new Error('Patient phone not found');

    const doctor = await DoctorModel.findDoctorById(appointment.doctor_id);
    if (!doctor) throw new Error('Doctor not found');

    const template = await WhatsAppModel.findTemplateByType('scheduled');
    if (!template) throw new Error('Template not found');

    const variables: MessageVariables = {
      patient_name: `${patient.first_name} ${patient.last_name}`,
      appointment_date: format(new Date(appointment.start_at), 'MMMM dd, yyyy'),
      appointment_time: format(new Date(appointment.start_at), 'hh:mm a'),
      doctor_name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
      appointment_type: appointment.type
    };

    const messageContent = replaceTemplateVariables(template.template_content, variables);

    // Create message record
    const messageRecord = await WhatsAppModel.createWhatsAppMessage({
      appointment_id: appointmentId,
      patient_id: patient.id,
      phone_number: patient.phone,
      message_type: 'scheduled',
      message_content: messageContent,
      status: 'pending'
    });

    // Send message
    const result = await sendWhatsAppMessage(patient.phone, messageContent);

    // Update message status
    await WhatsAppModel.updateWhatsAppMessage(messageRecord.id, {
      status: result.success ? 'sent' : 'failed',
      whatsapp_message_id: result.messageId,
      error_message: result.error,
      sent_at: result.success ? new Date() : undefined
    });

  } catch (error: any) {
    console.error('Error sending scheduled notification:', error.message);
    throw error;
  }
};

// Send appointment confirmed notification
export const sendAppointmentConfirmed = async (appointmentId: string): Promise<void> => {
  try {
    const appointment = await AppointmentModel.findAppointmentById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    const patient = await PatientModel.findPatientById(appointment.patient_id);
    if (!patient || !patient.phone) throw new Error('Patient phone not found');

    const doctor = await DoctorModel.findDoctorById(appointment.doctor_id);
    if (!doctor) throw new Error('Doctor not found');

    const template = await WhatsAppModel.findTemplateByType('confirmed');
    if (!template) throw new Error('Template not found');

    const variables: MessageVariables = {
      patient_name: `${patient.first_name} ${patient.last_name}`,
      appointment_date: format(new Date(appointment.start_at), 'MMMM dd, yyyy'),
      appointment_time: format(new Date(appointment.start_at), 'hh:mm a'),
      doctor_name: `Dr. ${doctor.first_name} ${doctor.last_name}`
    };

    const messageContent = replaceTemplateVariables(template.template_content, variables);

    const messageRecord = await WhatsAppModel.createWhatsAppMessage({
      appointment_id: appointmentId,
      patient_id: patient.id,
      phone_number: patient.phone,
      message_type: 'confirmed',
      message_content: messageContent,
      status: 'pending'
    });

    const result = await sendWhatsAppMessage(patient.phone, messageContent);

    await WhatsAppModel.updateWhatsAppMessage(messageRecord.id, {
      status: result.success ? 'sent' : 'failed',
      whatsapp_message_id: result.messageId,
      error_message: result.error,
      sent_at: result.success ? new Date() : undefined
    });

  } catch (error: any) {
    console.error('Error sending confirmed notification:', error.message);
    throw error;
  }
};

// Send appointment rescheduled notification
export const sendAppointmentRescheduled = async (
  appointmentId: string,
  oldStartAt: Date,
  newStartAt: Date
): Promise<void> => {
  try {
    const appointment = await AppointmentModel.findAppointmentById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    const patient = await PatientModel.findPatientById(appointment.patient_id);
    if (!patient || !patient.phone) throw new Error('Patient phone not found');

    const doctor = await DoctorModel.findDoctorById(appointment.doctor_id);
    if (!doctor) throw new Error('Doctor not found');

    const template = await WhatsAppModel.findTemplateByType('rescheduled');
    if (!template) throw new Error('Template not found');

    const variables: MessageVariables = {
      patient_name: `${patient.first_name} ${patient.last_name}`,
      old_date: format(new Date(oldStartAt), 'MMMM dd, yyyy'),
      old_time: format(new Date(oldStartAt), 'hh:mm a'),
      new_date: format(new Date(newStartAt), 'MMMM dd, yyyy'),
      new_time: format(new Date(newStartAt), 'hh:mm a'),
      doctor_name: `Dr. ${doctor.first_name} ${doctor.last_name}`
    };

    const messageContent = replaceTemplateVariables(template.template_content, variables);

    const messageRecord = await WhatsAppModel.createWhatsAppMessage({
      appointment_id: appointmentId,
      patient_id: patient.id,
      phone_number: patient.phone,
      message_type: 'rescheduled',
      message_content: messageContent,
      status: 'pending'
    });

    const result = await sendWhatsAppMessage(patient.phone, messageContent);

    await WhatsAppModel.updateWhatsAppMessage(messageRecord.id, {
      status: result.success ? 'sent' : 'failed',
      whatsapp_message_id: result.messageId,
      error_message: result.error,
      sent_at: result.success ? new Date() : undefined
    });

  } catch (error: any) {
    console.error('Error sending rescheduled notification:', error.message);
    throw error;
  }
};

// Send appointment cancelled notification
export const sendAppointmentCancelled = async (
  appointmentId: string,
  reason?: string,
  isEmergency = false
): Promise<void> => {
  try {
    const appointment = await AppointmentModel.findAppointmentById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    const patient = await PatientModel.findPatientById(appointment.patient_id);
    if (!patient || !patient.phone) throw new Error('Patient phone not found');

    const doctor = await DoctorModel.findDoctorById(appointment.doctor_id);
    if (!doctor) throw new Error('Doctor not found');

    const templateType = isEmergency ? 'emergency_cancellation' : 'cancelled';
    const template = await WhatsAppModel.findTemplateByName(
      isEmergency ? 'emergency_cancellation' : 'appointment_cancelled'
    );
    if (!template) throw new Error('Template not found');

    const variables: MessageVariables = {
      patient_name: `${patient.first_name} ${patient.last_name}`,
      appointment_date: format(new Date(appointment.start_at), 'MMMM dd, yyyy'),
      appointment_time: format(new Date(appointment.start_at), 'hh:mm a'),
      doctor_name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
      cancellation_reason: reason || 'Not specified'
    };

    const messageContent = replaceTemplateVariables(template.template_content, variables);

    const messageRecord = await WhatsAppModel.createWhatsAppMessage({
      appointment_id: appointmentId,
      patient_id: patient.id,
      phone_number: patient.phone,
      message_type: 'cancelled',
      message_content: messageContent,
      status: 'pending'
    });

    const result = await sendWhatsAppMessage(patient.phone, messageContent);

    await WhatsAppModel.updateWhatsAppMessage(messageRecord.id, {
      status: result.success ? 'sent' : 'failed',
      whatsapp_message_id: result.messageId,
      error_message: result.error,
      sent_at: result.success ? new Date() : undefined
    });

  } catch (error: any) {
    console.error('Error sending cancelled notification:', error.message);
    throw error;
  }
};

// Send appointment reminder notification
export const sendAppointmentReminder = async (appointmentId: string): Promise<void> => {
  try {
    const appointment = await AppointmentModel.findAppointmentById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    const patient = await PatientModel.findPatientById(appointment.patient_id);
    if (!patient || !patient.phone) throw new Error('Patient phone not found');

    const doctor = await DoctorModel.findDoctorById(appointment.doctor_id);
    if (!doctor) throw new Error('Doctor not found');

    const template = await WhatsAppModel.findTemplateByType('reminder');
    if (!template) throw new Error('Template not found');

    const variables: MessageVariables = {
      patient_name: `${patient.first_name} ${patient.last_name}`,
      appointment_date: format(new Date(appointment.start_at), 'MMMM dd, yyyy'),
      appointment_time: format(new Date(appointment.start_at), 'hh:mm a'),
      doctor_name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
      appointment_type: appointment.type
    };

    const messageContent = replaceTemplateVariables(template.template_content, variables);

    const messageRecord = await WhatsAppModel.createWhatsAppMessage({
      appointment_id: appointmentId,
      patient_id: patient.id,
      phone_number: patient.phone,
      message_type: 'reminder',
      message_content: messageContent,
      status: 'pending'
    });

    const result = await sendWhatsAppMessage(patient.phone, messageContent);

    await WhatsAppModel.updateWhatsAppMessage(messageRecord.id, {
      status: result.success ? 'sent' : 'failed',
      whatsapp_message_id: result.messageId,
      error_message: result.error,
      sent_at: result.success ? new Date() : undefined
    });

  } catch (error: any) {
    console.error('Error sending reminder notification:', error.message);
    throw error;
  }
};

// Get message history for an appointment
export const getAppointmentMessages = async (appointmentId: string) => {
  return await WhatsAppModel.findMessagesByAppointmentId(appointmentId);
};

// Get all templates
export const getAllTemplates = async () => {
  return await WhatsAppModel.findAllTemplates();
};

// Update template
export const updateTemplate = async (id: string, data: { template_content: string }) => {
  return await WhatsAppModel.updateTemplate(id, { template_content: data.template_content });
};

// Send custom message to patient
export const sendCustomMessage = async (patientId: string, message: string, templateId?: string, appointmentId?: string) => {
  const patient = await PatientModel.findPatientById(patientId);
  if (!patient || !patient.phone) {
    throw new Error('Patient phone not found');
  }

  // Replace template variables with actual patient data
  let processedMessage = message;
  
  // Patient variables
  const patientName = `${patient.first_name} ${patient.last_name}`.trim();
  processedMessage = processedMessage.replace(/{patient_name}/g, patientName);
  processedMessage = processedMessage.replace(/{first_name}/g, patient.first_name || '');
  processedMessage = processedMessage.replace(/{last_name}/g, patient.last_name || '');
  processedMessage = processedMessage.replace(/{phone}/g, patient.phone || '');
  processedMessage = processedMessage.replace(/{email}/g, patient.email || '');
  
  // Try to get appointment data
  try {
    let latestAppointment;
    
    // If appointmentId is provided, use it; otherwise get latest appointment for the patient
    if (appointmentId) {
      latestAppointment = await AppointmentModel.findAppointmentById(appointmentId);
      if (!latestAppointment) {
        console.warn(`Appointment ${appointmentId} not found, trying to fetch latest`);
      }
    }
    
    if (!latestAppointment) {
      const appointments = await AppointmentModel.findAllAppointments({ patient_id: patientId });
      if (appointments && appointments.length > 0) {
        // Get the most recent or next upcoming appointment
        latestAppointment = appointments[0];
      }
    }
    
    if (latestAppointment) {
      
      // Get doctor information
      let doctorName = 'Dr. (Not assigned)';
      if (latestAppointment.doctor_id) {
        const doctor = await DoctorModel.findDoctorById(latestAppointment.doctor_id);
        if (doctor) {
          doctorName = `Dr. ${doctor.first_name} ${doctor.last_name}`;
        }
      }
      
      // Format appointment date and time from start_at
      const startDate = new Date(latestAppointment.start_at);
      const appointmentDate = format(startDate, 'dd/MM/yyyy');
      const appointmentTime = format(startDate, 'HH:mm');
      
      // Replace appointment variables
      processedMessage = processedMessage.replace(/{appointment_date}/g, appointmentDate);
      processedMessage = processedMessage.replace(/{appointment_time}/g, appointmentTime);
      processedMessage = processedMessage.replace(/{doctor_name}/g, doctorName);
      processedMessage = processedMessage.replace(/{appointment_type}/g, latestAppointment.type || 'General');
      processedMessage = processedMessage.replace(/{cancellation_reason}/g, latestAppointment.notes || 'N/A');
    } else {
      // No appointments found - use placeholder values
      processedMessage = processedMessage.replace(/{appointment_date}/g, 'N/A');
      processedMessage = processedMessage.replace(/{appointment_time}/g, 'N/A');
      processedMessage = processedMessage.replace(/{doctor_name}/g, 'N/A');
      processedMessage = processedMessage.replace(/{appointment_type}/g, 'N/A');
      processedMessage = processedMessage.replace(/{cancellation_reason}/g, 'N/A');
    }
  } catch (error) {
    console.error('Error fetching appointment data:', error);
    // Use placeholder values if appointment fetch fails
    processedMessage = processedMessage.replace(/{appointment_date}/g, 'N/A');
    processedMessage = processedMessage.replace(/{appointment_time}/g, 'N/A');
    processedMessage = processedMessage.replace(/{doctor_name}/g, 'N/A');
    processedMessage = processedMessage.replace(/{appointment_type}/g, 'N/A');
    processedMessage = processedMessage.replace(/{cancellation_reason}/g, 'N/A');
  }
  
  // Clinic information
  processedMessage = processedMessage.replace(/{clinic_phone}/g, process.env.CLINIC_PHONE || '0100 000 3626');
  processedMessage = processedMessage.replace(/{clinic_name}/g, process.env.CLINIC_NAME || 'HerHealth Clinic');
  processedMessage = processedMessage.replace(/{clinic_address}/g, process.env.CLINIC_ADDRESS || 'شارع 151 - عمارة 9 - ميدان الحرية - بجوار بنك أبو ظبي - الدور الأول شقة رقم 1');
  
  console.log('Original message:', message);
  console.log('Processed message:', processedMessage);

  const result = await sendWhatsAppMessage(
    patient.phone, 
    processedMessage, 
    patientId, 
    templateId,
    templateId ? 'template' : 'custom'
  );

  if (!result.success) {
    throw new Error(result.error || 'Failed to send message');
  }

  return result;
};

// Get all messages with filters
export const getAllMessages = async (filters: any) => {
  return await WhatsAppMessageModel.findAll(filters);
};

// Get message by ID
export const getMessageById = async (id: string) => {
  return await WhatsAppMessageModel.findById(id);
};

// Get messages by patient
export const getPatientMessages = async (patientId: string) => {
  return await WhatsAppMessageModel.findByPatient(patientId);
};

// Update message status (for webhook updates)
export const updateMessageStatus = async (
  id: string, 
  status: 'sent' | 'delivered' | 'read' | 'failed',
  updates: any
) => {
  return await WhatsAppMessageModel.updateStatus(id, status, updates);
};

// Get message statistics
export const getMessageStats = async (patientId?: string) => {
  return await WhatsAppMessageModel.getStats(patientId);
};
