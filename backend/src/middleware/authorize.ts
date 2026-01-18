import { Request, Response, NextFunction } from 'express';
import { hasAnyPermission } from '../constants/permissions';
import pool from '../config/database';

/**
 * Extended Express Request with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    roleId: string;
    roleName?: string;
    permissions?: any;
  };
}

/**
 * Middleware to check if the authenticated user has the required permissions
 * 
 * @param requiredPermissions - Array of permission strings that the user needs (OR logic - user needs at least one)
 * @returns Express middleware function
 * 
 * @example
 * // Single permission
 * router.get('/patients', authorize([Permissions.PATIENTS_VIEW]), patientController.getAll);
 * 
 * // Multiple permissions (OR logic - user needs at least one)
 * router.post('/appointments', authorize([Permissions.APPOINTMENTS_CREATE, Permissions.APPOINTMENTS_ALL]), ...);
 */
export function authorize(requiredPermissions: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Get user's role and permissions
      const result = await pool.query(
        `SELECT r.name as role_name, r.permissions
         FROM users u
         INNER JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'User role not found',
        });
      }

      const userRole = result.rows[0];
      // Ensure permissions is an array (JSONB might return object or string)
      let userPermissions: string[] = [];
      if (userRole.permissions) {
        if (Array.isArray(userRole.permissions)) {
          userPermissions = userRole.permissions;
        } else if (typeof userRole.permissions === 'string') {
          try {
            const parsed = JSON.parse(userRole.permissions);
            userPermissions = Array.isArray(parsed) ? parsed : [];
          } catch {
            userPermissions = [];
          }
        }
      }

      // Check if user has required permissions
      if (!hasAnyPermission(userPermissions, requiredPermissions)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: requiredPermissions,
          userRole: userRole.role_name,
        });
      }

      // User has permission, proceed
      return next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed',
      });
    }
  };
}

/**
 * Middleware to check if the authenticated user has ALL of the required permissions
 * 
 * @param requiredPermissions - Array of permission strings that the user needs (AND logic - user needs all)
 * @returns Express middleware function
 */
export function authorizeAll(requiredPermissions: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const result = await pool.query(
        `SELECT r.name as role_name, r.permissions
         FROM users u
         INNER JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'User role not found',
        });
      }

      const userRole = result.rows[0];
      // Ensure permissions is an array (JSONB might return object or string)
      let userPermissions: string[] = [];
      if (userRole.permissions) {
        if (Array.isArray(userRole.permissions)) {
          userPermissions = userRole.permissions;
        } else if (typeof userRole.permissions === 'string') {
          try {
            const parsed = JSON.parse(userRole.permissions);
            userPermissions = Array.isArray(parsed) ? parsed : [];
          } catch {
            userPermissions = [];
          }
        }
      }

      // Check if user has ALL required permissions
      const hasAll = requiredPermissions.every(required =>
        userPermissions.some(userPerm => {
          // Exact match or wildcard match
          if (userPerm === required) return true;
          if (userPerm.endsWith('.*')) {
            const module = userPerm.slice(0, -2);
            return required.startsWith(module + '.');
          }
          return false;
        })
      );

      if (!hasAll) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions - all required permissions needed',
          required: requiredPermissions,
          userRole: userRole.role_name,
        });
      }

      return next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed',
      });
    }
  };
}

/**
 * Helper middleware to attach user permissions to the request object
 * Useful for controllers that need to check permissions dynamically
 */
export async function attachPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.id) {
      return next();
    }

    const result = await pool.query(
      `SELECT r.permissions
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length > 0) {
      // Ensure permissions is an array
      let permissions: string[] = [];
      const rolePermissions = result.rows[0].permissions;
      if (rolePermissions) {
        if (Array.isArray(rolePermissions)) {
          permissions = rolePermissions;
        } else if (typeof rolePermissions === 'string') {
          try {
            const parsed = JSON.parse(rolePermissions);
            permissions = Array.isArray(parsed) ? parsed : [];
          } catch {
            permissions = [];
          }
        }
      }
      (req.user as any).permissions = permissions;
    }

    return next();
  } catch (error) {
    console.error('Error attaching permissions:', error);
    return next();
  }
}
