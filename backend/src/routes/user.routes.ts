import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { Permissions } from '../constants/permissions';
import { validate } from '../middleware/validate';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.empty': 'Username is required',
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username must not exceed 30 characters',
    'string.alphanum': 'Username must contain only alphanumeric characters',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
  full_name: Joi.string().min(2).max(255).required().messages({
    'string.empty': 'Full name is required',
    'string.min': 'Full name must be at least 2 characters',
  }),
  role_id: Joi.string().uuid().required().messages({
    'string.empty': 'Role is required',
    'string.uuid': 'Invalid role ID',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Invalid email format',
  }),
  phone: Joi.string().optional().allow('', null),
});

const updateUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).optional(),
  password: Joi.string().min(6).optional(),
  full_name: Joi.string().min(2).max(255).optional(),
  role_id: Joi.string().uuid().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional().allow('', null),
});

/**
 * @route   GET /api/v1/users/stats/by-role
 * @desc    Get users count by role
 * @access  Private (users.view)
 */
router.get(
  '/stats/by-role',
  authorize([Permissions.USERS_VIEW]),
  userController.getUsersCountByRole
);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users
 * @access  Private (users.view)
 */
router.get(
  '/',
  authorize([Permissions.USERS_VIEW]),
  userController.getAllUsers
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (users.view)
 */
router.get(
  '/:id',
  authorize([Permissions.USERS_VIEW]),
  userController.getUserById
);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (users.create)
 */
router.post(
  '/',
  authorize([Permissions.USERS_CREATE]),
  validate(createUserSchema),
  userController.createUser
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (users.update)
 */
router.put(
  '/:id',
  authorize([Permissions.USERS_UPDATE]),
  validate(updateUserSchema),
  userController.updateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user
 * @access  Private (users.delete)
 */
router.delete(
  '/:id',
  authorize([Permissions.USERS_DELETE]),
  userController.deleteUser
);

export default router;
