# 🚨 URGENT: Fix Visit Delete Issue

## Quick Summary

**Problem:** Can't delete visits because of foreign key constraints with `lab_orders`, `imaging`, and `prescriptions` tables.

**Solution:** Run this command to apply the database migration:

```powershell
.\fix-lab-orders-cascade.ps1
```

## What This Fixes

The migration adds `ON DELETE CASCADE` to three foreign key constraints so that when you delete a visit, it will automatically delete:

1. ✅ Lab orders (and their results)
2. ✅ Imaging records
3. ✅ Prescriptions (and their items)

## Before Running

Make sure you have:
- [ ] `.env` file with `DATABASE_URL`
- [ ] `psql` command available (PostgreSQL client)
- [ ] Database backup (recommended)

## After Running

Your visit delete operations will work without errors!

## Files Updated

1. **Migration SQL:** [backend/migrations/fix_lab_orders_cascade_delete.sql](backend/migrations/fix_lab_orders_cascade_delete.sql)
2. **PowerShell Script:** [fix-lab-orders-cascade.ps1](fix-lab-orders-cascade.ps1)
3. **Updated Model:** [backend/src/models/visit.model.ts](backend/src/models/visit.model.ts)
4. **Full Documentation:** [FIX_VISIT_DELETE_LAB_ORDERS.md](FIX_VISIT_DELETE_LAB_ORDERS.md)

## Need Help?

Read the full documentation in [FIX_VISIT_DELETE_LAB_ORDERS.md](FIX_VISIT_DELETE_LAB_ORDERS.md)
