import { query } from '../config/database';

export interface Visit {
  id: string;
  appointment_id?: string;
  patient_id: string;
  doctor_id: string;
  visit_date: Date;
  reason: string;
  clinical_notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
  pregnancy_id?: string;
  pregnancy_notes?: string;
  pregnancy_week?: number;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  patient_name?: string;
  doctor_name?: string;
  patient_phone?: string;
}

export interface VisitFilters {
  patient_id?: string;
  doctor_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface PatientVisitSummary {
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  pregnancy_id?: string;
  pregnancy_status?: string;
  current_pregnancy_week?: number;
  lmp?: Date;
  edd?: Date;
  total_visits: number;
  last_visit_id: string;
  last_visit_date: Date;
  last_visit_notes?: string;
  last_diagnosis?: string;
  last_doctor_name?: string;
  last_pregnancy_week?: number;
}

export interface PatientVisitHistory {
  id: string;
  visit_date: Date;
  pregnancy_week?: number;
  reason: string;
  clinical_notes?: string;
  pregnancy_notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
  doctor_name: string;
  doctor_id: string;
  created_at: Date;
}

// Get all visits with filters
export const findAllVisits = async (filters: VisitFilters = {}): Promise<Visit[]> => {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (filters.patient_id) {
    conditions.push(`v.patient_id = $${paramIndex}`);
    values.push(filters.patient_id);
    paramIndex++;
  }

  if (filters.doctor_id) {
    conditions.push(`v.doctor_id = $${paramIndex}`);
    values.push(filters.doctor_id);
    paramIndex++;
  }

  if (filters.date_from) {
    conditions.push(`v.visit_date >= $${paramIndex}`);
    values.push(filters.date_from);
    paramIndex++;
  }

  if (filters.date_to) {
    conditions.push(`v.visit_date <= $${paramIndex}`);
    values.push(filters.date_to);
    paramIndex++;
  }

  if (filters.search) {
    conditions.push(`(
      CONCAT(p.first_name, ' ', p.last_name) ILIKE $${paramIndex} OR
      CONCAT(d.first_name, ' ', d.last_name) ILIKE $${paramIndex} OR
      v.reason ILIKE $${paramIndex} OR
      v.diagnosis ILIKE $${paramIndex} OR
      v.clinical_notes ILIKE $${paramIndex}
    )`);
    values.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      v.*,
      CONCAT(p.first_name, ' ', p.last_name) as patient_name,
      p.phone as patient_phone,
      CONCAT(d.first_name, ' ', d.last_name) as doctor_name
    FROM visits v
    LEFT JOIN patients p ON v.patient_id = p.id
    LEFT JOIN doctors d ON v.doctor_id = d.id
    ${whereClause}
    ORDER BY v.visit_date DESC, v.created_at DESC
  `;

  const result = await query(sql, values);
  return result.rows;
};

// Get visit by ID
export const findVisitById = async (id: string): Promise<Visit | null> => {
  const sql = `
    SELECT 
      v.*,
      CONCAT(p.first_name, ' ', p.last_name) as patient_name,
      p.phone as patient_phone,
      CONCAT(d.first_name, ' ', d.last_name) as doctor_name
    FROM visits v
    LEFT JOIN patients p ON v.patient_id = p.id
    LEFT JOIN doctors d ON v.doctor_id = d.id
    WHERE v.id = $1
  `;

  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

// Create new visit
export const createVisit = async (
  visitData: Omit<Visit, 'id' | 'created_at' | 'updated_at' | 'patient_name' | 'doctor_name' | 'patient_phone'>
): Promise<Visit> => {
  const {
    appointment_id,
    patient_id,
    doctor_id,
    visit_date,
    reason,
    clinical_notes,
    diagnosis,
    treatment_plan,
    pregnancy_id,
    pregnancy_notes,
    pregnancy_week,
  } = visitData;

  const sql = `
    INSERT INTO visits (
      appointment_id, patient_id, doctor_id, visit_date, reason, 
      clinical_notes, diagnosis, treatment_plan, pregnancy_id, pregnancy_notes, pregnancy_week
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const result = await query(sql, [
    appointment_id || null,
    patient_id,
    doctor_id,
    visit_date,
    reason,
    clinical_notes || null,
    diagnosis || null,
    treatment_plan || null,
    pregnancy_id || null,
    pregnancy_notes || null,
    pregnancy_week || null,
  ]);

  return findVisitById(result.rows[0].id) as Promise<Visit>;
};

// Update visit
export const updateVisit = async (
  id: string,
  visitData: Partial<Omit<Visit, 'id' | 'created_at' | 'updated_at' | 'patient_name' | 'doctor_name' | 'patient_phone'>>
): Promise<Visit | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(visitData).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) return null;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const sql = `
    UPDATE visits
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  values.push(id);

  const result = await query(sql, values);
  
  if (result.rows.length === 0) return null;
  
  return findVisitById(result.rows[0].id);
};

// Delete visit
export const deleteVisit = async (id: string): Promise<boolean> => {
  try {
    const sql = `DELETE FROM visits WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error: any) {
    // Handle foreign key constraint violation
    if (error.code === '23503') {
      // Get the constraint name to provide better error message
      const constraintName = error.constraint || 'unknown';
      throw new Error(
        `Cannot delete visit because it has related records (${constraintName}). ` +
        'Please delete the related records first.'
      );
    }
    throw error;
  }
};

