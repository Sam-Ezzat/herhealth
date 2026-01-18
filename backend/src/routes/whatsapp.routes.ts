import express from 'express';
import * as whatsappController from '../controllers/whatsapp.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Send notifications
router.post('/send/scheduled/:appointmentId', authenticate, whatsappController.sendScheduledNotification);
router.post('/send/confirmed/:appointmentId', authenticate, whatsappController.sendConfirmedNotification);
router.post('/send/rescheduled/:appointmentId', authenticate, whatsappController.sendRescheduledNotification);
router.post('/send/cancelled/:appointmentId', authenticate, whatsappController.sendCancelledNotification);
router.post('/send/reminder/:appointmentId', authenticate, whatsappController.sendReminderNotification);

// Get templates
router.get('/templates', authenticate, whatsappController.getTemplates);

// Update template
router.put('/templates/:id', authenticate, whatsappController.updateTemplate);

// Configuration
router.get('/config', authenticate, whatsappController.getConfig);
router.post('/config', authenticate, whatsappController.saveConfig);
router.post('/config/mode', authenticate, whatsappController.setMode);

// WhatsApp Web endpoints
router.post('/web/initialize', authenticate, whatsappController.initializeWeb);
router.get('/web/qr', authenticate, whatsappController.getQRCode);
router.post('/web/disconnect', authenticate, whatsappController.disconnectWeb);
router.get('/web/info', authenticate, whatsappController.getWebClientInfo);

// Messages - put specific routes BEFORE parameterized routes
router.get('/messages/stats', authenticate, whatsappController.getMessageStats);
router.get('/messages/patient/:patientId', authenticate, whatsappController.getPatientMessages);
router.get('/messages', authenticate, whatsappController.getMessages);
router.post('/messages/send', authenticate, whatsappController.sendMessage);
router.put('/messages/:id/status', authenticate, whatsappController.updateMessageStatus);

// Appointment messages - moved after other message routes
router.get('/appointments/:appointmentId/messages', authenticate, whatsappController.getAppointmentMessages);

export default router;
