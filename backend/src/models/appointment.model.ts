import { query } from '../config/database';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  calendar_id?: string;
  start_at: Date;
  end_at: Date;
  type: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no-show' | 'no-answer';
  reservation_type?: string;
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  patient_name?: string;
  doctor_name?: string;
  patient_phone?: string;
  created_by_name?: string;
  created_by_role?: string;
  calendar_color_code?: string;
  calendar_color_name?: string;
  calendar_name?: string;
}

export interface AppointmentFilters {
  patient_id?: string;
  doctor_id?: string;
  status?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Get all appointments with filters
export const findAllAppointments = async (
  filters: AppointmentFilters = {}
): Promise<Appointment[]> => {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (filters.patient_id) {
    conditions.push(`a.patient_id = $${paramIndex}`);
    values.push(filters.patient_id);
    paramIndex++;
  }

  if (filters.doctor_id) {
    conditions.push(`a.doctor_id = $${paramIndex}`);
    values.push(filters.doctor_id);
    paramIndex++;
  }

  if (filters.status) {
    conditions.push(`a.status = $${paramIndex}`);
    values.push(filters.status);
    paramIndex++;
  }

  if (filters.type) {
    conditions.push(`a.type ILIKE $${paramIndex}`);
    values.push(`%${filters.type}%`);
    paramIndex++;
  }

  if (filters.date_from) {
    conditions.push(`DATE(a.start_at) >= $${paramIndex}`);
    values.push(filters.date_from);
    paramIndex++;
  }

  if (filters.date_to) {
    conditions.push(`DATE(a.start_at) <= $${paramIndex}`);
    values.push(filters.date_to);
    paramIndex++;
  }

  if (filters.search) {
    conditions.push(`(
      CONCAT(p.first_name, ' ', p.last_name) ILIKE $${paramIndex} OR
      CONCAT(d.first_name, ' ', d.last_name) ILIKE $${paramIndex} OR
      a.notes ILIKE $${paramIndex} OR
      a.type ILIKE $${paramIndex} OR
      cc.color_name ILIKE $${paramIndex}
    )`);
    values.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      a.*,
      CONCAT(p.first_name, ' ', p.last_name) as patient_name,
      p.phone as patient_phone,
      cc.color_hex as patient_color_code,
      cc.color_name as patient_color_name,
      CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
      u.full_name as created_by_name,
      r.name as created_by_role,
      dc.color_code as calendar_color_code,
      dc.color_name as calendar_color_name,
      dc.name as calendar_name
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN color_code cc ON p.color_code_id = cc.id
    LEFT JOIN doctors d ON a.doctor_id = d.id
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN doctor_calendars dc ON a.calendar_id = dc.id
    ${whereClause}
    ORDER BY a.start_at DESC
  `;

  const result = await query(sql, values);
  return result.rows;
};

// Get appointment by ID
export const findAppointmentById = async (id: string): Promise<Appointment | null> => {
  const sql = `
    SELECT 
      a.*,
      CONCAT(p.first_name, ' ', p.last_name) as patient_name,
      p.phone as patient_phone,
      cc.color_hex as patient_color_code,
      cc.color_name as patient_color_name,
      CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
      u.full_name as created_by_name,
      r.name as created_by_role,
      dc.color_code as calendar_color_code,
      dc.color_name as calendar_color_name,
      dc.name as calendar_name
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN color_code cc ON p.color_code_id = cc.id
    LEFT JOIN doctors d ON a.doctor_id = d.id
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN doctor_calendars dc ON a.calendar_id = dc.id
    WHERE a.id = $1
  `;

  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

// Create new appointment
export const createAppointment = async (
  appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'patient_name' | 'doctor_name' | 'patient_phone' | 'created_by_name' | 'created_by_role'>
): Promise<Appointment> => {
  const {
    patient_id,
    doctor_id,
    calendar_id,
    start_at,
    end_at,
    type,
    status,
    reservation_type,
    notes,
    created_by,
  } = appointmentData;

  const sql = `
    INSERT INTO appointments (
      patient_id, doctor_id, calendar_id, start_at, end_at, type, status, reservation_type, notes, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const values = [
    patient_id,
    doctor_id,
    calendar_id || null,
    start_at,
    end_at,
    type,
    status || 'scheduled',
    reservation_type || 'Clinic',
    notes || null,
    created_by || null,
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

// Update appointment
export const updateAppointment = async (
  id: string,
  appointmentData: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'patient_name' | 'doctor_name' | 'patient_phone'>>
): Promise<Appointment | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(appointmentData).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'patient_name' && key !== 'doctor_name' && key !== 'patient_phone') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) {
    return findAppointmentById(id);
  }

  values.push(id);

  const sql = `
    UPDATE appointments
    SET ${fields.join(', ')}, updated_at = now()
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await query(sql, values);
  return result.rows[0] || null;
};

// Delete appointment
export const deleteAppointment = async (id: string): Promise<boolean> => {
  const sql = 'DELETE FROM appointments WHERE id = $1 RETURNING id';
  const result = await query(sql, [id]);
  return result.rows.length > 0;
};

// Get appointment statistics
export const getAppointmentStats = async (): Promise<any> => {
  const sql = `
    SELECT 
      COUNT(*) as total_appointments,
      COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
      COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
      COUNT(CASE WHEN status = 'no-show' THEN 1 END) as no_show,
      COUNT(CASE WHEN DATE(start_at) = CURRENT_DATE THEN 1 END) as today,
      COUNT(CASE WHEN start_at > now() THEN 1 END) as upcoming
    FROM appointments
  `;

  const result = await query(sql);
  
  // Get appointments by date for the last 7 days
  const byDateSql = `
    SELECT 
      DATE(start_at) as date,
      COUNT(*) as count
    FROM appointments
    WHERE start_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(start_at)
    ORDER BY date
  `;
  
  const byDateResult = await query(byDateSql);
  
  return {
    ...result.rows[0],
    by_date: byDateResult.rows
  };
};
