# Neon Production Database Connection Checklist

This checklist ensures your Neon production database is properly connected to your Vercel deployment.

## ✅ Pre-Deployment Checklist

### 1. Neon Database Setup
- [ ] Neon project created at https://console.neon.tech
- [ ] Database schema migrated (all tables created)
- [ ] Connection string copied and saved securely
- [ ] Database is active (not suspended)

### 2. Vercel Backend Environment Variables
Go to: https://vercel.com/dashboard → Your Backend Project → Settings → Environment Variables

Verify these variables are set for **Production**:

- [ ] `DATABASE_URL` = Your Neon connection string
  - Format: `postgresql://neondb_owner:***@ep-***.neon.tech/neondb?sslmode=require`
  - Must include `?sslmode=require` at the end
  - Must be the **pooled connection string** (contains `-pooler`)
  
- [ ] `NODE_ENV` = `production`
- [ ] `JWT_SECRET` = (your secure secret)
- [ ] `JWT_REFRESH_SECRET` = (your secure secret)
- [ ] `CORS_ORIGIN` = `https://herhealthfrontend.vercel.app`

### 3. Backend Code Configuration
Your [backend/src/config/database.ts](backend/src/config/database.ts) should:

- [ ] Check for `DATABASE_URL` environment variable
- [ ] Use SSL when connecting to Neon: `ssl: { rejectUnauthorized: false }`
- [ ] Handle connection properly with pooling

Current configuration (already correct):
```typescript
const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
```

## ✅ Post-Deployment Verification

### 4. Redeploy After Environment Variable Changes
- [ ] Go to Vercel → Your Backend Project → Deployments
- [ ] Click ⋯ (three dots) on latest deployment → Redeploy
- [ ] Wait for deployment to complete (usually 1-2 minutes)

### 5. Test Backend Health
Run this command:
```powershell
curl https://herhealthbackend.vercel.app/health
```

Expected response:
```json
{
  "success": true,
  "message": "HerHealth OBGYN Clinic API is running",
  "timestamp": "2026-01-21T..."
}
```

- [ ] Health endpoint returns 200 OK
- [ ] Response includes success message

### 6. Test Database Connection
Try accessing a database-dependent endpoint:
```powershell
curl https://herhealthbackend.vercel.app/api/v1/users
```

- [ ] Endpoint responds (even if 401 Unauthorized - that's expected without auth)
- [ ] No 500 errors or database connection failures

### 7. Check Deployment Logs
Go to: Vercel → Backend Project → Latest Deployment → Runtime Logs

Look for:
- [ ] "Database connected successfully" message
- [ ] No database connection errors
- [ ] No SSL/TLS errors

### 8. Monitor Neon Console
Go to: https://console.neon.tech → Your Project → Monitoring

- [ ] See active connections from Vercel
- [ ] Connection count increases when API is accessed
- [ ] No connection errors in logs

## 🔧 Troubleshooting

### Problem: "Database connection failed"
**Solutions:**
1. Verify `DATABASE_URL` is correctly set in Vercel
2. Ensure the connection string includes `?sslmode=require`
3. Use the **pooled connection string** (contains `-pooler` in hostname)
4. Redeploy after fixing environment variables

### Problem: "SSL/TLS error"
**Solutions:**
1. Ensure database.ts has `ssl: { rejectUnauthorized: false }`
2. Verify connection string ends with `?sslmode=require`
3. Check that you're using the Neon connection string (not local)

### Problem: "Cannot read DATABASE_URL"
**Solutions:**
1. Environment variable might not be set correctly
2. Go to Vercel Settings → Environment Variables
3. Ensure "Production" environment is checked
4. Redeploy after saving

### Problem: "Connection timeout"
**Solutions:**
1. Neon database might be suspended (free tier auto-suspends after inactivity)
2. Go to Neon Console and wake up the database
3. Try the API call again in 10-15 seconds

## 🚀 Quick Verification Script

Run the automated verification script:
```powershell
.\verify-neon-connection.ps1
```

## 📋 Connection String Format Reference

### Correct Neon Connection String:
```
postgresql://neondb_owner:npg_XXXXX@ep-XXXXX-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

Key components:
- `postgresql://` - Protocol
- `neondb_owner:npg_XXXXX@` - Username and password
- `ep-XXXXX-pooler.REGION.neon.tech` - Host (must include `-pooler` for connection pooling)
- `/neondb` - Database name
- `?sslmode=require` - SSL requirement (CRITICAL!)

### Where to Find Your Connection String:
1. Go to https://console.neon.tech
2. Select your project
3. Click "Connection Details" or "Dashboard"
4. Copy the "Pooled connection string"

## ✨ Success Indicators

You know it's working when:
- ✅ Backend health endpoint returns 200 OK
- ✅ API endpoints return data (not 500 errors)
- ✅ Deployment logs show "Database connected successfully"
- ✅ Neon monitoring shows active connections
- ✅ You can perform CRUD operations through the API
- ✅ Frontend can authenticate and fetch data

## 📚 Related Documentation

- [ADD_VERCEL_ENV_VARS.md](ADD_VERCEL_ENV_VARS.md) - Step-by-step guide to add environment variables
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete deployment walkthrough
- [VERCEL_TROUBLESHOOTING.md](VERCEL_TROUBLESHOOTING.md) - Common deployment issues

---

**Last Updated:** January 21, 2026
