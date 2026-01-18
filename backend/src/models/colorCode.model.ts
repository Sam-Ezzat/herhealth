import { query } from '../config/database';

export interface ColorCode {
  id: string;
  color_name: string;
  color_hex: string;
  notes?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Get all color codes
export const findAllColorCodes = async (): Promise<ColorCode[]> => {
  const sql = `
    SELECT * FROM color_code 
    WHERE is_active = true 
    ORDER BY color_name
  `;
  const result = await query(sql);
  return result.rows;
};

// Get color code by ID
export const findColorCodeById = async (id: string): Promise<ColorCode | null> => {
  const sql = `SELECT * FROM color_code WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

// Create color code
export const createColorCode = async (colorData: Omit<ColorCode, 'id' | 'created_at' | 'updated_at'>): Promise<ColorCode> => {
  const { color_name, color_hex, notes, is_active } = colorData;
  
  const sql = `
    INSERT INTO color_code (color_name, color_hex, notes, is_active)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  
  const result = await query(sql, [color_name, color_hex, notes || null, is_active]);
  return result.rows[0];
};

// Update color code
export const updateColorCode = async (id: string, colorData: Partial<ColorCode>): Promise<ColorCode | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(colorData).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) return null;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const sql = `
    UPDATE color_code
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  values.push(id);

  const result = await query(sql, values);
  return result.rows[0] || null;
};

// Delete color code (soft delete)
export const deleteColorCode = async (id: string): Promise<boolean> => {
  const sql = `
    UPDATE color_code 
    SET is_active = false, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $1
    RETURNING id
  `;
  const result = await query(sql, [id]);
  return result.rowCount !== null && result.rowCount > 0;
};

// Get color code usage statistics
export const getColorCodeStats = async (id: string): Promise<any> => {
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM patients WHERE color_code_id = $1) as patient_count
  `;
  const result = await query(sql, [id]);
  return result.rows[0];
};
