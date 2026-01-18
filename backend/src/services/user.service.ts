import { query } from '../config/database';
import bcrypt from 'bcrypt';
import ApiError from '../utils/ApiError';

export interface CreateUserDto {
  username: string;
  password: string;
  full_name: string;
  role_id: string;
  email: string;
  phone?: string;
}

export interface UpdateUserDto {
  username?: string;
  full_name?: string;
  role_id?: string;
  email?: string;
  phone?: string;
  password?: string;
}

/**
 * Get all users with their roles
 */
export const getAllUsers = async () => {
  const result = await query(
    `SELECT u.id, u.username, u.full_name, u.email, u.phone, 
            u.created_at, u.updated_at,
            r.id as role_id, r.name as role_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     ORDER BY u.created_at DESC`
  );

  return result.rows;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string) => {
  const result = await query(
    `SELECT u.id, u.username, u.full_name, u.email, u.phone, 
            u.created_at, u.updated_at,
            r.id as role_id, r.name as role_name, r.permissions
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('User not found');
  }

  return result.rows[0];
};

/**
 * Create a new user
 */
export const createUser = async (userData: CreateUserDto) => {
  // Check if username already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE username = $1',
    [userData.username]
  );

  if (existingUser.rows.length > 0) {
    throw ApiError.conflict('Username already exists');
  }

  // Check if email already exists
  if (userData.email) {
    const existingEmail = await query(
      'SELECT id FROM users WHERE email = $1',
      [userData.email]
    );

    if (existingEmail.rows.length > 0) {
      throw ApiError.conflict('Email already exists');
    }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(userData.password, 10);

  // Create user
  const result = await query(
    `INSERT INTO users (username, password_hash, full_name, role_id, email, phone, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING id, username, full_name, email, phone, role_id, created_at, updated_at`,
    [
      userData.username,
      passwordHash,
      userData.full_name,
      userData.role_id,
      userData.email,
      userData.phone || null,
    ]
  );

  // Fetch user with role information
  return getUserById(result.rows[0].id);
};

/**
 * Update user
 */
export const updateUser = async (userId: string, updates: UpdateUserDto) => {
  // Check if user exists
  const user = await query('SELECT id FROM users WHERE id = $1', [userId]);
  
  if (user.rows.length === 0) {
    throw ApiError.notFound('User not found');
  }

  // Check if username is being changed and if it's already taken
  if (updates.username) {
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [updates.username, userId]
    );

    if (existingUser.rows.length > 0) {
      throw ApiError.conflict('Username already exists');
    }
  }

  // Check if email is being changed and if it's already taken
  if (updates.email) {
    const existingEmail = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [updates.email, userId]
    );

    if (existingEmail.rows.length > 0) {
      throw ApiError.conflict('Email already exists');
    }
  }

  // Build dynamic update query
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.username !== undefined) {
    fields.push(`username = $${paramCount}`);
    values.push(updates.username);
    paramCount++;
  }

  if (updates.full_name !== undefined) {
    fields.push(`full_name = $${paramCount}`);
    values.push(updates.full_name);
    paramCount++;
  }

  if (updates.email !== undefined) {
    fields.push(`email = $${paramCount}`);
    values.push(updates.email);
    paramCount++;
  }

  if (updates.phone !== undefined) {
    fields.push(`phone = $${paramCount}`);
    values.push(updates.phone);
    paramCount++;
  }

  if (updates.role_id !== undefined) {
    fields.push(`role_id = $${paramCount}`);
    values.push(updates.role_id);
    paramCount++;
  }

  // Hash password if provided
  if (updates.password) {
    const passwordHash = await bcrypt.hash(updates.password, 10);
    fields.push(`password_hash = $${paramCount}`);
    values.push(passwordHash);
    paramCount++;
  }

  if (fields.length === 0) {
    throw ApiError.badRequest('No fields to update');
  }

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  await query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}`,
    values
  );

  // Return updated user with role information
  return getUserById(userId);
};

/**
 * Delete user
 */
export const deleteUser = async (userId: string) => {
  // Check if user exists
  const user = await query('SELECT id FROM users WHERE id = $1', [userId]);
  
  if (user.rows.length === 0) {
    throw ApiError.notFound('User not found');
  }

  // Delete user
  await query('DELETE FROM users WHERE id = $1', [userId]);

  return { message: 'User deleted successfully' };
};

/**
 * Get users count by role
 */
export const getUsersCountByRole = async () => {
  const result = await query(
    `SELECT r.id, r.name, COUNT(u.id) as user_count
     FROM roles r
     LEFT JOIN users u ON r.id = u.role_id
     GROUP BY r.id, r.name
     ORDER BY r.name`
  );

  return result.rows;
};
