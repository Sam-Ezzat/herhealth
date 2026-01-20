import { query } from '../config/database';

export type PaymentMethod = 'Cash' | 'Instapay' | 'No Payment' | 'ReConsultation';

export interface VisitPayment {
  id: string;
  visit_id: string;
  patient_id: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  payment_date: Date;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  patient_name?: string;
  visit_date?: Date;
  created_by_name?: string;
}

export interface CreateVisitPaymentData {
  visit_id: string;
  patient_id: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  payment_date?: Date;
  created_by?: string;
}

export interface UpdateVisitPaymentData {
  amount?: number;
  method?: PaymentMethod;
  notes?: string;
  payment_date?: Date;
}

// Get payment by visit ID
export const findPaymentByVisitId = async (visitId: string): Promise<VisitPayment | null> => {
  const sql = `
    SELECT 
      vp.*,
      CONCAT(p.first_name, ' ', p.last_name) as patient_name,
      v.visit_date,
      CONCAT(u.full_name) as created_by_name
    FROM visit_payments vp
    LEFT JOIN patients p ON vp.patient_id = p.id
    LEFT JOIN visits v ON vp.visit_id = v.id
    LEFT JOIN users u ON vp.created_by = u.id
    WHERE vp.visit_id = $1
  `;
  
  const result = await query(sql, [visitId]);
  return result.rows[0] || null;
};

// Get payment by ID
export const findPaymentById = async (paymentId: string): Promise<VisitPayment | null> => {
  const sql = `
    SELECT 
      vp.*,
      CONCAT(p.first_name, ' ', p.last_name) as patient_name,
      v.visit_date,
      CONCAT(u.full_name) as created_by_name
    FROM visit_payments vp
    LEFT JOIN patients p ON vp.patient_id = p.id
    LEFT JOIN visits v ON vp.visit_id = v.id
    LEFT JOIN users u ON vp.created_by = u.id
    WHERE vp.id = $1
  `;
  
  const result = await query(sql, [paymentId]);
  return result.rows[0] || null;
};

// Get all payments for a patient
export const findPaymentsByPatientId = async (patientId: string): Promise<VisitPayment[]> => {
  const sql = `
    SELECT 
      vp.*,
      CONCAT(p.first_name, ' ', p.last_name) as patient_name,
      v.visit_date,
      CONCAT(u.full_name) as created_by_name
    FROM visit_payments vp
    LEFT JOIN patients p ON vp.patient_id = p.id
    LEFT JOIN visits v ON vp.visit_id = v.id
    LEFT JOIN users u ON vp.created_by = u.id
    WHERE vp.patient_id = $1
    ORDER BY vp.payment_date DESC
  `;
  
  const result = await query(sql, [patientId]);
  return result.rows;
};

// Get unpaid visits for a patient
export const findUnpaidVisitsByPatientId = async (patientId: string) => {
  const sql = `
    SELECT 
      v.id,
      v.visit_date,
      v.reason,
      v.diagnosis,
      CONCAT(d.first_name, ' ', d.last_name) as doctor_name
    FROM visits v
    LEFT JOIN visit_payments vp ON v.id = vp.visit_id
    LEFT JOIN doctors d ON v.doctor_id = d.id
    WHERE v.patient_id = $1 
      AND vp.id IS NULL
    ORDER BY v.visit_date DESC
  `;
  
  const result = await query(sql, [patientId]);
  return result.rows;
};

// Create new payment
export const createPayment = async (paymentData: CreateVisitPaymentData): Promise<VisitPayment> => {
  const { visit_id, patient_id, amount, method, notes, payment_date, created_by } = paymentData;
  
  const sql = `
    INSERT INTO visit_payments (
      visit_id, patient_id, amount, method, notes, payment_date, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const result = await query(sql, [
    visit_id,
    patient_id,
    amount,
    method,
    notes || null,
    payment_date || new Date(),
    created_by || null
  ]);
  
  return result.rows[0];
};

// Update payment
export const updatePayment = async (
  paymentId: string,
  paymentData: UpdateVisitPaymentData
): Promise<VisitPayment> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (paymentData.amount !== undefined) {
    fields.push(`amount = $${paramIndex}`);
    values.push(paymentData.amount);
    paramIndex++;
  }
  
  if (paymentData.method) {
    fields.push(`method = $${paramIndex}`);
    values.push(paymentData.method);
    paramIndex++;
  }
  
  if (paymentData.notes !== undefined) {
    fields.push(`notes = $${paramIndex}`);
    values.push(paymentData.notes);
    paramIndex++;
  }
  
  if (paymentData.payment_date) {
    fields.push(`payment_date = $${paramIndex}`);
    values.push(paymentData.payment_date);
    paramIndex++;
  }
  
  fields.push(`updated_at = now()`);
  values.push(paymentId);
  
  const sql = `
    UPDATE visit_payments
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  
  const result = await query(sql, values);
  return result.rows[0];
};

// Delete payment
export const deletePayment = async (paymentId: string): Promise<void> => {
  await query('DELETE FROM visit_payments WHERE id = $1', [paymentId]);
};

// Get payment statistics for a patient
export const getPatientPaymentStats = async (patientId: string) => {
  const sql = `
    SELECT 
      COUNT(*) as total_payments,
      SUM(CASE WHEN method = 'Cash' THEN 1 ELSE 0 END) as cash_count,
      SUM(CASE WHEN method = 'Instapay' THEN 1 ELSE 0 END) as instapay_count,
      SUM(CASE WHEN method = 'No Payment' THEN 1 ELSE 0 END) as no_payment_count,
      SUM(CASE WHEN method = 'ReConsultation' THEN 1 ELSE 0 END) as reconsultation_count,
      SUM(amount) as total_amount,
      AVG(amount) as average_amount
    FROM visit_payments
    WHERE patient_id = $1
  `;
  
  const result = await query(sql, [patientId]);
  return result.rows[0];
};

// Get today's payment statistics
export const getTodayPaymentStats = async () => {
  const sql = `
    SELECT 
      COUNT(*) as payment_count,
      SUM(CASE WHEN method = 'Cash' THEN 1 ELSE 0 END) as cash_count,
      SUM(CASE WHEN method = 'Instapay' THEN 1 ELSE 0 END) as instapay_count,
      SUM(CASE WHEN method = 'No Payment' THEN 1 ELSE 0 END) as no_payment_count,
      SUM(CASE WHEN method = 'ReConsultation' THEN 1 ELSE 0 END) as reconsultation_count,
      COALESCE(SUM(amount), 0) as total_amount,
      COALESCE(SUM(CASE WHEN method = 'Cash' THEN amount ELSE 0 END), 0) as cash_total,
      COALESCE(SUM(CASE WHEN method = 'Instapay' THEN amount ELSE 0 END), 0) as instapay_total
    FROM visit_payments
    WHERE DATE(payment_date) = CURRENT_DATE
  `;
  
  const result = await query(sql, []);
  return result.rows[0];
};
