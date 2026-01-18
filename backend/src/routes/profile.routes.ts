import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import Joi from 'joi';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

// Validation schemas
const updateProfileSchema = Joi.object({
  full_name: Joi.string().min(2).max(255).optional(),
  email: Joi.string().email().max(255).optional(),
  phone: Joi.string().max(50).optional().allow('', null),
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required().messages({
    'any.required': 'Current password is required',
    'string.empty': 'Current password cannot be empty',
  }),
  new_password: Joi.string()
    .min(6)
    .required()
    .messages({
      'any.required': 'New password is required',
      'string.empty': 'New password cannot be empty',
      'string.min': 'New password must be at least 6 characters long',
    }),
  confirm_password: Joi.string()
    .valid(Joi.ref('new_password'))
    .required()
    .messages({
      'any.required': 'Password confirmation is required',
      'any.only': 'Passwords do not match',
    }),
});

/**
 * @route   GET /api/v1/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/', profileController.getProfile);

/**
 * @route   PUT /api/v1/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/', validate(updateProfileSchema), profileController.updateProfile);

/**
 * @route   POST /api/v1/profile/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  validate(changePasswordSchema),
  profileController.changePassword
);

export default router;
