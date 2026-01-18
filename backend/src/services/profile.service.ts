import { query } from '../config/database';
import bcrypt from 'bcrypt';
import ApiError from '../utils/ApiError';

export interface UpdateProfileDto {
  full_name?: string;
  email?: string;
  phone?: string;
}

export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
}

/**
 * Get user profile with role information
 */
export const getProfile = async (userId: string) => {
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
 * Update user profile
 */
export const updateProfile = async (
  userId: string,
  updates: UpdateProfileDto
) => {
  // Build dynamic update query
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

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

  if (fields.length === 0) {
    throw ApiError.badRequest('No fields to update');
  }

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await query(
    `UPDATE users 
     SET ${fields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING id, username, full_name, email, phone, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('User not found');
  }

  return result.rows[0];
};

/**
 * Change user password
 */
export const changePassword = async (
  userId: string,
  passwordData: ChangePasswordDto
) => {
  // Get current password hash
  const userResult = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw ApiError.notFound('User not found');
  }

  const user = userResult.rows[0];

  // Verify current password
  const isValidPassword = await bcrypt.compare(
    passwordData.current_password,
    user.password_hash
  );

  if (!isValidPassword) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(passwordData.new_password, 10);

  // Update password
  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, userId]
  );

  return { message: 'Password changed successfully' };
};
