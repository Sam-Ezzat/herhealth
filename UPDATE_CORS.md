# Update Backend CORS - Quick Guide

## ✅ Your Setup
- **Frontend**: https://herhealthfrontend.vercel.app
- **Backend**: https://herhealthbackend.vercel.app
- **Database**: Neon PostgreSQL

## 🔧 Update Backend CORS (Required)

### Step 1: Go to Backend Project
1. Visit: https://vercel.com/dashboard
2. Click on your **backend project** (`herhealthbackend`)

### Step 2: Update Environment Variable
1. Click **Settings** (in the top menu)
2. Click **Environment Variables** (left sidebar)
3. Find `CORS_ORIGIN`
4. Click the **Edit** button (pencil icon)
5. Update value to: `https://herhealthfrontend.vercel.app`
6. Click **Save**

### Step 3: Redeploy Backend
1. Click **Deployments** tab
2. Find the latest deployment
3. Click the **three dots (⋯)** menu
4. Select **Redeploy**
5. Click **Redeploy** to confirm
6. Wait ~1-2 minutes for redeployment

## ✅ Test Your Application

Once redeployment is complete:

### 1. Test Backend Health
```powershell
curl https://herhealthbackend.vercel.app/health
```

Expected response:
```json
{
  "success": true,
  "message": "HerHealth OBGYN Clinic API is running",
  "timestamp": "..."
}
```

### 2. Test Frontend
1. Open: https://herhealthfrontend.vercel.app
2. Try to login
3. Open browser DevTools (F12) → Console
4. Should see no CORS errors

### 3. Common Test Scenarios
- [ ] Login page loads
- [ ] Can login successfully
- [ ] Dashboard loads after login
- [ ] Can view patients list
- [ ] Can create new appointment
- [ ] No CORS errors in console

## 🐛 If You See CORS Errors

Error in console:
```
Access to XMLHttpRequest at 'https://herhealthbackend.vercel.app/api/v1/...' 
from origin 'https://herhealthfrontend.vercel.app' has been blocked by CORS policy
```

**Solutions:**
1. Double-check CORS_ORIGIN value (no trailing slash!)
   - ✅ Correct: `https://herhealthfrontend.vercel.app`
   - ❌ Wrong: `https://herhealthfrontend.vercel.app/`
2. Make sure you redeployed the backend
3. Clear browser cache (Ctrl + Shift + Delete)
4. Try in incognito/private window

## 📝 Complete Environment Variables in Vercel Backend

Your backend should have these set:

```
NODE_ENV=production
PORT=5000
API_PREFIX=/api/v1
DATABASE_URL=postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=wEhy1oYauJQlFdfUM2C7gAWmiHPDNGzT
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=mbv41cEyzFHxCBPYDKWifQTe96l7SqI8
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://herhealthfrontend.vercel.app
LOG_LEVEL=info
```

## 🎯 After Everything Works

### Create Admin User in Database
You'll need to create an admin user in your Neon database to login:

1. Go to: https://console.neon.tech
2. Select your project
3. Click **SQL Editor**
4. Run this script:

```sql
-- Generate a password hash for 'admin123'
-- You can use https://bcrypt-generator.com/ to generate the hash

INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@herhealth.com',
  '$2b$10$rZN3YTHvQQhQXL5kqKJ.xO5OXxKhR5YvYvF1XE7c4xJQXL5k6qKJ.x', -- Replace with actual bcrypt hash
  'System Administrator',
  'admin',
  true
);
```

**To generate a secure password hash:**
1. Visit: https://bcrypt-generator.com/
2. Enter your desired password (e.g., `Admin@2026`)
3. Rounds: 10
4. Copy the generated hash
5. Replace the hash in the SQL above

### Test Login
- **Email**: admin@herhealth.com
- **Password**: (whatever you set in the hash)

## 🚀 Your Deployment is Complete!

- ✅ Backend: https://herhealthbackend.vercel.app
- ✅ Frontend: https://herhealthfrontend.vercel.app
- ✅ Database: Neon PostgreSQL
- ⏳ Waiting: Backend CORS update

**Next step**: Follow Step 1-3 above to update CORS in Vercel! 🎉
