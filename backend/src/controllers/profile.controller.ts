import { Request, Response, NextFunction } from 'express';
import * as profileService from '../services/profile.service';
import ApiResponse from '../utils/ApiResponse';

/**
 * @route   GET /api/v1/profile
 * @desc    Get current user profile
 * @access  Private
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(
        ApiResponse.error('User not authenticated', 401)
      );
    }

    const profile = await profileService.getProfile(req.user.id);

    return res.json(
      ApiResponse.success(profile, 'Profile retrieved successfully')
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * @route   PUT /api/v1/profile
 * @desc    Update current user profile
 * @access  Private
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(
        ApiResponse.error('User not authenticated', 401)
      );
    }

    const updates = {
      full_name: req.body.full_name,
      email: req.body.email,
      phone: req.body.phone,
    };

    const updatedProfile = await profileService.updateProfile(
      req.user.id,
      updates
    );

    return res.json(
      ApiResponse.success(updatedProfile, 'Profile updated successfully')
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * @route   POST /api/v1/profile/change-password
 * @desc    Change user password
 * @access  Private
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(
        ApiResponse.error('User not authenticated', 401)
      );
    }

    const passwordData = {
      current_password: req.body.current_password,
      new_password: req.body.new_password,
    };

    const result = await profileService.changePassword(
      req.user.id,
      passwordData
    );

    return res.json(ApiResponse.success(result, result.message));
  } catch (error) {
    return next(error);
  }
};
