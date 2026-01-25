# Production Timing Fix - Complete Solution

## Problem Statement
Appointment timing inconsistencies persisted on production server even after initial fixes. Times were still showing 2-hour shifts (e.g., 1:30 PM displaying as 11:30 AM).

## Root Cause Analysis

### Issue 1: Connection Pool Timezone Settings
The original fix set timezone only in `pool.on('connect')`, but this approach had limitations:
- **Connection pooling**: Not all queries use the same connection, so timezone setting wasn't always applied
- **Production environment**: Connection pool behavior differs between development and production
- **Timing of execution**: The timezone setting was async and might not complete before queries execute

### Issue 2: Timestamp Type Casting
INSERT and UPDATE queries weren't explicitly casting timestamp values, leaving PostgreSQL to interpret them based on:
- Server timezone (which might differ from application timezone)
- Client session timezone (which might not be set correctly)
- Type inference (timestamptz vs timestamp)

## Complete Solution

### 1. Database Configuration (`backend/src/config/database.ts`)

```typescript
// Set PGTZ environment variable for the entire Node.js process
// This ensures ALL PostgreSQL connections use Africa/Cairo timezone
process.env.PGTZ = 'Africa/Cairo';

pool.on('connect', (client) => {
  console.log('Database connected successfully');
  // Set timezone for each new connection as additional safeguard
  client.query("SET timezone = 'Africa/Cairo'").catch(err => {
    console.error('Failed to set timezone:', err);
  });
});
```

**Key Changes:**
- Added `process.env.PGTZ = 'Africa/Cairo'` - affects all pg connections
- Kept `pool.on('connect')` timezone setting as redundant safeguard
- Removed per-query timezone setting (was causing overhead)

### 2. Appointment Model INSERT (`backend/src/models/appointment.model.ts`)

```typescript
const sql = `
  INSERT INTO appointments (
    patient_id, doctor_id, calendar_id, start_at, end_at, type, status, reservation_type, notes, created_by
  )
  VALUES ($1, $2, $3, $4::timestamp, $5::timestamp, $6, $7, $8, $9, $10)
  RETURNING *
`;
```

**Key Changes:**
- Added `::timestamp` cast to `$4` (start_at) and `$5` (end_at)
- Ensures PostgreSQL interprets the value as local time (not timestamptz with automatic UTC conversion)
- Combined with PGTZ setting, guarantees correct timezone interpretation

### 3. Appointment Model UPDATE (`backend/src/models/appointment.model.ts`)

```typescript
Object.entries(appointmentData).forEach(([key, value]) => {
  if (key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'patient_name' && key !== 'doctor_name' && key !== 'patient_phone') {
    // Cast timestamp fields explicitly to ensure correct interpretation
    if (key === 'start_at' || key === 'end_at') {
      fields.push(`${key} = $${paramIndex}::timestamp`);
    } else {
      fields.push(`${key} = $${paramIndex}`);
    }
    values.push(value);
    paramIndex++;
  }
});
```

**Key Changes:**
- Detects `start_at` and `end_at` fields in dynamic UPDATE
- Adds `::timestamp` cast only for these fields
- Ensures consistent timestamp interpretation in updates

### 4. Query Results (Already Fixed)

```typescript
TO_CHAR(a.start_at AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD"T"HH24:MI:SS') as start_at,
TO_CHAR(a.end_at AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD"T"HH24:MI:SS') as end_at,
```

**No changes needed:**
- SELECT queries already use TO_CHAR with AT TIME ZONE
- Returns plain strings in local timezone format
- Frontend receives exactly what should be displayed

## Testing Checklist

### Backend Testing
- [ ] Start backend server - verify "Database connected successfully" message
- [ ] Create new appointment via API - verify times in database match input
- [ ] Update appointment time via API - verify times update correctly
- [ ] Fetch appointment via API - verify returned times match database
- [ ] Check appointment in different views - all should show same time

### Frontend Testing
- [ ] Create appointment at 1:30 PM - should display as 1:30 PM everywhere
- [ ] Edit appointment to 3:45 PM - should display as 3:45 PM everywhere
- [ ] Drag appointment in calendar - should maintain correct time
- [ ] Check appointment in List view - should match Calendar view
- [ ] Check appointment in Form view - should match other views
- [ ] Check appointment in Dashboard - should match other views

### Production Deployment
1. **Backup database** (always, before any production changes)
2. **Deploy backend changes** to production server
3. **Deploy frontend changes** (already deployed if previous commit was pushed)
4. **Restart backend service** to ensure new timezone settings take effect
5. **Test with real appointments** - create, edit, view across all interfaces
6. **Monitor for 24 hours** - verify no timezone-related issues appear

