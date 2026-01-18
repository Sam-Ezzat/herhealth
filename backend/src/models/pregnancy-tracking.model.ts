import pool from '../config/database';

export interface PregnancyWeek {
  week: number;
  trimester: number;
  title: string;
  baby_development: string;
  mother_changes: string;
  tips: string[];
  checkup_notes?: string;
}

export interface PregnancyJourney {
  patient_id: string;
  patient_name: string;
  lmp: Date;
  edd: Date;
  current_week: number;
  current_day: number;
  trimester: number;
  gravida?: number;
  para?: number;
  abortion?: number;
  living?: number;
  pregnancy_status: string;
  weeks_completed: PregnancyWeek[];
  current_week_info: PregnancyWeek;
  upcoming_milestones: string[];
}

// Pregnancy week information database
const PREGNANCY_WEEKS_INFO: Record<number, Omit<PregnancyWeek, 'week' | 'checkup_notes'>> = {
  4: {
    trimester: 1,
    title: 'The Journey Begins',
    baby_development: 'Embryo is about 2mm. Neural tube forming.',
    mother_changes: 'May start experiencing early pregnancy symptoms.',
    tips: ['Start prenatal vitamins', 'Schedule first OB appointment', 'Avoid alcohol and smoking']
  },
  8: {
    trimester: 1,
    title: 'Baby Takes Shape',
    baby_development: 'About 1.6cm. Arms and legs developing. Heart beating.',
    mother_changes: 'Morning sickness may peak. Increased fatigue.',
    tips: ['Eat small frequent meals', 'Stay hydrated', 'Get plenty of rest']
  },
  12: {
    trimester: 1,
    title: 'End of First Trimester',
    baby_development: 'About 5.4cm. All major organs formed. Can move.',
    mother_changes: 'Morning sickness usually improves. Energy returns.',
    tips: ['NT scan scheduled', 'Continue prenatal vitamins', 'Start gentle exercise']
  },
  16: {
    trimester: 2,
    title: 'Growing Stronger',
    baby_development: 'About 11.6cm. Can hear sounds. Gender may be visible.',
    mother_changes: 'Baby bump showing. May feel flutters.',
    tips: ['Anatomy scan coming up', 'Stay active', 'Maintain healthy diet']
  },
  20: {
    trimester: 2,
    title: 'Halfway There!',
    baby_development: 'About 25cm. Fully formed. Active movements.',
    mother_changes: 'Regular movements felt. Belly growing.',
    tips: ['Anatomy scan done', 'Monitor baby movements', 'Pelvic floor exercises']
  },
  24: {
    trimester: 2,
    title: 'Viability Milestone',
    baby_development: 'About 30cm. Eyes can open. Gaining weight.',
    mother_changes: 'Glucose screening. May have backaches.',
    tips: ['Glucose tolerance test', 'Good posture', 'Supportive shoes']
  },
  28: {
    trimester: 3,
    title: 'Third Trimester Begins',
    baby_development: 'About 37cm. Brain developing rapidly. Can recognize voice.',
    mother_changes: 'Braxton Hicks contractions. Shortness of breath.',
    tips: ['Start childbirth classes', 'Monitor kick counts', 'Sleep on left side']
  },
  32: {
    trimester: 3,
    title: 'Final Preparations',
    baby_development: 'About 42cm. Practicing breathing. Building immunity.',
    mother_changes: 'Frequent urination. Swelling may occur.',
    tips: ['Weekly checkups start', 'Hospital bag ready', 'Birth plan discussion']
  },
  36: {
    trimester: 3,
    title: 'Almost Ready',
    baby_development: 'About 47cm. Moving into birth position. Fully developed.',
    mother_changes: 'Pelvic pressure. Difficulty sleeping.',
    tips: ['Weekly checkups', 'Watch for labor signs', 'Rest when possible']
  },
  40: {
    trimester: 3,
    title: 'Due Date!',
    baby_development: 'About 50cm. Ready for birth. Waiting for labor.',
    mother_changes: 'Any day now! Watch for contractions and water breaking.',
    tips: ['Know labor signs', 'Stay calm', 'Hospital ready']
  }
};

class PregnancyTrackingModel {
  // Calculate current pregnancy week from LMP
  private calculatePregnancyWeek(lmp: Date, targetDate: Date = new Date()): { week: number; day: number } {
    const lmpDate = new Date(lmp);
    const target = new Date(targetDate);
    const diffTime = target.getTime() - lmpDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const week = Math.floor(diffDays / 7);
    const day = diffDays % 7;
    
    return { week, day };
  }

  // Calculate EDD from LMP (Naegele's rule: LMP + 280 days)
  calculateEDD(lmp: Date): Date {
    const edd = new Date(lmp);
    edd.setDate(edd.getDate() + 280);
    return edd;
  }

