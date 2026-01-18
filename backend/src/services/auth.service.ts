import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config/env';
import * as UserModel from '../models/user.model';
import ApiError from '../utils/ApiError';

const SALT_ROUNDS = 10;

interface TokenPayload {
  id: string;
  username: string;
  roleId: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as any,
  };
  return jwt.sign(payload, config.jwt.secret, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as any,
  };
  return jwt.sign(payload, config.jwt.refreshSecret, options);
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
};

export const login = async (username: string, password: string) => {
  // Find user
  const user = await UserModel.findUserByUsername(username);

  if (!user) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password_hash);

  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  // Generate tokens
  const tokenPayload: TokenPayload = {
    id: user.id,
    username: user.username,
    roleId: user.role_id,
  };

  const token = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Return user data without password
  const { password_hash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
    refreshToken,
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);

  // Verify user still exists
  const user = await UserModel.findUserById(payload.id);

  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  // Generate new tokens
  const tokenPayload: TokenPayload = {
    id: user.id,
    username: user.username,
    roleId: user.role_id,
  };

  const newToken = generateToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  return {
    token: newToken,
    refreshToken: newRefreshToken,
  };
};

export const register = async (
  username: string,
  password: string,
  fullName: string,
  roleId: string,
  email: string,
  phone?: string
) => {
  // Check if username already exists
  const existingUser = await UserModel.findUserByUsername(username);

  if (existingUser) {
    throw ApiError.conflict('Username already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await UserModel.createUser(
    username,
    passwordHash,
    fullName,
    roleId,
    email,
    phone
  );

  // Generate tokens
  const tokenPayload: TokenPayload = {
    id: user.id,
    username: user.username,
    roleId: user.role_id,
  };

  const token = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Return user data without password
  const { password_hash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
    refreshToken,
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await UserModel.findUserById(userId);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Return user without password
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
