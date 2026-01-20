# Visit Delete Issue - Foreign Key Constraints

## Problem

When attempting to delete visits, you encounter foreign key constraint violation errors:

```
ERROR: update or delete on table "visits" violates foreign key constraint "lab_orders_visit_id_fkey" on table "lab_orders"
ERROR: update or delete on table "visits" violates foreign key constraint "imaging_visit_id_fkey" on table "imaging"
ERROR: update or delete on table "visits" violates foreign key constraint "prescriptions_visit_id_fkey" on table "prescriptions"
```

## Root Cause

Three tables have foreign key references to `visits(id)` **without CASCADE DELETE constraints**:

1. **lab_orders** - Laboratory test orders
2. **imaging** - Imaging/radiology records
3. **prescriptions** - Medication prescriptions

Original schema (problematic):

```sql
CREATE TABLE lab_orders (
  visit_id uuid REFERENCES visits(id),  -- Missing ON DELETE CASCADE
  ...
);

CREATE TABLE imaging (
  visit_id uuid REFERENCES visits(id),  -- Missing ON DELETE CASCADE
  ...
);

CREATE TABLE prescriptions (
  visit_id uuid REFERENCES visits(id),  -- Missing ON DELETE CASCADE
  ...
);
```

When you try to delete a visit that has associated lab orders, imaging, or prescriptions, PostgreSQL prevents the deletion to maintain referential integrity.

## Solution

### Option 1: Apply Database Migration (Recommended)

Run the migration to add CASCADE DELETE to the foreign key:

```powershell
# Run this from the project root
.\fix-lab-orders-cascade.ps1
```

This migration will:
1. Drop the existing foreign key constraints on all three tables
2. Add new constraints with `ON DELETE CASCADE`
3. Automatically delete related records when a visit is deleted

### Option 2: Manual SQL Fix

If you prefer to run the SQL manually:

```sql
-- Fix lab_orders
ALTER TABLE lab_orders 
DROP CONSTRAINT IF EXISTS lab_orders_visit_id_fkey;
ALTER TABLE lab_orders
ADD CONSTRAINT lab_orders_visit_id_fkey 
FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE;

-- Fix imaging
ALTER TABLE imaging 
DROP CONSTRAINT IF EXISTS imaging_visit_id_fkey;
ALTER TABLE imaging
ADD CONSTRAINT imaging_visit_id_fkey 
FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE;

-- Fix prescriptions
ALTER TABLE prescriptions 
DROP CONSTRAINT IF EXISTS prescriptions_visit_id_fkey;
ALTER TABLE prescriptions
ADD CONSTRAINT prescriptions_visit_id_fkey 
FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE;
```

### What Gets Deleted

When you delete a visit, the cascade will delete:

1. **All lab_orders** associated with that visit
   - Which CASCADE deletes all **lab_results** for those orders
2. **All imaging** records associated with that visit
3. **All prescriptions** associated with that visit
   - Which CASCADE deletes all **prescription_items** for those prescriptions

**Cascade Chain:**
```
visits (deleted)
  ├─> lab_orders (CASCADE deleted)
  │    └─> lab_results (CASCADE deleted)
  ├─> imaging (CASCADE deleted)
  └─> prescriptions (CASCADE deleted)
       └─> prescription_items (CASCADE deleted)
```

## Code Updates

The delete method in [visit.model.ts](backend/src/models/visit.model.ts) has been updated with:

1. **Pre-check**: Counts related lab_orders before deletion
2. **Better error handling**: Catches foreign key constraint errors
3. **Logging**: Logs when related records are cascade deleted

## Testing

After applying the migration, test the delete functionality:

1. Create a test visit
2. Create lab orders, imaging, and prescriptions for that visit
3. Delete the visit
4. Verify all related records were automatically deleted

## Related Tables

Status of tables with references to `visits`:

- ✅ **lab_orders** - Fixed by this migration
- ✅ **imaging** - Fixed by this migration
- ✅ **prescriptions** - Fixed by this migration
- ✅ **pregnancies** - Already has proper cascade
- ✅ **ob_records** - Uses `ON DELETE SET NULL` (keeps record, nullifies visit_id)
- ✅ **appointments** - Separate entity, visits can reference appointments but not vice versa

## Prevention

For future tables with foreign keys to `visits`, always specify the delete behavior:

```sql
-- Good
visit_id uuid REFERENCES visits(id) ON DELETE CASCADE

-- Or if you want to keep the record but nullify the reference
visit_id uuid REFERENCES visits(id) ON DELETE SET NULL

-- Bad (restrictive, causes errors)
visit_id uuid REFERENCES visits(id)
```

## Files Changed

1. [backend/migrations/fix_lab_orders_cascade_delete.sql](backend/migrations/fix_lab_orders_cascade_delete.sql) - Migration SQL
2. [fix-lab-orders-cascade.ps1](fix-lab-orders-cascade.ps1) - PowerShell script to run migration
3. [backend/src/models/visit.model.ts](backend/src/models/visit.model.ts) - Updated delete method with better error handling
4. [FIX_VISIT_DELETE_LAB_ORDERS.md](FIX_VISIT_DELETE_LAB_ORDERS.md) - This documentation
