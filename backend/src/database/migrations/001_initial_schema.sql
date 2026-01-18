-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create roles table
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(100) NOT NULL UNIQUE,
  permissions jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username varchar(100) UNIQUE NOT NULL,
  password_hash varchar(255) NOT NULL,
  full_name varchar(255),
  role_id uuid REFERENCES roles(id),
  email varchar(255),
  phone varchar(50),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create color_code table
CREATE TABLE color_code (
  id serial PRIMARY KEY,
  color_name varchar(50) NOT NULL,
  color_hex varchar(7) NOT NULL,
  is_customizable boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create patients table
CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name varchar(150) NOT NULL,
  last_name varchar(150) NOT NULL,
  date_of_birth date,
  gender varchar(32) DEFAULT 'Female' CHECK (gender = 'Female'),
  phone varchar(50),
  email varchar(255),
  address text,
  emergency_contact_name varchar(255),
  emergency_contact_phone varchar(50),
  blood_type varchar(10),
  allergies text,
  chronic_conditions text,
  current_medications text,
  insurance_provider varchar(255),
  insurance_number varchar(100),
  color_code_id integer REFERENCES color_code(id),
  color_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create doctors table
CREATE TABLE doctors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name varchar(150),
  last_name varchar(150),
  specialty varchar(150),
  phone varchar(50),
  email varchar(255),
  user_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create appointments table
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id),
  start_at timestamptz,
  end_at timestamptz,
  type varchar(100),
  status varchar(50) DEFAULT 'scheduled',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create visits table
CREATE TABLE visits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id uuid REFERENCES appointments(id),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id),
  visit_date date,
  reason text,
  clinical_notes text,
  diagnosis varchar(255),
  treatment_plan text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pregnancies table
CREATE TABLE pregnancies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  lmp date,
  edd date,
  gravida integer,
  para integer,
  risk_flags text,
  status varchar(50) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ob_records table
CREATE TABLE ob_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pregnancy_id uuid REFERENCES pregnancies(id) ON DELETE CASCADE,
  record_date date,
  weight_kg numeric(5,2),
  bp_systolic smallint,
  bp_diastolic smallint,
  fundal_height_cm numeric(5,2),
  fetal_heart_rate varchar(50),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create gyne_records table
CREATE TABLE gyne_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  record_date date,
  exam_findings text,
  pap_result text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create lab_orders table
CREATE TABLE lab_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id uuid REFERENCES visits(id),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  test_type varchar(150),
  status varchar(50) DEFAULT 'pending',
  ordered_at timestamptz DEFAULT now()
);

-- Create lab_results table
CREATE TABLE lab_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_order_id uuid REFERENCES lab_orders(id) ON DELETE CASCADE,
  result_summary varchar(500),
  full_result jsonb,
  result_at timestamptz,
  abnormal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create imaging table
CREATE TABLE imaging (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id uuid REFERENCES visits(id),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  modality varchar(100),
  report text,
  measurements jsonb,
  performed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create medications table
CREATE TABLE medications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(255) NOT NULL,
  generic_name varchar(255),
  indications text,
  pregnancy_safe boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create prescriptions table
CREATE TABLE prescriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id uuid REFERENCES visits(id),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id),
  issued_at date DEFAULT current_date,
  instructions text,
  created_at timestamptz DEFAULT now()
);

-- Create prescription_items table
CREATE TABLE prescription_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_id uuid REFERENCES medications(id),
  dosage varchar(100),
  frequency varchar(100),
  duration_days integer,
  created_at timestamptz DEFAULT now()
);

-- Create inventory_items table
CREATE TABLE inventory_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(255),
  sku varchar(100),
  quantity integer DEFAULT 0,
  expiry_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id),
  visit_id uuid REFERENCES visits(id),
  total_amount numeric(10,2),
  status varchar(50) DEFAULT 'pending',
  issued_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  amount numeric(10,2),
  method varchar(50),
  paid_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create consent_forms table
CREATE TABLE consent_forms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id),
  visit_id uuid REFERENCES visits(id),
  form_type varchar(100),
  content text,
  signed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_patient_phone ON patients(phone);
CREATE INDEX idx_patient_email ON patients(email);
CREATE INDEX idx_appointment_patient ON appointments(patient_id);
CREATE INDEX idx_appointment_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointment_date ON appointments(start_at);
CREATE INDEX idx_visit_patient ON visits(patient_id);
CREATE INDEX idx_visit_date ON visits(visit_date);
CREATE INDEX idx_pregnancy_patient ON pregnancies(patient_id);
CREATE INDEX idx_lab_order_patient ON lab_orders(patient_id);
CREATE INDEX idx_invoice_patient ON invoices(patient_id);

-- Insert default color codes
INSERT INTO color_code (color_name, color_hex, is_customizable) VALUES
  ('Red', '#FF0000', false),
  ('Yellow', '#FFFF00', false),
  ('Green', '#00FF00', false),
  ('Blue', '#0000FF', false),
  ('Orange', '#FFA500', false),
  ('Purple', '#800080', false);

-- Insert default roles
INSERT INTO roles (name, permissions) VALUES
  ('admin', '{"all": true}'::jsonb),
  ('doctor', '{"patients": true, "appointments": true, "visits": true, "prescriptions": true, "lab_orders": true}'::jsonb),
  ('nurse', '{"patients": true, "appointments": true, "visits": true}'::jsonb),
  ('receptionist', '{"patients": true, "appointments": true}'::jsonb);