  // Get trimester from week
  getTrimester(week: number): number {
    if (week <= 13) return 1;
    if (week <= 27) return 2;
    return 3;
  }

  // Get pregnancy journey for a patient
  async getPregnancyJourney(patientId: string): Promise<PregnancyJourney | null> {
    const query = `
      SELECT 
        p.id as patient_id,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.lmp,
        p.edd,
        p.current_pregnancy_week,
        p.gravida,
        p.para,
        p.abortion,
        p.living,
        p.pregnancy_status,
        p.is_pregnant
      FROM patients p
      WHERE p.id = $1 AND p.is_pregnant = true
    `;

    const result = await pool.query(query, [patientId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const patient = result.rows[0];
    const { week, day } = this.calculatePregnancyWeek(patient.lmp);
    const trimester = this.getTrimester(week);

    // Get visit notes for completed weeks
    const visitsQuery = `
      SELECT 
        v.visit_date,
        v.clinical_notes,
        v.diagnosis
      FROM visits v
      WHERE v.patient_id = $1
      AND v.visit_date >= $2
      ORDER BY v.visit_date ASC
    `;
    
    const visits = await pool.query(visitsQuery, [patientId, patient.lmp]);

    // Build weeks completed with visit notes
    const weeksCompleted: PregnancyWeek[] = [];
    for (let w = 4; w <= Math.min(week, 40); w += 4) {
      const weekInfo = PREGNANCY_WEEKS_INFO[w];
      if (weekInfo) {
        const weekVisits = visits.rows.filter(v => {
          const visitWeek = this.calculatePregnancyWeek(patient.lmp, new Date(v.visit_date)).week;
          return Math.abs(visitWeek - w) <= 2; // Visit within 2 weeks
        });

        weeksCompleted.push({
          week: w,
          trimester: weekInfo.trimester,
          title: weekInfo.title,
          baby_development: weekInfo.baby_development,
          mother_changes: weekInfo.mother_changes,
          tips: weekInfo.tips,
          checkup_notes: weekVisits.length > 0 ? weekVisits.map(v => v.clinical_notes || v.diagnosis).join('; ') : undefined
        });
      }
    }

    // Get current week info
    const nearestWeek = Math.floor(week / 4) * 4 || 4;
    const currentWeekInfoData = PREGNANCY_WEEKS_INFO[nearestWeek] || PREGNANCY_WEEKS_INFO[4];
    const currentWeekInfo: PregnancyWeek = {
      week,
      trimester,
      title: `Week ${week} - ${currentWeekInfoData.title}`,
      baby_development: currentWeekInfoData.baby_development,
      mother_changes: currentWeekInfoData.mother_changes,
      tips: currentWeekInfoData.tips
    };

    // Upcoming milestones
    const upcomingMilestones: string[] = [];
    if (week < 12) upcomingMilestones.push('NT Scan (Week 11-14)');
    if (week < 20) upcomingMilestones.push('Anatomy Scan (Week 18-22)');
    if (week < 24) upcomingMilestones.push('Glucose Screening (Week 24-28)');
    if (week < 28) upcomingMilestones.push('Third Trimester Begins (Week 28)');
    if (week < 36) upcomingMilestones.push('Weekly Checkups Start (Week 36)');
    if (week >= 36) upcomingMilestones.push('Baby Can Arrive Any Time!');

    return {
      patient_id: patient.patient_id,
      patient_name: patient.patient_name,
      lmp: patient.lmp,
      edd: patient.edd,
      current_week: week,
      current_day: day,
      trimester,
      gravida: patient.gravida,
      para: patient.para,
      abortion: patient.abortion,
      living: patient.living,
      pregnancy_status: patient.pregnancy_status || 'active',
      weeks_completed: weeksCompleted,
      current_week_info: currentWeekInfo,
      upcoming_milestones: upcomingMilestones
    };
  }

  // Update pregnancy tracking
  async updatePregnancyTracking(
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
  ): Promise<void> {
    let currentWeek = null;
    let calculatedEdd = data.edd;

    if (data.is_pregnant && data.lmp) {
      const { week } = this.calculatePregnancyWeek(data.lmp);
      currentWeek = week;
      
      if (!calculatedEdd) {
        calculatedEdd = this.calculateEDD(data.lmp);
      }
    }

    const query = `
      UPDATE patients
      SET 
        is_pregnant = $1,
        lmp = $2,
        edd = $3,
        pregnancy_status = $4,
        current_pregnancy_week = $5,
        gravida = $6,
        para = $7,
        abortion = $8,
        living = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
    `;

    await pool.query(query, [
      data.is_pregnant,
      data.lmp || null,
      calculatedEdd || null,
      data.pregnancy_status || (data.is_pregnant ? 'active' : null),
      currentWeek,
      data.gravida || null,
      data.para || null,
      data.abortion || null,
      data.living || null,
      patientId
    ]);
  }
}

export default new PregnancyTrackingModel();
