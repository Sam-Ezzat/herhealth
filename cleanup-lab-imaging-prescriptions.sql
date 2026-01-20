-- Cleanup script: Delete all lab orders, imaging, and prescription records
-- This allows you to delete visits without foreign key constraint errors

-- Show counts before deletion
SELECT 
  (SELECT COUNT(*) FROM lab_results) as lab_results_count,
  (SELECT COUNT(*) FROM lab_orders) as lab_orders_count,
  (SELECT COUNT(*) FROM imaging) as imaging_count,
  (SELECT COUNT(*) FROM prescription_items) as prescription_items_count,
  (SELECT COUNT(*) FROM prescriptions) as prescriptions_count;

-- Delete all records (in correct order to respect foreign keys)
-- Step 1: Delete child records first
DELETE FROM lab_results;
DELETE FROM prescription_items;

-- Step 2: Delete parent records
DELETE FROM lab_orders;
DELETE FROM imaging;
DELETE FROM prescriptions;

-- Show confirmation
SELECT 
  (SELECT COUNT(*) FROM lab_results) as lab_results_remaining,
  (SELECT COUNT(*) FROM lab_orders) as lab_orders_remaining,
  (SELECT COUNT(*) FROM imaging) as imaging_remaining,
  (SELECT COUNT(*) FROM prescription_items) as prescription_items_remaining,
  (SELECT COUNT(*) FROM prescriptions) as prescriptions_remaining;

-- Optional: Drop the foreign key constraints if you never plan to use these tables
-- Uncomment these lines if you want to completely remove the constraints:

-- ALTER TABLE lab_orders DROP CONSTRAINT IF EXISTS lab_orders_visit_id_fkey;
-- ALTER TABLE imaging DROP CONSTRAINT IF EXISTS imaging_visit_id_fkey;
-- ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_visit_id_fkey;
