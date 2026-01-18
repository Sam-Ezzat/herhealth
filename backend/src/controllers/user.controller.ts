import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import ApiResponse from '../utils/ApiResponse';

/**
 * @route   GET /api/v1/users
 * @desc    Get all users
 * @access  Private (users.view permission)
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await userService.getAllUsers();
    return res.json(ApiResponse.success(users, 'Users retrieved successfully'));
  } catch (error) {
    return next(error);
  }
};

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (users.view permission)
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    return res.json(ApiResponse.success(user, 'User retrieved successfully'));
  } catch (error) {
    return next(error);
  }
};

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (users.create permission)
 */
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userData = {
      username: req.body.username,
      password: req.body.password,
      full_name: req.body.full_name,
      role_id: req.body.role_id,
      email: req.body.email,
      phone: req.body.phone,
    };

    const newUser = await userService.createUser(userData);
    return res
      .status(201)
      .json(ApiResponse.success(newUser, 'User created successfully'));
  } catch (error) {
    return next(error);
  }
};

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (users.update permission)
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = {
      username: req.body.username,
      full_name: req.body.full_name,
      role_id: req.body.role_id,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
    };

    const updatedUser = await userService.updateUser(id, updates);
    return res.json(
      ApiResponse.success(updatedUser, 'User updated successfully')
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user
 * @access  Private (users.delete permission)
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting yourself
    if (req.user?.id === id) {
      return res
        .status(400)
        .json(ApiResponse.error('You cannot delete your own account', 400));
    }

    const result = await userService.deleteUser(id);
    return res.json(ApiResponse.success(result, result.message));
  } catch (error) {
    return next(error);
  }
};

/**
 * @route   GET /api/v1/users/stats/by-role
 * @desc    Get users count by role
 * @access  Private (users.view permission)
 */
export const getUsersCountByRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await userService.getUsersCountByRole();
    return res.json(
      ApiResponse.success(stats, 'User statistics retrieved successfully')
    );
  } catch (error) {
    return next(error);
  }
};
