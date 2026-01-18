import Joi from 'joi';

export const createPatientSchema = Joi.object({
  first_name: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'First name is required',
    'string.max': 'First name cannot exceed 100 characters',
  }),
  last_name: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Last name is required',
    'string.max': 'Last name cannot exceed 100 characters',
  }),
  date_of_birth: Joi.date().optional().allow(null).messages({
    'date.base': 'Valid date of birth is required',
  }),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional().default('Female').messages({
    'any.only': 'Gender must be Male, Female, or Other',
  }),
  phone: Joi.string()
    .pattern(/^[\d\s\-\+\(\)]+$/)
    .min(10)
    .max(20)
    .required()
    .messages({
      'string.pattern.base': 'Phone number format is invalid',
      'string.min': 'Phone number must be at least 10 characters',
    }),
  email: Joi.string().email().optional().allow('', null),
  address: Joi.string().max(500).optional().allow('', null),
  emergency_contact_name: Joi.string().max(100).optional().allow('', null),
  emergency_contact_phone: Joi.string()
    .pattern(/^[\d\s\-\+\(\)]+$/)
    .max(20)
    .optional()
    .allow('', null),
  blood_type: Joi.string()
    .valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    .optional()
    .allow('', null),
  allergies: Joi.string().max(1000).optional().allow('', null),
  chronic_conditions: Joi.string().max(2000).optional().allow('', null),
  current_medications: Joi.string().max(2000).optional().allow('', null),
  insurance_provider: Joi.string().max(200).optional().allow('', null),
  insurance_number: Joi.string().max(100).optional().allow('', null),
  color_code_id: Joi.number().integer().optional().allow(null),
  is_pregnant: Joi.boolean().optional().default(false),
});

export const updatePatientSchema = Joi.object({
  first_name: Joi.string().min(1).max(100).optional(),
  last_name: Joi.string().min(1).max(100).optional(),
  date_of_birth: Joi.date().optional(),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
  phone: Joi.string()
    .pattern(/^[\d\s\-\+\(\)]+$/)
    .min(10)
    .max(20)
    .optional(),
  email: Joi.string().email().optional().allow('', null),
  address: Joi.string().max(500).optional().allow('', null),
  emergency_contact_name: Joi.string().max(100).optional().allow('', null),
  emergency_contact_phone: Joi.string()
    .pattern(/^[\d\s\-\+\(\)]+$/)
    .max(20)
    .optional()
    .allow('', null),
  blood_type: Joi.string()
    .valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    .optional()
    .allow('', null),
  allergies: Joi.string().max(1000).optional().allow('', null),
  chronic_conditions: Joi.string().max(2000).optional().allow('', null),
  current_medications: Joi.string().max(2000).optional().allow('', null),
  insurance_provider: Joi.string().max(200).optional().allow('', null),
  insurance_number: Joi.string().max(100).optional().allow('', null),
  color_code_id: Joi.number().integer().optional().allow(null),
  is_pregnant: Joi.boolean().optional(),
}).min(1);

export const searchPatientsSchema = Joi.object({
  search: Joi.string().max(100).optional(),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
  colorCodeId: Joi.number().integer().optional(),
  minAge: Joi.number().integer().min(0).max(150).optional(),
  maxAge: Joi.number().integer().min(0).max(150).optional(),
  limit: Joi.number().integer().min(1).max(100).optional().default(50),
  offset: Joi.number().integer().min(0).optional().default(0),
});
