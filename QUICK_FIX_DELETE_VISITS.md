# Quick Fix: Delete all lab/imaging/prescription records to allow visit deletion

## Option 1: Run PowerShell Script (Recommended)

```powershell
.\cleanup-unused-tables.ps1
```

This will:
1. Show you how many records exist
2. Ask for confirmation
3. Delete all records from lab_orders, imaging, and prescriptions
4. Show you the results

## Option 2: Run SQL Directly

If you prefer to run SQL commands directly, use these commands:

### Using psql:
```powershell
# Load your DATABASE_URL from .env first
$env:DATABASE_URL = "your_database_url_here"

# Run the cleanup
psql $env:DATABASE_URL -c "DELETE FROM lab_results; DELETE FROM prescription_items; DELETE FROM lab_orders; DELETE FROM imaging; DELETE FROM prescriptions;"
```

### Using Node.js connection:
```sql
DELETE FROM lab_results;
DELETE FROM prescription_items;
DELETE FROM lab_orders;
DELETE FROM imaging;
DELETE FROM prescriptions;
```

## Option 3: Quick One-Liner

From the project root:

```powershell
cd backend
$sql = Get-Content ..\cleanup-lab-imaging-prescriptions.sql -Raw
$sql | psql $env:DATABASE_URL
```

## After Cleanup

Once the records are deleted, you'll be able to delete visits without any errors.

## Future Prevention

If you don't plan to use these features, you can optionally drop the foreign key constraints:

```sql
ALTER TABLE lab_orders DROP CONSTRAINT IF EXISTS lab_orders_visit_id_fkey;
ALTER TABLE imaging DROP CONSTRAINT IF EXISTS imaging_visit_id_fkey;
ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_visit_id_fkey;
```

This way even if records are accidentally created in the future, they won't block visit deletion.
