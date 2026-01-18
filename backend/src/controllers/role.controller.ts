import { Request, Response } from 'express';
import roleService from '../services/role.service';
import { Permissions } from '../constants/permissions';

class RoleController {
  /**
   * Get all roles
   * @route GET /api/v1/roles
   */
  async getAllRoles(req: Request, res: Response) {
    try {
      const roles = await roleService.getAllRoles();
      const usageCounts = await roleService.getRoleUsageCounts();

      // Attach user count to each role
      const rolesWithCounts = roles.map(role => ({
        ...role,
        user_count: usageCounts[role.id] || 0,
      }));

      return res.json({
        success: true,
        data: rolesWithCounts,
      });
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch roles',
      });
    }
  }

  /**
   * Get role by ID
   * @route GET /api/v1/roles/:id
   */
  async getRoleById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const role = await roleService.getRoleById(id);

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found',
        });
      }

      return res.json({
        success: true,
        data: role,
      });
    } catch (error: any) {
      console.error('Error fetching role:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch role',
      });
    }
  }

  /**
   * Create a new role
   * @route POST /api/v1/roles
   */
  async createRole(req: Request, res: Response) {
    try {
      const { name, permissions } = req.body;

      if (!name || !Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Name and permissions array are required',
        });
      }

      const newRole = await roleService.createRole({ name, permissions });

      return res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: newRole,
      });
    } catch (error: any) {
      console.error('Error creating role:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to create role',
      });
    }
  }

  /**
   * Update an existing role
   * @route PUT /api/v1/roles/:id
   */
  async updateRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, permissions } = req.body;

      const updatedRole = await roleService.updateRole(id, { name, permissions });

      return res.json({
        success: true,
        message: 'Role updated successfully',
        data: updatedRole,
      });
    } catch (error: any) {
      console.error('Error updating role:', error);
      const statusCode = error.message === 'Role not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update role',
      });
    }
  }

  /**
   * Delete a role
   * @route DELETE /api/v1/roles/:id
   */
  async deleteRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await roleService.deleteRole(id);

      return res.json({
        success: true,
        message: 'Role deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting role:', error);
      const statusCode = error.message === 'Role not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete role',
      });
    }
  }

  /**
   * Add permissions to a role
   * @route POST /api/v1/roles/:id/permissions/add
   */
  async addPermissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions) || permissions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Permissions array is required',
        });
      }

      const updatedRole = await roleService.addPermissionsToRole(id, permissions);

      return res.json({
        success: true,
        message: 'Permissions added successfully',
        data: updatedRole,
      });
    } catch (error: any) {
      console.error('Error adding permissions:', error);
      const statusCode = error.message === 'Role not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to add permissions',
      });
    }
  }

  /**
   * Remove permissions from a role
   * @route POST /api/v1/roles/:id/permissions/remove
   */
  async removePermissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions) || permissions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Permissions array is required',
        });
      }

      const updatedRole = await roleService.removePermissionsFromRole(id, permissions);

      return res.json({
        success: true,
        message: 'Permissions removed successfully',
        data: updatedRole,
      });
    } catch (error: any) {
      console.error('Error removing permissions:', error);
      const statusCode = error.message === 'Role not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to remove permissions',
      });
    }
  }

  /**
   * Get all available permissions
   * @route GET /api/v1/roles/permissions/available
   */
  async getAvailablePermissions(req: Request, res: Response) {
    try {
      // Return all permissions organized by module
      const permissionsByModule = {
        users: Object.values(Permissions).filter(p => p.startsWith('users.')),
        roles: Object.values(Permissions).filter(p => p.startsWith('roles.')),
        patients: Object.values(Permissions).filter(p => p.startsWith('patients.')),
        doctors: Object.values(Permissions).filter(p => p.startsWith('doctors.')),
        appointments: Object.values(Permissions).filter(p => p.startsWith('appointments.')),
        visits: Object.values(Permissions).filter(p => p.startsWith('visits.')),
        pregnancy: Object.values(Permissions).filter(p => p.startsWith('pregnancy.')),
        calendars: Object.values(Permissions).filter(p => p.startsWith('calendars.')),
        whatsapp: Object.values(Permissions).filter(p => p.startsWith('whatsapp.')),
        colorcodes: Object.values(Permissions).filter(p => p.startsWith('colorcodes.')),
        stats: Object.values(Permissions).filter(p => p.startsWith('stats.')),
        settings: Object.values(Permissions).filter(p => p.startsWith('settings.')),
      };

      return res.json({
        success: true,
        data: {
          all: Object.values(Permissions),
          byModule: permissionsByModule,
        },
      });
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch permissions',
      });
    }
  }
}

export default new RoleController();
