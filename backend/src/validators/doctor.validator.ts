import Joi from 'joi';

export const createDoctorSchema = Joi.object({
  first_name: Joi.string().min(1).max(150).required().messages({
    'string.empty': 'First name is required',
    'string.max': 'First name cannot exceed 150 characters',
  }),
  last_name: Joi.string().min(1).max(150).required().messages({
    'string.empty': 'Last name is required',
    'string.max': 'Last name cannot exceed 150 characters',
  }),
  specialty: Joi.string().min(1).max(150).required().messages({
    'string.empty': 'Specialty is required',
    'string.max': 'Specialty cannot exceed 150 characters',
  }),
  phone: Joi.string()
    .pattern(/^[\d\s\-\+\(\)]+$/)
    .min(10)
    .max(50)
    .required()
    .messages({
      'string.pattern.base': 'Phone number format is invalid',
      'string.min': 'Phone number must be at least 10 characters',
    }),
  email: Joi.string().email().required().messages({
    'string.email': 'Valid email is required',
    'string.empty': 'Email is required',
  }),
  user_id: Joi.string().uuid().optional().allow(null),
});

export const updateDoctorSchema = Joi.object({
  first_name: Joi.string().min(1).max(150).optional(),
  last_name: Joi.string().min(1).max(150).optional(),
  specialty: Joi.string().min(1).max(150).optional(),
  phone: Joi.string()
    .pattern(/^[\d\s\-\+\(\)]+$/)
    .min(10)
    .max(50)
    .optional(),
  email: Joi.string().email().optional(),
  user_id: Joi.string().uuid().optional().allow(null),
}).min(1);

export const searchDoctorsSchema = Joi.object({
  search: Joi.string().max(100).optional(),
});
