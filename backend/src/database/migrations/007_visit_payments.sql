-- Create visit_payments table
CREATE TABLE visit_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  method varchar(50) NOT NULL CHECK (method IN ('Cash', 'Instapay', 'No Payment', 'ReConsultation')),
  notes text,
  payment_date timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(visit_id) -- One payment per visit
);

-- Create indexes for visit_payments
CREATE INDEX idx_visit_payment_visit ON visit_payments(visit_id);
CREATE INDEX idx_visit_payment_patient ON visit_payments(patient_id);
CREATE INDEX idx_visit_payment_date ON visit_payments(payment_date);
CREATE INDEX idx_visit_payment_method ON visit_payments(method);

-- Add comment to table
COMMENT ON TABLE visit_payments IS 'Payment records directly linked to visits';
COMMENT ON COLUMN visit_payments.method IS 'Payment method: Cash, Instapay, No Payment, or ReConsultation';
COMMENT ON COLUMN visit_payments.amount IS 'Payment amount in decimal format';
COMMENT ON COLUMN visit_payments.created_by IS 'User who created the payment record';
