import { query } from '../config/database';

export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  phone: string;
  email: string;
  user_id?: string;
  created_at: Date;
}

// Get all doctors with optional search
export const findAllDoctors = async (
  searchTerm?: string,
  options: { limit?: number; offset?: number } = {}
) => {
  let sql = `
    SELECT 
      p.id,
      p.first_name,
      p.last_name,
      p.specialty,
      p.phone,
      p.email,
      p.user_id,
      p.created_at,
      u.username,
      u.full_name as user_full_name
    FROM doctors p
    LEFT JOIN users u ON p.user_id = u.id
  `;

  const params: any[] = [];

  if (searchTerm) {
    sql += ` WHERE 
      p.first_name ILIKE $1 OR 
      p.last_name ILIKE $1 OR 
      p.specialty ILIKE $1 OR
      p.email ILIKE $1 OR
      p.phone ILIKE $1
    `;
    params.push(`%${searchTerm}%`);
  }

  sql += ` ORDER BY p.last_name, p.first_name`;

  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);
  params.push(limit, offset);
  sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const result = await query(sql, params);
  return result.rows;
};

// Get doctor by ID
export const findDoctorById = async (id: string): Promise<Doctor | null> => {
  const sql = `
    SELECT 
      p.id,
      p.first_name,
      p.last_name,
      p.specialty,
      p.phone,
      p.email,
      p.user_id,
      p.created_at,
      u.username,
      u.full_name as user_full_name
    FROM doctors p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = $1
  `;

  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

// Create new doctor
export const createDoctor = async (
  doctorData: Omit<Doctor, 'id' | 'created_at'>
): Promise<Doctor> => {
  const { first_name, last_name, specialty, phone, email, user_id } = doctorData;

  const sql = `
    INSERT INTO doctors (first_name, last_name, specialty, phone, email, user_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const values = [
    first_name,
    last_name,
    specialty,
    phone,
    email,
    user_id || null,
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

// Update doctor
export const updateDoctor = async (
  id: string,
  doctorData: Partial<Omit<Doctor, 'id' | 'created_at'>>
): Promise<Doctor | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(doctorData).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) {
    return findDoctorById(id);
  }

  values.push(id);

  const sql = `
    UPDATE doctors
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await query(sql, values);
  return result.rows[0] || null;
};

// Delete doctor
export const deleteDoctor = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM doctors WHERE id = $1`;
  const result = await query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
};

// Get doctor statistics
export const getDoctorStats = async () => {
  const sql = `
    SELECT 
      COUNT(*) as total_doctors,
      COUNT(DISTINCT specialty) as specialties_count,
      COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as doctors_with_users
    FROM doctors
  `;

  const result = await query(sql);
  return result.rows[0];
};
