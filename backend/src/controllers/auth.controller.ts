import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import ApiResponse from '../utils/ApiResponse';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    const result = await authService.login(username, password);

    res.json(
      ApiResponse.success(
        result,
        'Login successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password, fullName, email, phone } = req.body;
    let { roleId } = req.body;

    // If no roleId provided, assign default "Doctor" role
    if (!roleId) {
      const { query } = await import('../config/database');
      const result = await query("SELECT id FROM roles WHERE name = 'Doctor' LIMIT 1");
      if (result.rows.length > 0) {
        roleId = result.rows[0].id;
      } else {
        throw new Error('Default role not found. Please contact administrator.');
      }
    }

    const result = await authService.register(
      username,
      password,
      fullName,
      roleId,
      email,
      phone
    );

    res.status(201).json(
      ApiResponse.success(
        result,
        'Registration successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    const result = await authService.refreshAccessToken(refreshToken);

    res.json(
      ApiResponse.success(
        result,
        'Token refreshed successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const user = await authService.getCurrentUser(req.user.id);

    res.json(
      ApiResponse.success(
        user,
        'User retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // In a production app, you might want to blacklist the token here
    res.json(
      ApiResponse.success(
        null,
        'Logout successful'
      )
    );
  } catch (error) {
    next(error);
  }
};
