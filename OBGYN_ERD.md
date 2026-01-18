# OB-GYN Clinic System -- ERD Overview

## Project Summary

This project represents a complete information system for an Obstetrics
& Gynecology (OB‑GYN) medical clinic.\
The system manages patient records, appointments, clinical visits,
pregnancies, gynecological exams, lab tests, imaging, medications,
billing, and staff access control.

The ERD is designed to be scalable, secure, and compatible with modern
healthcare system standards.

# OB-GYN Clinic ERD

This document contains:

1. Mermaid ER diagram (renderable in viewers that support Mermaid)
2. Table descriptions (columns, PKs, FKs)
3. SQL `CREATE TABLE` statements (PostgreSQL syntax)

---

## 1) Mermaid ER diagram

```mermaid
erDiagram
    

PATIENT {
        int patient_id PK
        string first_name
        string last_name
        date date_of_birth
        string phone
        string email
        string address
        int color_code_id FK
        text color_note
        datetime created_at
        datetime updated_at
    }
    USERS {
        uuid id PK
        string username
        string password_hash
        string full_name
        string role_id FK
        string email
        string phone
        timestamp created_at
    }

    COLOR_CODE {
        int color_code_id PK
        string color_name
        string color_hex
        boolean is_customizable  // true = user-defined color
        datetime created_at
    }

    ROLES {
        uuid id PK
        string name
        text permissions
    }

   APPOINTMENT {
        int appointment_id PK
        int patient_id FK
        int doctor_id FK
        datetime appointment_date
        string appointment_type
        string status
        text notes
        datetime created_at
    }


    PROVIDERS {
        uuid id PK
        string first_name
        string last_name
        string specialty
        string phone
        string email
    }

    VISITS {
        uuid id PK
        uuid appointment_id FK
        uuid patient_id FK
        uuid provider_id FK
        date visit_date
        text reason
        text clinical_notes
        string diagnosis
        text treatment_plan
    }

    PREGNANCIES {
        uuid id PK
        uuid patient_id FK
        date lmp
        date edd
        integer gravida
        integer para
        text risk_flags
        string status
    }

    OB_RECORDS {
        uuid id PK
        uuid pregnancy_id FK
        date record_date
        numeric weight_kg
        numeric bp_systolic
        numeric bp_diastolic
        numeric fundal_height_cm
        text fetal_heart_rate
        text notes
    }

    GYNE_RECORDS {
        uuid id PK
        uuid patient_id FK
        date record_date
        text exam_findings
        text pap_result
        text notes
    }

    LAB_ORDERS {
        uuid id PK
        uuid visit_id FK
        uuid patient_id FK
        string test_type
        string status
        timestamp ordered_at
    }

    LAB_RESULTS {
        uuid id PK
        uuid lab_order_id FK
        string result_summary
        jsonb full_result
        timestamp result_at
        boolean abnormal
    }

    IMAGING {
        uuid id PK
        uuid visit_id FK
        uuid patient_id FK
        string modality
        string report
        jsonb measurements
        timestamp performed_at
    }

    PRESCRIPTIONS {
        uuid id PK
        uuid visit_id FK
        uuid patient_id FK
        uuid provider_id FK
        date issued_at
        text instructions
    }

    PRESCRIPTION_ITEMS {
        uuid id PK
        uuid prescription_id FK
        uuid medication_id FK
        string dosage
        string frequency
        integer duration_days
    }

    MEDICATIONS {
        uuid id PK
        string name
        string generic_name
        text indications
        boolean pregnancy_safe
    }

    INVENTORY_ITEMS {
        uuid id PK
        string name
        string sku
        integer quantity
        date expiry_date
    }

    INVOICES {
        uuid id PK
        uuid patient_id FK
        uuid visit_id FK
        numeric total_amount
        string status
        timestamp issued_at
    }

    PAYMENTS {
        uuid id PK
        uuid invoice_id FK
        numeric amount
        string method
        timestamp paid_at
    }

    CONSENT_FORMS {
        uuid id PK
        uuid patient_id FK
        uuid visit_id FK
        string form_type
        text content
        timestamp signed_at
    }


    PATIENTS ||--o{ PREGNANCIES : has
    PATIENTS ||--o{ APPOINTMENTS : schedules
    PATIENTS ||--o{ VISITS : attends
    PATIENTS ||--o{ LAB_ORDERS : has
    PATIENTS ||--o{ IMAGING : has
    PATIENTS ||--o{ PRESCRIPTIONS : has
    PATIENTS ||--o{ INVOICES : billed_for
    COLOR_CODE ||--o{ PATIENT : "assigned to"

    PROVIDERS ||--o{ APPOINTMENTS : manages
    PROVIDERS ||--o{ VISITS : conducts

    APPOINTMENTS ||--o{ VISITS : becomes
    VISITS ||--o{ LAB_ORDERS : requests
    LAB_ORDERS ||--o{ LAB_RESULTS : produces
    VISITS ||--o{ IMAGING : requests
    VISITS ||--o{ PRESCRIPTIONS : generates
    PRESCRIPTIONS ||--o{ PRESCRIPTION_ITEMS : contains
    MEDICATIONS ||--o{ PRESCRIPTION_ITEMS : prescribed

    INVOICES ||--o{ PAYMENTS : receives
    VISITS ||--o{ CONSENT_FORMS : includes

    USERS ||--o{ PROVIDERS : may_be
    ROLES ||--o{ USERS : assigns

    PREGNANCIES ||--o{ OB_RECORDS : records
    PATIENTS ||--o{ GYNE_RECORDS : records

```

