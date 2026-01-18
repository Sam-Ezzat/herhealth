import { Request, Response, NextFunction } from 'express';
import * as WhatsAppService from '../services/whatsapp.service';
import * as WhatsAppWebService from '../services/whatsapp-web.service';

// Send scheduled notification
export const sendScheduledNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appointmentId } = req.params;
    
    await WhatsAppService.sendAppointmentScheduled(appointmentId);
    
    res.json({
      success: true,
      message: 'Scheduled notification sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Send confirmed notification
export const sendConfirmedNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appointmentId } = req.params;
    
    await WhatsAppService.sendAppointmentConfirmed(appointmentId);
    
    res.json({
      success: true,
      message: 'Confirmed notification sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Send rescheduled notification
export const sendRescheduledNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const { oldStartAt, newStartAt } = req.body;
    
    if (!oldStartAt || !newStartAt) {
      res.status(400).json({
        success: false,
        error: 'oldStartAt and newStartAt are required'
      });
      return;
    }
    
    await WhatsAppService.sendAppointmentRescheduled(
      appointmentId,
      new Date(oldStartAt),
      new Date(newStartAt)
    );
    
    res.json({
      success: true,
      message: 'Rescheduled notification sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Send cancelled notification
export const sendCancelledNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appointmentId } = req.params;
    const { reason, isEmergency } = req.body;
    
    await WhatsAppService.sendAppointmentCancelled(appointmentId, reason, isEmergency);
    
    res.json({
      success: true,
      message: 'Cancelled notification sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Send reminder notification
export const sendReminderNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appointmentId } = req.params;
    
    await WhatsAppService.sendAppointmentReminder(appointmentId);
    
    res.json({
      success: true,
      message: 'Reminder notification sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get appointment messages
export const getAppointmentMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appointmentId } = req.params;
    
    const messages = await WhatsAppService.getAppointmentMessages(appointmentId);
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// Get all templates
export const getTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await WhatsAppService.getAllTemplates();
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    next(error);
  }
};

// Update template
export const updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { template_content } = req.body;
    
    const template = await WhatsAppService.updateTemplate(id, { template_content });
    
    res.json({
      success: true,
      data: template,
      message: 'Template updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get WhatsApp configuration status
export const getConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isConfigured = !!(process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_ACCESS_TOKEN);
    const mode = process.env.WHATSAPP_MODE || 'api'; // 'api' or 'web'
    const webStatus = WhatsAppWebService.getWhatsAppWebStatus();
    
    res.json({
      success: true,
      data: {
        isConfigured,
        phoneId: isConfigured ? process.env.WHATSAPP_PHONE_ID?.substring(0, 8) + '...' : '',
        apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0',
        mode,
        webStatus: {
          isReady: webStatus.isReady,
          isInitializing: webStatus.isInitializing,
          hasQrCode: !!webStatus.qrCode
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Save WhatsApp configuration (Note: This updates .env file - use with caution in production)
export const saveConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone_id, access_token, api_url } = req.body;
    
    // In production, you'd want to store these in a secure database or secrets manager
    // For now, we'll just validate and return success
    // The actual implementation would need to update environment variables
    
    if (!phone_id || !access_token) {
      res.status(400).json({
        success: false,
        error: 'Phone ID and Access Token are required'
      });
      return;
    }
    
    // Here you would update your .env file or secrets manager
    // For security, this is typically done through deployment configuration
    console.log('WhatsApp config update requested (not persisted to .env for security)');
    
    res.json({
      success: true,
      message: 'Configuration validated. Please update .env file manually for security.'
    });
  } catch (error) {
    next(error);
  }
};

// Get all messages with filters
export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      patient_id: req.query.patient_id as string, // UUID string
      status: req.query.status as string,
      message_type: req.query.message_type as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      search: req.query.search as string
    };

    const messages = await WhatsAppService.getAllMessages(filters);
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// Send custom message to patient
export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patient_id, message, template_id, appointment_id } = req.body;
    
    console.log('Received sendMessage request:', { patient_id, message, template_id, body: req.body });
    
    if (!patient_id && patient_id !== 0) {
      console.error('Missing patient_id');
      res.status(400).json({
        success: false,
        error: 'Patient ID is required'
      });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      console.error('Missing or invalid message');
      res.status(400).json({
        success: false,
        error: 'Message is required'
      });
      return;
    }

    const result = await WhatsAppService.sendCustomMessage(
      patient_id.toString(),
      message,
      template_id || undefined,
      appointment_id || undefined
    );
    
    res.json({
      success: true,
      data: result,
      message: 'Message sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get messages by patient
export const getPatientMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    
    const messages = await WhatsAppService.getPatientMessages(patientId); // UUID string
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// Update message status (for webhooks)
export const updateMessageStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, delivered_at, read_at, error_message } = req.body;
    
    const message = await WhatsAppService.updateMessageStatus(
      id,
      status,
      { delivered_at, read_at, error_message }
    );
    
    res.json({
      success: true,
      data: message,
      message: 'Message status updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get message statistics
export const getMessageStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.query.patient_id as string | undefined; // UUID string
    
    const stats = await WhatsAppService.getMessageStats(patientId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// Set WhatsApp mode (api or web)
export const setMode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mode } = req.body;
    
    if (mode !== 'api' && mode !== 'web') {
      res.status(400).json({
        success: false,
        error: 'Mode must be either "api" or "web"'
      });
      return;
    }
    
    // Store in env (in production, use database or config file)
    process.env.WHATSAPP_MODE = mode;
    
    res.json({
      success: true,
      message: `WhatsApp mode set to ${mode}`,
      data: { mode }
    });
  } catch (error) {
    next(error);
  }
};

// Initialize WhatsApp Web
export const initializeWeb = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await WhatsAppWebService.initializeWhatsAppWeb();
    
    res.json({
      success: true,
      message: 'WhatsApp Web initialization started. Please scan QR code.'
    });
  } catch (error) {
    next(error);
  }
};

// Get WhatsApp Web QR code
export const getQRCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = WhatsAppWebService.getWhatsAppWebStatus();
    
    res.json({
      success: true,
      data: {
        qrCode: status.qrCode,
        isReady: status.isReady,
        isInitializing: status.isInitializing
      }
    });
  } catch (error) {
    next(error);
  }
};

// Disconnect WhatsApp Web
export const disconnectWeb = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await WhatsAppWebService.disconnectWhatsAppWeb();
    
    res.json({
      success: true,
      message: 'WhatsApp Web disconnected successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get WhatsApp Web client info
export const getWebClientInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const info = await WhatsAppWebService.getWhatsAppWebClientInfo();
    
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    next(error);
  }
};
