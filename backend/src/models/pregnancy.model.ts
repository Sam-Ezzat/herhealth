import { query } from '../config/database';

export interface Pregnancy {
  id: string;
  patient_id: string;
  lmp: Date;
  edd: Date;
  gravida: number;
  para: number;
  abortion: number;
  living: number;
  pregnancy_number: number;
  risk_flags?: string;
  status: 'active' | 'delivered' | 'terminated' | 'miscarriage';
  delivery_date?: Date;
  delivery_type?: string;
  baby_weight_kg?: number;
  complications?: string;
  outcome?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PregnancyWithPatient extends Pregnancy {
  patient_name: string;
  patient_phone: string;
  patient_dob: Date;
  current_week?: number;
}

export interface PregnancyVisit {
  id: string;
  visit_date: Date;
  pregnancy_week: number;
  clinical_notes?: string;
  pregnancy_notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
  doctor_name?: string;
  // OB record data
  weight_kg?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  fundal_height_cm?: number;
  fetal_heart_rate?: string;
  ob_notes?: string;
}

export interface PregnancyJourney extends Pregnancy {
  patient_name: string;
  current_week: number;
  visits: PregnancyVisit[];
  total_visits: number;
}

// Get all pregnancies for a patient
export const findPregnanciesByPatientId = async (
  patientId: string
): Promise<PregnancyWithPatient[]> => {
  const sql = `
    SELECT 
      p.*,
      calculate_pregnancy_week(p.lmp) as current_week,
      CONCAT(pt.first_name, ' ', pt.last_name) as patient_name,
      pt.phone as patient_phone,
      pt.date_of_birth as patient_dob
    FROM pregnancies p
    JOIN patients pt ON p.patient_id = pt.id
    WHERE p.patient_id = $1
    ORDER BY p.created_at DESC
  `;
  const result = await query(sql, [patientId]);
  return result.rows;
};

// Get pregnancy by ID with patient info
export const findPregnancyById = async (
  id: string
): Promise<PregnancyWithPatient | null> => {
  const sql = `
    SELECT 
      p.*,
      calculate_pregnancy_week(p.lmp) as current_week,
      CONCAT(pt.first_name, ' ', pt.last_name) as patient_name,
      pt.phone as patient_phone,
      pt.date_of_birth as patient_dob
    FROM pregnancies p
    JOIN patients pt ON p.patient_id = pt.id
    WHERE p.id = $1
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

// Get complete pregnancy journey with all visits and OB records
export const findPregnancyJourneyById = async (
  pregnancyId: string
): Promise<PregnancyJourney | null> => {
  // Get pregnancy details
  const pregnancySql = `
    SELECT 
      p.*,
      calculate_pregnancy_week(p.lmp) as current_week,
      CONCAT(pt.first_name, ' ', pt.last_name) as patient_name
    FROM pregnancies p
    JOIN patients pt ON p.patient_id = pt.id
    WHERE p.id = $1
  `;
  const pregnancyResult = await query(pregnancySql, [pregnancyId]);
  
  if (pregnancyResult.rows.length === 0) {
    return null;
  }

  const pregnancy = pregnancyResult.rows[0];

  // Get all visits for this pregnancy with OB records
  const visitsSql = `
    SELECT 
      v.id,
      v.visit_date,
      v.pregnancy_week,
      v.clinical_notes,
      v.pregnancy_notes,
      v.diagnosis,
      v.treatment_plan,
      CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
      ob.weight_kg,
      ob.bp_systolic,
      ob.bp_diastolic,
      ob.fundal_height_cm,
      ob.fetal_heart_rate,
      ob.notes as ob_notes
    FROM visits v
    LEFT JOIN doctors d ON v.doctor_id = d.id
    LEFT JOIN ob_records ob ON ob.visit_id = v.id
    WHERE v.pregnancy_id = $1
    ORDER BY v.visit_date ASC
  `;
  const visitsResult = await query(visitsSql, [pregnancyId]);

  return {
    ...pregnancy,
    visits: visitsResult.rows,
    total_visits: visitsResult.rows.length,
  };
};

// Get pregnancy journey by patient ID (active pregnancy)
export const findActivePregnancyJourneyByPatientId = async (
  patientId: string
): Promise<PregnancyJourney | null> => {
  // Get active pregnancy
  const pregnancySql = `
    SELECT 
      p.*,
      calculate_pregnancy_week(p.lmp) as current_week,
      CONCAT(pt.first_name, ' ', pt.last_name) as patient_name
    FROM pregnancies p
    JOIN patients pt ON p.patient_id = pt.id
    WHERE p.patient_id = $1 AND p.status = 'active'
    ORDER BY p.created_at DESC
    LIMIT 1
  `;
  const pregnancyResult = await query(pregnancySql, [patientId]);
  
  if (pregnancyResult.rows.length === 0) {
    return null;
  }

  const pregnancy = pregnancyResult.rows[0];

  // Get all visits for this pregnancy with OB records
  const visitsSql = `
    SELECT 
      v.id,
      v.visit_date,
      v.pregnancy_week,
      v.clinical_notes,
      v.pregnancy_notes,
      v.diagnosis,
      v.treatment_plan,
      CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
      ob.weight_kg,
      ob.bp_systolic,
      ob.bp_diastolic,
      ob.fundal_height_cm,
      ob.fetal_heart_rate,
      ob.notes as ob_notes
    FROM visits v
    LEFT JOIN doctors d ON v.doctor_id = d.id
    LEFT JOIN ob_records ob ON ob.visit_id = v.id
    WHERE v.pregnancy_id = $1
    ORDER BY v.visit_date ASC
  `;
  const visitsResult = await query(visitsSql, [pregnancy.id]);

  return {
    ...pregnancy,
    visits: visitsResult.rows,
    total_visits: visitsResult.rows.length,
  };
};

// Create new pregnancy
export const createPregnancy = async (
  pregnancyData: Omit<Pregnancy, 'id' | 'created_at' | 'updated_at' | 'pregnancy_number'>
): Promise<Pregnancy> => {
  // Get next pregnancy number for patient
  const numberSql = `
    SELECT COALESCE(MAX(pregnancy_number), 0) + 1 as next_number
    FROM pregnancies
    WHERE patient_id = $1
  `;
  const numberResult = await query(numberSql, [pregnancyData.patient_id]);
  const pregnancyNumber = numberResult.rows[0].next_number;

  const sql = `
    INSERT INTO pregnancies (
      patient_id, lmp, edd, gravida, para, abortion, living,
      pregnancy_number, risk_flags, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const values = [
    pregnancyData.patient_id,
    pregnancyData.lmp,
    pregnancyData.edd,
    pregnancyData.gravida || 1,
    pregnancyData.para || 0,
    pregnancyData.abortion || 0,
    pregnancyData.living || 0,
    pregnancyNumber,
    pregnancyData.risk_flags || null,
    pregnancyData.status || 'active',
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

// Update pregnancy
export const updatePregnancy = async (
  id: string,
  pregnancyData: Partial<Omit<Pregnancy, 'id' | 'created_at' | 'updated_at' | 'patient_id' | 'pregnancy_number'>>
): Promise<Pregnancy | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(pregnancyData).forEach(([key, value]) => {
    if (
      key !== 'id' &&
      key !== 'created_at' &&
      key !== 'updated_at' &&
      key !== 'patient_id' &&
      key !== 'pregnancy_number'
    ) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) {
    return null;
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const sql = `
    UPDATE pregnancies
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  values.push(id);

  const result = await query(sql, values);
  return result.rows[0] || null;
};

// Delete pregnancy
export const deletePregnancy = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM pregnancies WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rowCount !== null && result.rowCount > 0;
};

// Create OB record for a visit
export const createOBRecord = async (data: {
  pregnancy_id: string;
  visit_id: string;
  record_date: Date;
  pregnancy_week?: number;
  weight_kg?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  fundal_height_cm?: number;
  fetal_heart_rate?: string;
  notes?: string;
}) => {
  const sql = `
    INSERT INTO ob_records (
      pregnancy_id, visit_id, record_date, pregnancy_week,
      weight_kg, bp_systolic, bp_diastolic, fundal_height_cm,
      fetal_heart_rate, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const values = [
    data.pregnancy_id,
    data.visit_id,
    data.record_date,
    data.pregnancy_week,
    data.weight_kg,
    data.bp_systolic,
    data.bp_diastolic,
    data.fundal_height_cm,
    data.fetal_heart_rate,
    data.notes,
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

// Update OB record
export const updateOBRecord = async (visitId: string, data: Partial<{
  weight_kg: number;
  bp_systolic: number;
  bp_diastolic: number;
  fundal_height_cm: number;
  fetal_heart_rate: string;
  notes: string;
}>) => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(data).forEach(([key, value]) => {
    fields.push(`${key} = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  });

  if (fields.length === 0) {
    return null;
  }

  const sql = `
    UPDATE ob_records
    SET ${fields.join(', ')}
    WHERE visit_id = $${paramIndex}
    RETURNING *
  `;
  values.push(visitId);

  const result = await query(sql, values);
  return result.rows[0] || null;
};