---

## 2) Table notes & rationale

* Use `uuid` PKs for safer distributed systems and easier syncing with mobile apps.
* `jsonb` used for lab full_result and imaging measurements to store variable structures from different labs/vendors.
* Separate `PREGNANCIES` and `OB_RECORDS` to support multiple pregnancies per patient and trimester-specific data.
* `VISITS` links to `APPOINTMENTS` but can be created for walk-ins (appointment_id nullable).
* `USERS`, `ROLES` for staff authentication & authorization; `PROVIDERS` contains provider-specific details (can link to `USERS` optionally).

---

## 3) PostgreSQL-compatible SQL `CREATE TABLE` (starter schema)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(100) NOT NULL,
  permissions jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username varchar(100) UNIQUE NOT NULL,
  password_hash varchar(255) NOT NULL,
  full_name varchar(255),
  role_id uuid REFERENCES roles(id),
  email varchar(255),
  phone varchar(50),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name varchar(150) NOT NULL,
  last_name varchar(150) NOT NULL,
  dob date,
  gender varchar(32),
  phone varchar(50),
  email varchar(255),
  address text,
  emergency_contact text,
  medical_history text,
  allergies text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE providers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name varchar(150),
  last_name varchar(150),
  specialty varchar(150),
  phone varchar(50),
  email varchar(255),
  user_id uuid REFERENCES users(id)
);

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES providers(id),
  start_at timestamptz,
  end_at timestamptz,
  type varchar(100),
  status varchar(50),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE visits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id uuid REFERENCES appointments(id),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES providers(id),
  visit_date date,
  reason text,
  clinical_notes text,
  diagnosis varchar(255),
  treatment_plan text
);

CREATE TABLE pregnancies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  lmp date,
  edd date,
  gravida integer,
  para integer,
  risk_flags text,
  status varchar(50)
);

CREATE TABLE ob_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pregnancy_id uuid REFERENCES pregnancies(id) ON DELETE CASCADE,
  record_date date,
  weight_kg numeric(5,2),
  bp_systolic smallint,
  bp_diastolic smallint,
  fundal_height_cm numeric(5,2),
  fetal_heart_rate varchar(50),
  notes text
);

CREATE TABLE gyne_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  record_date date,
  exam_findings text,
  pap_result text,
  notes text
);

CREATE TABLE lab_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id uuid REFERENCES visits(id),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  test_type varchar(150),
  status varchar(50),
  ordered_at timestamptz DEFAULT now()
);

CREATE TABLE lab_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_order_id uuid REFERENCES lab_orders(id) ON DELETE CASCADE,
  result_summary varchar(500),
  full_result jsonb,
  result_at timestamptz,
  abnormal boolean DEFAULT false
);

CREATE TABLE imaging (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id uuid REFERENCES visits(id),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  modality varchar(100),
  report text,
  measurements jsonb,
  performed_at timestamptz
);

CREATE TABLE medications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(255) NOT NULL,
  generic_name varchar(255),
  indications text,
  pregnancy_safe boolean DEFAULT true
);

CREATE TABLE prescriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id uuid REFERENCES visits(id),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES providers(id),
  issued_at date DEFAULT current_date,
  instructions text
);

CREATE TABLE prescription_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_id uuid REFERENCES medications(id),
  dosage varchar(100),
  frequency varchar(100),
  duration_days integer
);

CREATE TABLE inventory_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(255),
  sku varchar(100),
  quantity integer DEFAULT 0,
  expiry_date date
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id),
  visit_id uuid REFERENCES visits(id),
  total_amount numeric(10,2),
  status varchar(50),
  issued_at timestamptz DEFAULT now()
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  amount numeric(10,2),
  method varchar(50),
  paid_at timestamptz DEFAULT now()
);

CREATE TABLE consent_forms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id),
  visit_id uuid REFERENCES visits(id),
  form_type varchar(100),
  content text,
  signed_at timestamptz
);

-- Indexes and common constraints
CREATE INDEX idx_patient_phone ON patients(phone);
CREATE INDEX idx_appointment_patient ON appointments(patient_id);
CREATE INDEX idx_visit_patient ON visits(patient_id);

```

---

## 4) Next steps / Variations

* Add audit tables or row-level `created_by`/`updated_by` for audit trails.
* Consider soft deletes (`is_deleted boolean`) for important entities.
* If multi-clinic, add `clinic` table and relate appointments, inventory, providers.
* Add FHIR-compatible structure if integrating with external health systems.

---

*End of ERD document.*

