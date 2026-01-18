import Joi from 'joi';

export const createAppointmentSchema = Joi.object({
  patient_id: Joi.string().uuid().required(),
  doctor_id: Joi.string().uuid().required(),
  start_at: Joi.date().required(),
  end_at: Joi.date().required(),
  type: Joi.string().max(100).required(),
  status: Joi.string()
    .valid('scheduled', 'confirmed', 'cancelled', 'completed', 'no-show')
    .optional(),
  reservation_type: Joi.string()
    .valid('Clinic', 'phone', 'Doctor', 'website')
    .optional(),
  notes: Joi.string().max(1000).optional().allow('', null),
});

export const updateAppointmentSchema = Joi.object({
  patient_id: Joi.string().uuid().optional(),
  doctor_id: Joi.string().uuid().optional(),
  start_at: Joi.date().optional(),
  end_at: Joi.date().optional(),
  type: Joi.string().max(100).optional(),
  status: Joi.string()
    .valid('scheduled', 'confirmed', 'cancelled', 'completed', 'no-show')
    .optional(),
  reservation_type: Joi.string()
    .valid('Clinic', 'phone', 'Doctor', 'website')
    .optional(),
  notes: Joi.string().max(1000).optional().allow('', null),
}).min(1);

export const searchAppointmentsSchema = Joi.object({
  patient_id: Joi.string().uuid().optional(),
  doctor_id: Joi.string().uuid().optional(),
  status: Joi.string()
    .valid('scheduled', 'confirmed', 'cancelled', 'completed', 'no-show')
    .optional(),
  type: Joi.string().max(100).optional(),
  date_from: Joi.date().optional(),
  date_to: Joi.date().optional(),
  search: Joi.string().max(200).optional(),
});
