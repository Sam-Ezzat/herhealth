# Migrate Local Database to Neon

## 📋 Migration Steps

### Option 1: Export and Import Data (Recommended)

#### Step 1: Export Local Database

Run this command to export your local database:

```powershell
# Export schema and data from local PostgreSQL
pg_dump -h localhost -U postgres -d obgyn_clinic -f local_backup.sql

# Or if you need to specify password:
$env:PGPASSWORD="your_password"
pg_dump -h localhost -U postgres -d obgyn_clinic -f local_backup.sql
```

This creates a `local_backup.sql` file with all your schema and data.

#### Step 2: Import to Neon

```powershell
# Import to Neon database
psql "postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require" -f local_backup.sql
```

---

### Option 2: Use Migration Files (Fresh Install)

If you want a clean database with just the schema:

#### Step 1: Run Migration Files in Order

Connect to Neon and run these files in sequence:

```powershell
# Set connection string
$NEON_DB = "postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Run migrations
psql $NEON_DB -f backend/src/database/migrations/001_initial_schema.sql
psql $NEON_DB -f backend/src/database/migrations/002_seed_admin.sql
psql $NEON_DB -f backend/src/database/migrations/007_add_reservation_type.sql
psql $NEON_DB -f backend/database/migrations/007_create_calendar_tables.sql
psql $NEON_DB -f backend/database/migrations/008_insert_whatsapp_templates.sql
psql $NEON_DB -f backend/database/migrations/009_add_template_id_to_whatsapp_messages.sql
psql $NEON_DB -f backend/database/migrations/010_add_created_by_to_appointments.sql
psql $NEON_DB -f backend/migrations/create_pregnancy_journey_system.sql
psql $NEON_DB -f backend/add_color_code_columns.sql
psql $NEON_DB -f backend/add_is_closed_column.sql
```

#### Step 2: Create Admin User

```powershell
psql $NEON_DB -f backend/create_admin.sql
```

---

### Option 3: Manual Export/Import via Neon Console

#### Step 1: Export Local Data as INSERT Statements

```powershell
# Export only data (no schema)
pg_dump -h localhost -U postgres -d obgyn_clinic --data-only --inserts -f data_only.sql
```

#### Step 2: Use Neon SQL Editor

1. Go to: https://console.neon.tech
2. Select your project
3. Click **SQL Editor**
4. First, run schema migrations (use files from Option 2)
5. Then copy and paste content from `data_only.sql`
6. Click **Run**

---

## 🔍 Verify Migration

After migration, test the connection:

```powershell
# Test connection
psql "postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT COUNT(*) FROM users;"

# Check tables exist
psql "postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require" -c "\dt"
```

---

## 🛠️ Troubleshooting

### If psql command not found:

Install PostgreSQL client:
```powershell
# Using Chocolatey
choco install postgresql

# Or download from: https://www.postgresql.org/download/windows/
```

### If you get permission errors:

Make sure you're using the correct connection string with `sslmode=require`.

### If tables already exist:

Drop and recreate the database in Neon Console, or drop specific tables:

```sql
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
-- etc.
```

---

## ✅ Post-Migration Checklist

- [ ] All tables exist in Neon
- [ ] Admin user exists
- [ ] Test login from frontend
- [ ] Check patient data
- [ ] Verify appointments
- [ ] Test API endpoints

---

## 🚀 Quick Test After Migration

```powershell
# Test backend with Neon database
cd backend
$env:DATABASE_URL="postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
npm run dev
```

Then test: http://localhost:5000/api/v1/auth/login

If that works locally, your Vercel deployment will work too!
