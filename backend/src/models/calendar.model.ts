import { query } from '../config/database';

// Interfaces
export interface DoctorCalendar {
  id: string;
  doctor_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  timezone: string;
  color_code?: string; // Hex color code (e.g., #FF5733)
  color_name?: string; // Display name for color (e.g., Red, Blue)
  notes?: string; // Additional notes for the calendar
  created_at: Date;
  updated_at: Date;
}

export interface DoctorWorkingHours {
  id: string;
  calendar_id: string;
  day_of_week: number; // 0-6, 0=Sunday
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_closed?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DoctorTimeSlot {
  id: string;
  calendar_id: string;
  slot_duration: number; // minutes
  break_duration: number; // minutes
  max_appointments_per_slot: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CalendarException {
  id: string;
  calendar_id: string;
  exception_type: 'holiday' | 'vacation' | 'emergency' | 'block';
  start_datetime: Date;
  end_datetime: Date;
  reason?: string;
  cancel_appointments: boolean;
  notify_patients: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

// Doctor Calendar CRUD
export const findAllCalendars = async (): Promise<DoctorCalendar[]> => {
  const sql = `
    SELECT dc.*, CONCAT(d.first_name, ' ', d.last_name) as doctor_name
    FROM doctor_calendars dc
    JOIN doctors d ON dc.doctor_id = d.id
    WHERE dc.is_active = true
    ORDER BY d.first_name, d.last_name
  `;
  const result = await query(sql);
  return result.rows;
};

export const findCalendarByDoctorId = async (doctorId: string): Promise<DoctorCalendar | null> => {
  const sql = `SELECT * FROM doctor_calendars WHERE doctor_id = $1 AND is_active = true`;
  const result = await query(sql, [doctorId]);
  return result.rows[0] || null;
};

export const findCalendarsByDoctorId = async (doctorId: string): Promise<DoctorCalendar[]> => {
  const sql = `SELECT * FROM doctor_calendars WHERE doctor_id = $1 AND is_active = true ORDER BY name`;
  const result = await query(sql, [doctorId]);
  return result.rows;
};

export const findCalendarById = async (calendarId: string): Promise<DoctorCalendar | null> => {
  const sql = `SELECT * FROM doctor_calendars WHERE id = $1`;
  const result = await query(sql, [calendarId]);
  return result.rows[0] || null;
};

export const createDoctorCalendar = async (calendarData: Omit<DoctorCalendar, 'id' | 'created_at' | 'updated_at'>): Promise<DoctorCalendar> => {
  const { doctor_id, name, description, is_active, timezone, color_code, color_name, notes } = calendarData;
  
  const sql = `
    INSERT INTO doctor_calendars (doctor_id, name, description, is_active, timezone, color_code, color_name, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const result = await query(sql, [
    doctor_id, 
    name, 
    description || null, 
    is_active, 
    timezone,
    color_code || '#3B82F6',
    color_name || null,
    notes || null
  ]);
  return result.rows[0];
};

export const updateDoctorCalendar = async (id: string, calendarData: Partial<DoctorCalendar>): Promise<DoctorCalendar | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(calendarData).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'doctor_id') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) return null;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const sql = `
    UPDATE doctor_calendars
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  values.push(id);

  const result = await query(sql, values);
  return result.rows[0] || null;
};

// Working Hours CRUD
export const findWorkingHoursByCalendarId = async (calendarId: string): Promise<DoctorWorkingHours[]> => {
  const sql = `SELECT * FROM doctor_working_hours WHERE calendar_id = $1 ORDER BY day_of_week, start_time`;
  const result = await query(sql, [calendarId]);
  return result.rows;
};

export const createWorkingHours = async (hoursData: Omit<DoctorWorkingHours, 'id' | 'created_at' | 'updated_at'>): Promise<DoctorWorkingHours> => {
  const { calendar_id, day_of_week, start_time, end_time, is_active, is_closed } = hoursData;
  
  const sql = `
    INSERT INTO doctor_working_hours (calendar_id, day_of_week, start_time, end_time, is_active, is_closed)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  
  const result = await query(sql, [calendar_id, day_of_week, start_time, end_time, is_active, is_closed || false]);
  return result.rows[0];
};

export const updateWorkingHours = async (id: string, hoursData: Partial<DoctorWorkingHours>): Promise<DoctorWorkingHours | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(hoursData).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'calendar_id') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) return null;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const sql = `
    UPDATE doctor_working_hours
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  values.push(id);

  const result = await query(sql, values);
  return result.rows[0] || null;
};

export const deleteWorkingHours = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM doctor_working_hours WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rowCount !== null && result.rowCount > 0;
};

// Time Slots CRUD
export const findTimeSlotsByCalendarId = async (calendarId: string): Promise<DoctorTimeSlot[]> => {
  const sql = `SELECT * FROM doctor_time_slots WHERE calendar_id = $1 AND is_active = true`;
  const result = await query(sql, [calendarId]);
  return result.rows;
};

export const createTimeSlot = async (slotData: Omit<DoctorTimeSlot, 'id' | 'created_at' | 'updated_at'>): Promise<DoctorTimeSlot> => {
  const { calendar_id, slot_duration, break_duration, max_appointments_per_slot, is_active } = slotData;
  
  const sql = `
    INSERT INTO doctor_time_slots (calendar_id, slot_duration, break_duration, max_appointments_per_slot, is_active)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const result = await query(sql, [calendar_id, slot_duration, break_duration, max_appointments_per_slot, is_active]);
  return result.rows[0];
};

export const updateTimeSlot = async (id: string, slotData: Partial<DoctorTimeSlot>): Promise<DoctorTimeSlot | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(slotData).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'calendar_id') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) return null;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const sql = `
    UPDATE doctor_time_slots
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  values.push(id);

  const result = await query(sql, values);
  return result.rows[0] || null;
};

// Calendar Exceptions CRUD
export const findExceptionsByCalendarId = async (calendarId: string, startDate?: Date, endDate?: Date): Promise<CalendarException[]> => {
  let sql = `SELECT * FROM calendar_exceptions WHERE calendar_id = $1`;
  const params: any[] = [calendarId];

  if (startDate && endDate) {
    sql += ` AND (start_datetime <= $3 AND end_datetime >= $2)`;
    params.push(startDate, endDate);
  }

  sql += ` ORDER BY start_datetime`;

  const result = await query(sql, params);
  return result.rows;
};

export const createException = async (exceptionData: Omit<CalendarException, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarException> => {
  const { calendar_id, exception_type, start_datetime, end_datetime, reason, cancel_appointments, notify_patients, created_by } = exceptionData;
  
  const sql = `
    INSERT INTO calendar_exceptions (
      calendar_id, exception_type, start_datetime, end_datetime, reason, 
      cancel_appointments, notify_patients, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const result = await query(sql, [
    calendar_id, exception_type, start_datetime, end_datetime, 
    reason || null, cancel_appointments, notify_patients, created_by
  ]);
  
  return result.rows[0];
};

export const updateException = async (id: string, exceptionData: Partial<CalendarException>): Promise<CalendarException | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(exceptionData).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'calendar_id' && key !== 'created_by') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) return null;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const sql = `
    UPDATE calendar_exceptions
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  values.push(id);

  const result = await query(sql, values);
  return result.rows[0] || null;
};

export const deleteException = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM calendar_exceptions WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rowCount !== null && result.rowCount > 0;
};

// Get appointments affected by exception
export const findAffectedAppointments = async (calendarId: string, startDatetime: Date, endDatetime: Date): Promise<any[]> => {
  const sql = `
    SELECT a.* 
    FROM appointments a
    JOIN doctor_calendars dc ON a.doctor_id = dc.doctor_id
    WHERE dc.id = $1
    AND a.start_at >= $2
    AND a.end_at <= $3
    AND a.status IN ('scheduled', 'confirmed')
    ORDER BY a.start_at
  `;
  
  const result = await query(sql, [calendarId, startDatetime, endDatetime]);
  return result.rows;
};
