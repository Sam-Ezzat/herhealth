import * as ColorCodeModel from '../models/colorCode.model';
import ApiError from '../utils/ApiError';

export const getAllColorCodes = async () => {
  return await ColorCodeModel.findAllColorCodes();
};

export const getColorCodeById = async (id: string) => {
  const colorCode = await ColorCodeModel.findColorCodeById(id);
  
  if (!colorCode) {
    throw ApiError.notFound('Color code not found');
  }
  
  return colorCode;
};

export const createColorCode = async (colorData: any) => {
  return await ColorCodeModel.createColorCode({
    color_name: colorData.color_name,
    color_hex: colorData.color_hex,
    notes: colorData.notes,
    is_active: colorData.is_active !== undefined ? colorData.is_active : true
  });
};

export const updateColorCode = async (id: string, colorData: any) => {
  const updated = await ColorCodeModel.updateColorCode(id, colorData);
  
  if (!updated) {
    throw ApiError.notFound('Color code not found');
  }
  
  return updated;
};

export const deleteColorCode = async (id: string) => {
  // Check if color code is in use
  const stats = await ColorCodeModel.getColorCodeStats(id);
  
  if (stats.patient_count > 0) {
    throw ApiError.badRequest(`Cannot delete color code. It is currently assigned to ${stats.patient_count} patient(s).`);
  }
  
  const deleted = await ColorCodeModel.deleteColorCode(id);
  
  if (!deleted) {
    throw ApiError.notFound('Color code not found');
  }
  
  return { message: 'Color code deleted successfully' };
};
