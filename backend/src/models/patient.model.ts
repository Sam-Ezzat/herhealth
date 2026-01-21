import { query } from '../config/database';

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_type?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  insurance_provider?: string;
  insurance_number?: string;
  color_code_id?: string;
  is_pregnant?: boolean;
  lmp?: Date;
  edd?: Date;
  pregnancy_status?: string;
  current_pregnancy_week?: number;
  gravida?: number;
  para?: number;
  abortion?: number;
  living?: number;
  created_at: Date;
  updated_at: Date;
}

export interface PatientWithColorCode extends Patient {
  color_code_name?: string;
  color_code_hex?: string;
}

export interface PatientSearchParams {
  search?: string;
  gender?: string;
  colorCodeId?: string;
  minAge?: number;
  maxAge?: number;
  limit?: number;
  offset?: number;
}

// Get all patients with optional filters and pagination
export const findAllPatients = async (
  params: PatientSearchParams = {}
): Promise<{ patients: PatientWithColorCode[]; total: number }> => {
  const {
    search,
    gender,
    colorCodeId,
    minAge,
    maxAge,
    limit = 50,
    offset = 0,
  } = params;

  let whereConditions: string[] = [];
  let queryParams: any[] = [];
  let paramIndex = 1;

  // Search by name, phone, or email
  if (search) {
    whereConditions.push(`(
      p.first_name ILIKE $${paramIndex} OR 
      p.last_name ILIKE $${paramIndex} OR 
      p.phone ILIKE $${paramIndex} OR 
      p.email ILIKE $${paramIndex}
    )`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  // Filter by gender
  if (gender) {
    whereConditions.push(`p.gender = $${paramIndex}`);
    queryParams.push(gender);
    paramIndex++;
  }

  // Filter by color code
  if (colorCodeId) {
    whereConditions.push(`p.color_code_id = $${paramIndex}`);
    queryParams.push(colorCodeId);
    paramIndex++;
  }

  // Filter by age range
  if (minAge !== undefined) {
    whereConditions.push(
      `DATE_PART('year', AGE(p.date_of_birth)) >= $${paramIndex}`
    );
    queryParams.push(minAge);
    paramIndex++;
  }

  if (maxAge !== undefined) {
    whereConditions.push(
      `DATE_PART('year', AGE(p.date_of_birth)) <= $${paramIndex}`
    );
    queryParams.push(maxAge);
    paramIndex++;
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM patients p
    ${whereClause}
  `;
  const countResult = await query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total);

  // Get patients with color code info
  const patientsQuery = `
    SELECT 
      p.*,
      cc.color_name as color_code_name,
      cc.color_hex as color_code_hex
    FROM patients p
    LEFT JOIN color_code cc ON p.color_code_id = cc.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  queryParams.push(limit, offset);

  const result = await query(patientsQuery, queryParams);

  return {
    patients: result.rows,
    total,
  };
};

// Get patient by ID
export const findPatientById = async (
  id: string
): Promise<PatientWithColorCode | null> => {
  const sql = `
    SELECT 
      p.*,
      cc.color_name as color_code_name,
      cc.color_hex as color_code_hex
    FROM patients p
    LEFT JOIN color_code cc ON p.color_code_id = cc.id
    WHERE p.id = $1
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

// Create new patient
export const createPatient = async (
  patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at'>
): Promise<Patient> => {
  const {
    first_name,
    last_name,
    date_of_birth,
    gender,
    phone,
    email,
    address,
    emergency_contact_name,
    emergency_contact_phone,
    blood_type,
    allergies,
    chronic_conditions,
    current_medications,
    insurance_provider,
    insurance_number,
    color_code_id,
    is_pregnant,
  } = patientData;

  const sql = `
    INSERT INTO patients (
      first_name, last_name, date_of_birth, gender, phone, email, address,
      emergency_contact_name, emergency_contact_phone, blood_type, allergies,
      chronic_conditions, current_medications, insurance_provider, insurance_number, color_code_id,
      is_pregnant
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `;

  const values = [
    first_name,
    last_name,
    date_of_birth,
    gender,
    phone,
    email || null,
    address || null,
    emergency_contact_name || null,
    emergency_contact_phone || null,
    blood_type || null,
    allergies || null,
    chronic_conditions || null,
    current_medications || null,
    insurance_provider || null,
    insurance_number || null,
    color_code_id || null,
    is_pregnant ?? false,
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

// Update patient
export const updatePatient = async (
  id: string,
  patientData: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>
): Promise<Patient | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // Build dynamic update query
  Object.entries(patientData).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) {
    return null;
  }

  // Always update updated_at
  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const sql = `
    UPDATE patients
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  values.push(id);

  const result = await query(sql, values);
  return result.rows[0] || null;
};

// Delete patient (soft delete by setting is_active = false or hard delete)
export const deletePatient = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM patients WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rowCount !== null && result.rowCount > 0;
};

// Check if patient exists by phone (to prevent duplicates)
export const findPatientByPhone = async (
  phone: string
): Promise<Patient | null> => {
  const sql = `SELECT * FROM patients WHERE phone = $1`;
  const result = await query(sql, [phone]);
  return result.rows[0] || null;
};

// Get all color codes
export const getAllColorCodes = async () => {
  const sql = `SELECT * FROM color_code WHERE is_active = true ORDER BY color_name`;
  const result = await query(sql);
  return result.rows;
};

// Get patient statistics
export const getPatientStats = async () => {
  const sql = `
    SELECT 
      COUNT(*) as total_patients,
      COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female_count,
      COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male_count,
      COUNT(CASE WHEN color_code_id IS NOT NULL THEN 1 END) as color_coded_count
    FROM patients
  `;
  const result = await query(sql);
  return result.rows[0];
};
