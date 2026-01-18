import { Request, Response, NextFunction } from 'express';
import * as PregnancyTrackingService from '../services/pregnancy-tracking.service';

// Get pregnancy journey for patient
export const getPregnancyJourney = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    
    const journey = await PregnancyTrackingService.getPregnancyJourney(patientId);
    
    if (!journey) {
      res.status(404).json({
        success: false,
        error: 'Patient is not currently pregnant or not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: journey
    });
  } catch (error) {
    next(error);
  }
};

// Update pregnancy tracking
export const updatePregnancyTracking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const data = req.body;
    
    await PregnancyTrackingService.updatePregnancyTracking(patientId, data);
    
    res.json({
      success: true,
      message: 'Pregnancy tracking updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Calculate pregnancy week from LMP
export const calculatePregnancyWeek = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lmp } = req.body;
    
    if (!lmp) {
      res.status(400).json({
        success: false,
        error: 'LMP date is required'
      });
      return;
    }
    
    const result = PregnancyTrackingService.calculatePregnancyWeek(new Date(lmp));
    const edd = PregnancyTrackingService.calculateEDD(new Date(lmp));
    
    res.json({
      success: true,
      data: {
        ...result,
        edd
      }
    });
  } catch (error) {
    next(error);
  }
};
