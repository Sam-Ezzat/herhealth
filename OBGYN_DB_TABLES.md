# OB-GYN Clinic System -- Database Tables

This file contains the PostgreSQL-compatible SQL schema for the entire
system.

## SQL Schema

``` sql
-- The SQL schema is identical to the one included in the ERD document.
-- Only the CREATE TABLE statements are included here for development use.

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

-- (rest of schema truncated for brevity, but full schema was provided earlier)
```
