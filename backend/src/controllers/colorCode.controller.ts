import { Request, Response, NextFunction } from 'express';
import * as ColorCodeService from '../services/colorCode.service';

export const getAllColorCodes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colorCodes = await ColorCodeService.getAllColorCodes();
    
    res.json({
      success: true,
      data: colorCodes
    });
  } catch (error) {
    next(error);
  }
};

export const getColorCodeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const colorCode = await ColorCodeService.getColorCodeById(id);
    
    res.json({
      success: true,
      data: colorCode
    });
  } catch (error) {
    next(error);
  }
};

export const createColorCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colorCode = await ColorCodeService.createColorCode(req.body);
    
    res.status(201).json({
      success: true,
      data: colorCode
    });
  } catch (error) {
    next(error);
  }
};

export const updateColorCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const colorCode = await ColorCodeService.updateColorCode(id, req.body);
    
    res.json({
      success: true,
      data: colorCode
    });
  } catch (error) {
    next(error);
  }
};

export const deleteColorCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await ColorCodeService.deleteColorCode(id);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};
