import { Router } from 'express';
import roleController from '../controllers/role.controller';
import { authenticate } from '../middleware/auth';
import { authorize as checkPermissions } from '../middleware/authorize';
import { Permissions } from '../constants/permissions';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/roles/permissions/available
 * @desc    Get all available permissions (organized by module)
 * @access  Super Admin only
 */
router.get(
  '/permissions/available',
  checkPermissions([Permissions.ROLES_VIEW]),
  roleController.getAvailablePermissions
);

/**
 * @route   GET /api/v1/roles
 * @desc    Get all roles with user counts
 * @access  Super Admin only
 */
router.get(
  '/',
  checkPermissions([Permissions.ROLES_VIEW]),
  roleController.getAllRoles
);

/**
 * @route   GET /api/v1/roles/:id
 * @desc    Get role by ID
 * @access  Super Admin only
 */
router.get(
  '/:id',
  checkPermissions([Permissions.ROLES_VIEW]),
  roleController.getRoleById
);

/**
 * @route   POST /api/v1/roles
 * @desc    Create a new role
 * @access  Super Admin only
 */
router.post(
  '/',
  checkPermissions([Permissions.ROLES_CREATE]),
  roleController.createRole
);

/**
 * @route   PUT /api/v1/roles/:id
 * @desc    Update an existing role
 * @access  Super Admin only
 */
router.put(
  '/:id',
  checkPermissions([Permissions.ROLES_UPDATE]),
  roleController.updateRole
);

/**
 * @route   DELETE /api/v1/roles/:id
 * @desc    Delete a role
 * @access  Super Admin only
 */
router.delete(
  '/:id',
  checkPermissions([Permissions.ROLES_DELETE]),
  roleController.deleteRole
);

/**
 * @route   POST /api/v1/roles/:id/permissions/add
 * @desc    Add permissions to a role
 * @access  Super Admin only
 */
router.post(
  '/:id/permissions/add',
  checkPermissions([Permissions.ROLES_ASSIGN_PERMISSIONS]),
  roleController.addPermissions
);

/**
 * @route   POST /api/v1/roles/:id/permissions/remove
 * @desc    Remove permissions from a role
 * @access  Super Admin only
 */
router.post(
  '/:id/permissions/remove',
  checkPermissions([Permissions.ROLES_ASSIGN_PERMISSIONS]),
  roleController.removePermissions
);

export default router;