// Get visit statistics
export const getVisitStats = async (): Promise<any> => {
  const sql = `
    SELECT
      COUNT(*) as total_visits,
      COUNT(*) FILTER (WHERE visit_date = CURRENT_DATE) as today,
      COUNT(*) FILTER (WHERE visit_date >= CURRENT_DATE - INTERVAL '7 days') as this_week,
      COUNT(*) FILTER (WHERE visit_date >= CURRENT_DATE - INTERVAL '30 days') as this_month,
      COUNT(*) FILTER (WHERE visit_date >= CURRENT_DATE AND clinical_notes IS NULL) as pending_count
    FROM visits
  `;

  const result = await query(sql);
  return result.rows[0];
};

// Get patient visit summaries (one record per patient with last visit info)
export const findPatientVisitSummaries = async (filters: VisitFilters = {}): Promise<PatientVisitSummary[]> => {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (filters.search) {
    conditions.push(`(
      CONCAT(p.first_name, ' ', p.last_name) ILIKE $${paramIndex} OR
      p.phone ILIKE $${paramIndex}
    )`);
    values.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

  const sql = `
    WITH last_visits AS (
      SELECT DISTINCT ON (v.patient_id)
        v.patient_id,
        v.id as last_visit_id,
        v.visit_date as last_visit_date,
        v.clinical_notes as last_visit_notes,
        v.diagnosis as last_diagnosis,
        v.pregnancy_week as last_pregnancy_week,
        v.pregnancy_id,
        CONCAT(d.first_name, ' ', d.last_name) as last_doctor_name,
        COUNT(*) OVER (PARTITION BY v.patient_id) as total_visits
      FROM visits v
      LEFT JOIN doctors d ON v.doctor_id = d.id
      ORDER BY v.patient_id, v.visit_date DESC, v.created_at DESC
    )
    SELECT 
      lv.patient_id,
      CONCAT(p.first_name, ' ', p.last_name) as patient_name,
      p.phone as patient_phone,
      lv.pregnancy_id,
      pr.status as pregnancy_status,
      calculate_pregnancy_week(pr.lmp) as current_pregnancy_week,
      pr.lmp,
      pr.edd,
      lv.total_visits,
      lv.last_visit_id,
      lv.last_visit_date,
      lv.last_visit_notes,
      lv.last_diagnosis,
      lv.last_doctor_name,
      lv.last_pregnancy_week
    FROM last_visits lv
    JOIN patients p ON lv.patient_id = p.id
    LEFT JOIN pregnancies pr ON lv.pregnancy_id = pr.id AND pr.status = 'active'
    WHERE 1=1 ${whereClause}
    ORDER BY lv.last_visit_date DESC
  `;

  const result = await query(sql, values);
  return result.rows;
};

// Get all visit history for a specific patient
export const findPatientVisitHistory = async (patientId: string): Promise<PatientVisitHistory[]> => {
  const sql = `
    SELECT 
      v.id,
      v.visit_date,
      v.pregnancy_week,
      v.reason,
      v.clinical_notes,
      v.pregnancy_notes,
      v.diagnosis,
      v.treatment_plan,
      v.doctor_id,
      v.created_at,
      CONCAT(d.first_name, ' ', d.last_name) as doctor_name
    FROM visits v
    LEFT JOIN doctors d ON v.doctor_id = d.id
    WHERE v.patient_id = $1
    ORDER BY v.visit_date DESC, v.created_at DESC
  `;

  const result = await query(sql, [patientId]);
  return result.rows;
};
