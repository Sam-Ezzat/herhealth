import { query } from '../config/database';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role_id: string;
  email: string;
  phone?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  name: string;
  permissions: any;
  created_at: Date;
}

export const findUserByUsername = async (username: string): Promise<User | null> => {
  const result = await query(
    `SELECT 
      u.id,
      u.username,
      u.password_hash,
      u.full_name,
      u.role_id,
      u.email,
      u.phone,
      u.created_at,
      u.updated_at,
      r.name as role_name,
      r.permissions
     FROM users u 
     LEFT JOIN roles r ON u.role_id = r.id 
     WHERE u.username = $1`,
    [username]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
};

export const findUserById = async (id: string): Promise<User | null> => {
  const result = await query(
    `SELECT 
      u.id,
      u.username,
      u.password_hash,
      u.full_name,
      u.role_id,
      u.email,
      u.phone,
      u.created_at,
      u.updated_at,
      r.name as role_name,
      r.permissions
     FROM users u 
     LEFT JOIN roles r ON u.role_id = r.id 
     WHERE u.id = $1`,
    [id]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
};

export const createUser = async (
  username: string,
  passwordHash: string,
  fullName: string,
  roleId: string,
  email: string,
  phone?: string
): Promise<User> => {
  const result = await query(
    `INSERT INTO users (username, password_hash, full_name, role_id, email, phone) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING id, username, password_hash, full_name, role_id, email, phone, created_at, updated_at`,
    [username, passwordHash, fullName, roleId, email, phone]
  );

  return result.rows[0];
};

export const updateUser = async (
  id: string,
  updates: Partial<Omit<User, 'id' | 'created_at'>>
): Promise<User> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, username, password_hash, full_name, role_id, email, phone, created_at, updated_at`,
    values
  );

  return result.rows[0];
};

export const findRoleById = async (id: string): Promise<Role | null> => {
  const result = await query('SELECT id, name, permissions, created_at FROM roles WHERE id = $1', [id]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const findRoleByName = async (name: string): Promise<Role | null> => {
  const result = await query('SELECT id, name, permissions, created_at FROM roles WHERE name = $1', [name]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const getAllRoles = async (): Promise<Role[]> => {
  const result = await query('SELECT id, name, permissions, created_at FROM roles ORDER BY name');
  return result.rows;
};
