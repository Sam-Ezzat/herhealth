import pool from '../config/database';

interface Role {
  id: string;
  name: string;
  permissions: string[];
  created_at: Date;
}

interface CreateRoleData {
  name: string;
  permissions: string[];
}

interface UpdateRoleData {
  name?: string;
  permissions?: string[];
}

class RoleService {
  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    const result = await pool.query(
      'SELECT id, name, permissions, created_at FROM roles ORDER BY created_at ASC'
    );
    return result.rows;
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<Role | null> {
    const result = await pool.query(
      'SELECT id, name, permissions, created_at FROM roles WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new role
   */
  async createRole(roleData: CreateRoleData): Promise<Role> {
    const { name, permissions } = roleData;

    // Check if role name already exists
    const existing = await pool.query(
      'SELECT id FROM roles WHERE LOWER(name) = LOWER($1)',
      [name]
    );

    if (existing.rows.length > 0) {
      throw new Error('Role with this name already exists');
    }

    const result = await pool.query(
      `INSERT INTO roles (name, permissions, created_at)
       VALUES ($1, $2, NOW())
       RETURNING id, name, permissions, created_at`,
      [name, JSON.stringify(permissions)]
    );

    return result.rows[0];
  }

  /**
   * Update an existing role
   */
  async updateRole(id: string, roleData: UpdateRoleData): Promise<Role> {
    const { name, permissions } = roleData;

    // Check if role exists
    const existing = await this.getRoleById(id);
    if (!existing) {
      throw new Error('Role not found');
    }

    // If updating name, check for duplicates
    if (name && name !== existing.name) {
      const duplicate = await pool.query(
        'SELECT id FROM roles WHERE LOWER(name) = LOWER($1) AND id != $2',
        [name, id]
      );

      if (duplicate.rows.length > 0) {
        throw new Error('Role with this name already exists');
      }
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (permissions !== undefined) {
      updates.push(`permissions = $${paramCount++}`);
      values.push(JSON.stringify(permissions));
    }

    if (updates.length === 0) {
      return existing;
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE roles
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, name, permissions, created_at`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete a role
   */
  async deleteRole(id: string): Promise<void> {
    // Check if role exists
    const existing = await this.getRoleById(id);
    if (!existing) {
      throw new Error('Role not found');
    }

    // Check if any users are assigned to this role
    const usersWithRole = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role_id = $1',
      [id]
    );

    if (parseInt(usersWithRole.rows[0].count) > 0) {
      throw new Error('Cannot delete role - users are assigned to this role');
    }

    await pool.query('DELETE FROM roles WHERE id = $1', [id]);
  }

  /**
   * Add permissions to a role
   */
  async addPermissionsToRole(roleId: string, newPermissions: string[]): Promise<Role> {
    const role = await this.getRoleById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    const currentPermissions = role.permissions || [];
    const uniquePermissions = Array.from(new Set([...currentPermissions, ...newPermissions]));

    return this.updateRole(roleId, { permissions: uniquePermissions });
  }

  /**
   * Remove permissions from a role
   */
  async removePermissionsFromRole(roleId: string, permissionsToRemove: string[]): Promise<Role> {
    const role = await this.getRoleById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    const currentPermissions = role.permissions || [];
    const updatedPermissions = currentPermissions.filter(p => !permissionsToRemove.includes(p));

    return this.updateRole(roleId, { permissions: updatedPermissions });
  }

  /**
   * Get users count for each role
   */
  async getRoleUsageCounts(): Promise<Record<string, number>> {
    const result = await pool.query(
      `SELECT r.id, r.name, COUNT(u.id)::int as user_count
       FROM roles r
       LEFT JOIN users u ON r.id = u.role_id
       GROUP BY r.id, r.name`
    );

    const counts: Record<string, number> = {};
    result.rows.forEach(row => {
      counts[row.id] = row.user_count;
    });

    return counts;
  }
}

export default new RoleService();
