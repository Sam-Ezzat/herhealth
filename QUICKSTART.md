# Quick Start Guide - OBGYN Clinic System

Follow these steps to get the project running on your machine.

## Prerequisites

Before you begin, ensure you have installed:

- ✅ **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- ✅ **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- ✅ **Git** (optional, for version control)

Check your installations:
```powershell
node --version
npm --version
psql --version
```

## Installation Steps

### Step 1: Install Backend Dependencies

```powershell
cd backend
npm install
```

This will install all required packages (~30 seconds).

### Step 2: Install Frontend Dependencies

```powershell
cd ..\frontend
npm install
```

This will install React and related packages (~45 seconds).

### Step 3: Database Setup

1. **Start PostgreSQL** (if not running)

2. **Create Database**:
```powershell
psql -U postgres -c "CREATE DATABASE obgyn_clinic;"
```

If prompted, enter your PostgreSQL password.

3. **Run Migrations**:
```powershell
cd ..\backend
psql -U postgres -d obgyn_clinic -f src\database\migrations\001_initial_schema.sql
```

This creates all tables and inserts default data.

### Step 4: Configure Environment Variables

**Backend** - Create `backend\.env`:
```powershell
cd backend
copy .env.example .env
```

Edit `backend\.env` with your settings:
```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

DB_HOST=localhost
DB_PORT=5432
DB_NAME=obgyn_clinic
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h

CORS_ORIGIN=http://localhost:3000
```

⚠️ **Important**: Replace `YOUR_POSTGRES_PASSWORD` with your actual password!

**Frontend** - Create `frontend\.env`:
```powershell
cd ..\frontend
copy .env.example .env
```

The default values should work:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=OBGYN Clinic
```

### Step 5: Start Development Servers

Open **TWO PowerShell terminals**:

**Terminal 1 - Backend**:
```powershell
cd backend
npm run dev
```

You should see:
```
Database connected successfully
Server running in development mode on port 5000
API available at http://localhost:5000/api/v1
```

**Terminal 2 - Frontend**:
```powershell
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### Step 6: Verify Installation

1. **Backend Health Check**:
   - Open browser: `http://localhost:5000/health`
   - Should see: `{"success": true, "message": "OBGYN Clinic API is running", ...}`

2. **Frontend**:
   - Open browser: `http://localhost:3000`
   - Should see the login page placeholder

## 🎉 Success!

Your OBGYN Clinic system is now running!

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **API**: http://localhost:5000/api/v1

## Default Database Data

After migration, your database includes:

**Default Roles**:
- Admin (full access)
- Doctor (clinical access)
- Nurse (patient care access)
- Receptionist (scheduling access)

**Color Codes**:
- Red, Yellow, Green, Blue, Orange, Purple

## Troubleshooting

### Issue: "Database connection failed"

**Solution**:
1. Verify PostgreSQL is running
2. Check credentials in `backend\.env`
3. Ensure database `obgyn_clinic` exists:
   ```powershell
   psql -U postgres -l
   ```

### Issue: "Port 5000 already in use"

**Solution**:
1. Find and kill the process:
   ```powershell
   Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
   ```
   OR
2. Change PORT in `backend\.env` to 5001, 5002, etc.

### Issue: "Port 3000 already in use"

**Solution**:
- Vite will automatically use next available port (3001, 3002...)
- Just press 'y' when prompted

### Issue: "Module not found" errors

**Solution**:
```powershell
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

### Issue: TypeScript errors

**Solution**:
```powershell
# Rebuild TypeScript
npm run build
```

### Issue: "psql: command not found"

**Solution**:
- Add PostgreSQL to PATH
- Or use full path: `C:\Program Files\PostgreSQL\15\bin\psql.exe`

## Development Workflow

### Daily Startup
```powershell
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

### Before Committing
```powershell
# Check for errors
npm run lint

# Format code
npm run format

# Run tests
npm test
```

### Database Reset (if needed)
```powershell
# Drop and recreate database
psql -U postgres -c "DROP DATABASE obgyn_clinic;"
psql -U postgres -c "CREATE DATABASE obgyn_clinic;"
psql -U postgres -d obgyn_clinic -f backend\src\database\migrations\001_initial_schema.sql
```

## Next Steps

Now that your environment is ready:

1. ✅ Project setup complete
2. 🚀 Ready to build Feature #2: Authentication System
3. 📝 Review `README.md` for full documentation
4. 📊 Check `OBGYN_ERD.md` for database schema

## Useful Commands

```powershell
# Backend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Check code quality
npm run lint:fix     # Fix linting issues
npm run format       # Format code

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality
npm run lint:fix     # Fix linting issues
npm run format       # Format code
```

## Support

If you encounter issues:

1. Check this QUICKSTART guide
2. Review error messages carefully
3. Check `backend\README.md` or `frontend\README.md`
4. Verify all prerequisites are installed
5. Ensure all environment variables are set correctly

---

**You're all set! Happy coding! 🎊**
