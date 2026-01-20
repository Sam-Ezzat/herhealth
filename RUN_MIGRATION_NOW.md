# Quick Migration Guide

## The database migration needs to be run to add calendar color features.

### Option 1: Using pgAdmin or DBeaver (RECOMMENDED)

1. Open pgAdmin or DBeaver
2. Connect to your Neon database:
   - Host: ep-lingering-water-a272rrqc.eu-central-1.aws.neon.tech
   - Database: herhealth
   - User: herhealth_owner
3. Open the SQL file: `MANUAL_MIGRATION.sql`
4. Execute the SQL
5. Restart your backend server

### Option 2: Using Neon Console (EASIEST)

1. Go to https://console.neon.tech
2. Login to your account
3. Select your project
4. Click on "SQL Editor" in the left menu
5. Copy and paste the SQL from `MANUAL_MIGRATION.sql`
6. Click "Run" button
7. Restart your backend server

### Option 3: Using Node.js Script

Run this command from the backend folder:
```powershell
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query(require('fs').readFileSync('./database/migrations/008_add_color_code_to_calendars.sql', 'utf8')).then(() => { console.log('Migration successful'); process.exit(0); }).catch(err => { console.error('Migration failed:', err); process.exit(1); });"
```

### Verify Migration Success

After running the migration, check your backend logs. You should NOT see this error anymore:
```
column "color_code" of relation "doctor_calendars" does not exist
```

### Then Test the Feature

1. Restart backend: `cd backend && npm run dev`
2. Go to Settings → Doctor Calendars
3. Create a calendar with colors
4. Book an appointment and select the calendar
