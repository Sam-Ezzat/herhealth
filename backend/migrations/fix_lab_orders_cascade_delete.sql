-- Migration: Fix foreign key constraints to cascade delete when visit is deleted
-- This prevents foreign key constraint errors when deleting visits
-- Affects: lab_orders, imaging, and prescriptions tables

-- Step 1: Fix lab_orders table
ALTER TABLE lab_orders 
DROP CONSTRAINT IF EXISTS lab_orders_visit_id_fkey;

ALTER TABLE lab_orders
ADD CONSTRAINT lab_orders_visit_id_fkey 
FOREIGN KEY (visit_id) 
REFERENCES visits(id) 
ON DELETE CASCADE;

-- Step 2: Fix imaging table
ALTER TABLE imaging 
DROP CONSTRAINT IF EXISTS imaging_visit_id_fkey;

ALTER TABLE imaging
ADD CONSTRAINT imaging_visit_id_fkey 
FOREIGN KEY (visit_id) 
REFERENCES visits(id) 
ON DELETE CASCADE;

-- Step 3: Fix prescriptions table
ALTER TABLE prescriptions 
DROP CONSTRAINT IF EXISTS prescriptions_visit_id_fkey;

ALTER TABLE prescriptions
ADD CONSTRAINT prescriptions_visit_id_fkey 
FOREIGN KEY (visit_id) 
REFERENCES visits(id) 
ON DELETE CASCADE;

-- Note: This will automatically cascade delete when a visit is deleted:
-- 1. lab_orders (and their lab_results)
-- 2. imaging records
-- 3. prescriptions (and their prescription_items)