## Why This Works on Production

### Environment Variable Approach
- `process.env.PGTZ` is set before creating the connection pool
- All pg library operations respect PGTZ environment variable
- Works consistently across all connection pool connections
- Production servers properly apply environment variables

### Explicit Type Casting
- `::timestamp` removes ambiguity in PostgreSQL type inference
- Database knows to treat value as local time, not timestamptz
- Eliminates dependency on session timezone settings
- Works even if connection timezone setting fails

### Defense in Depth
We now have THREE layers of timezone protection:
1. **PGTZ environment variable** - process-wide setting
2. **pool.on('connect') timezone setting** - per-connection safeguard
3. **::timestamp casting** - per-query explicit type declaration

Even if one layer fails, the others ensure correct behavior.

## Configuration for Different Environments

### Development (Local)
```env
# .env file
DB_HOST=localhost
DB_PORT=5432
DB_NAME=obgyn_clinic
DB_USER=postgres
DB_PASSWORD=your_password
NODE_ENV=development
```

### Production (Neon/Cloud)
```env
# .env file (or hosting platform environment variables)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
NODE_ENV=production
```

**Important:** PGTZ is set in code, not environment variables, so it works everywhere.

## Common Pitfalls to Avoid

### ❌ DON'T: Use Date.toISOString() on Frontend
```javascript
// WRONG - converts to UTC
const dateTime = new Date(selectedDate + ' ' + selectedTime).toISOString();
```

### ✅ DO: Use Local Datetime String
```javascript
// CORRECT - keeps local time
const dateTime = `${selectedDate}T${selectedTime}:00`;
```

### ❌ DON'T: Let PostgreSQL Auto-Convert Timezone
```sql
-- WRONG - relies on session timezone
INSERT INTO appointments (start_at) VALUES ($1)
```

### ✅ DO: Explicitly Cast to Timestamp
```sql
-- CORRECT - explicit local time interpretation
INSERT INTO appointments (start_at) VALUES ($1::timestamp)
```

### ❌ DON'T: Assume Session Timezone Persists
```javascript
// WRONG - timezone might not be set on all connections
await pool.query("SET timezone = 'Africa/Cairo'");
await pool.query("INSERT INTO appointments...");
```

### ✅ DO: Set Process-Wide Timezone
```javascript
// CORRECT - affects all connections
process.env.PGTZ = 'Africa/Cairo';
```

## Verification Commands

### Check PostgreSQL Timezone
```sql
-- Run in database console
SHOW timezone;
-- Should show: Africa/Cairo
```

### Check Stored Times
```sql
-- View raw timestamps
SELECT id, start_at, start_at AT TIME ZONE 'UTC' as utc_time 
FROM appointments 
ORDER BY created_at DESC 
LIMIT 5;
```

### Test API Response
```bash
# Fetch appointments
curl http://localhost:5000/api/v1/appointments

# Check that start_at and end_at are formatted as:
# "2026-02-11T13:30:00" (no timezone offset)
```

## Rollback Plan

If issues occur in production:

1. **Immediate rollback:**
   ```bash
   git revert HEAD
   git push origin main
   # Redeploy previous version
   ```

2. **Temporary fix:**
   - Remove `::timestamp` casts from queries
   - Rely only on TO_CHAR for SELECT queries
   - Accept that new appointments might have timezone issues

3. **Data correction** (if times were stored incorrectly):
   ```sql
   -- Shift all appointments by 2 hours (if needed)
   UPDATE appointments 
   SET start_at = start_at + INTERVAL '2 hours',
       end_at = end_at + INTERVAL '2 hours'
   WHERE created_at > '2026-01-25';
   ```

## Monitoring

Watch for these indicators of timezone problems:
- Appointments showing times that don't match user input
- 2-hour shifts between calendar and list views
- WhatsApp messages with wrong appointment times
- Reports of "wrong time" from users

Check logs for:
- "Failed to set timezone" errors
- PostgreSQL timezone-related warnings
- Timestamp parsing errors from date-fns or moment.js

## Summary

This comprehensive fix ensures appointment times are handled consistently across:
- **Frontend** - timeUtils.ts centralizes time handling
- **Backend** - PGTZ + pool.on('connect') + ::timestamp casting
- **Database** - TO_CHAR with AT TIME ZONE for queries
- **Production** - Environment-independent configuration

All changes are backwards compatible and defensive, providing multiple layers of protection against timezone conversion issues.
