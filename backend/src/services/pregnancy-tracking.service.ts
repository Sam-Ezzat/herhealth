import PregnancyTrackingModel from '../models/pregnancy-tracking.model';

export const getPregnancyJourney = async (patientId: string) => {
  return await PregnancyTrackingModel.getPregnancyJourney(patientId);
};

export const updatePregnancyTracking = async (
  patientId: string,
  data: {
    is_pregnant: boolean;
    lmp?: Date;
    edd?: Date;
    pregnancy_status?: string;
    gravida?: number;
    para?: number;
    abortion?: number;
    living?: number;
  }
) => {
  return await PregnancyTrackingModel.updatePregnancyTracking(patientId, data);
};

export const calculatePregnancyWeek = (lmp: Date) => {
  // Calculate manually since the model method is private
  const today = new Date();
  const lmpDate = new Date(lmp);
  const diffTime = today.getTime() - lmpDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const week = Math.floor(diffDays / 7);
  const day = diffDays % 7;
  
  return { week, day };
};

export const calculateEDD = (lmp: Date) => {
  return PregnancyTrackingModel.calculateEDD(lmp);
};
