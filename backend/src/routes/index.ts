import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import userRoutes from './user.routes';
import patientRoutes from './patient.routes';
import doctorRoutes from './doctor.routes';
import appointmentRoutes from './appointment.routes';
import visitRoutes from './visit.routes';
import pregnancyRoutes from './pregnancy.routes';
import calendarRoutes from './calendar.routes';
import whatsappRoutes from './whatsapp.routes';
import colorCodeRoutes from './colorCode.routes';
import roleRoutes from './role.routes';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Profile routes
router.use('/profile', profileRoutes);

// User routes (User management)
router.use('/users', userRoutes);

// Role routes (RBAC management)
router.use('/roles', roleRoutes);

// Patient routes (includes pregnancy tracking)
router.use('/patients', patientRoutes);

// Doctor routes
router.use('/doctors', doctorRoutes);

// Appointment routes
router.use('/appointments', appointmentRoutes);

// Visit routes
router.use('/visits', visitRoutes);

// Pregnancy journey routes
router.use('/pregnancies', pregnancyRoutes);

// Calendar routes
router.use('/calendars', calendarRoutes);

// WhatsApp routes
router.use('/whatsapp', whatsappRoutes);

// Color Code routes
router.use('/color-codes', colorCodeRoutes);

// Health check for API routes
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
