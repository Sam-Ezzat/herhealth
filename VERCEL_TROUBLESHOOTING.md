# Vercel Deployment Troubleshooting

## ✅ Changes Made to Fix Serverless Function Error

### 1. Created Serverless Entry Point
- Created `backend/api/index.ts` as the Vercel serverless function handler
- This file exports the Express app for Vercel's serverless environment

### 2. Updated vercel.json
- Changed build source from `src/server.ts` to `api/index.ts`
- Added proper routing configuration for all HTTP methods
- Added rewrites for clean URL handling

### 3. Updated tsconfig.json
- Changed `rootDir` from `./src` to `.` to include the api folder
- Added `api/**/*` to the include patterns

## 🔧 Vercel Environment Variables Required

Make sure these are set in your Vercel project settings:

```
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=wEhy1oYauJQlFdfUM2C7gAWmiHPDNGzT
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=mbv41cEyzFHxCBPYDKWifQTe96l7SqI8
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-url.vercel.app
API_PREFIX=/api/v1
LOG_LEVEL=info
```

## 🚀 Redeploy Instructions

### Option 1: Automatic Redeploy (Recommended)
Vercel should automatically detect the push and redeploy. Check:
1. Go to https://vercel.com/dashboard
2. Select your backend project
3. Go to "Deployments" tab
4. Wait for the new deployment to complete

### Option 2: Manual Redeploy
If automatic doesn't work:
1. Go to Vercel dashboard
2. Click on your backend project
3. Go to "Deployments" tab
4. Click the three dots on the latest deployment
5. Select "Redeploy"

## 🔍 Testing After Deployment

### Test Health Endpoint
```powershell
curl https://herhealthbackend.vercel.app/health
```

Expected response:
```json
{
  "success": true,
  "message": "HerHealth OBGYN Clinic API is running",
  "timestamp": "2026-01-18T..."
}
```

### Test API Endpoint
```powershell
curl https://herhealthbackend.vercel.app/api/v1/auth/login `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"admin@herhealth.com","password":"your-password"}'
```

## 🐛 Common Issues & Solutions

### Issue 1: Still Getting 500 Error
**Solution:**
1. Check Vercel logs:
   - Go to your project → Deployments → Click on deployment → Runtime Logs
2. Look for specific error messages
3. Common causes:
   - Missing environment variables
   - Database connection issues
   - Module import errors

### Issue 2: Database Connection Timeout
**Solution:**
1. Verify DATABASE_URL is correct in Vercel environment variables
2. Check that Neon database is active
3. Ensure SSL mode is set: `?sslmode=require`
4. Increase connection timeout in database config

### Issue 3: CORS Errors from Frontend
**Solution:**
1. Update CORS_ORIGIN in Vercel backend environment variables
2. Use exact frontend URL (no trailing slash)
3. Redeploy backend after changing env variables

### Issue 4: 404 on API Routes
**Solution:**
1. Ensure requests include `/api/v1` prefix
2. Check vercel.json routing configuration
3. Verify API_PREFIX environment variable is set

### Issue 5: Module Not Found Errors
**Solution:**
1. Ensure all dependencies are in package.json
2. Check that TypeScript compiles without errors locally
3. Remove node_modules and package-lock.json, reinstall
4. Push changes and let Vercel rebuild

## 📊 Viewing Logs in Vercel

1. Go to https://vercel.com/dashboard
2. Select your backend project
3. Click on a deployment
4. Navigate to "Runtime Logs" tab
5. Use filters to find errors:
   - Filter by "Error" to see only errors
   - Search for specific keywords

## 🔐 Security Checklist

- [ ] All environment variables are set in Vercel (not in code)
- [ ] DATABASE_URL is kept secret
- [ ] JWT secrets are strong random strings
- [ ] CORS_ORIGIN is set to your specific frontend URL
- [ ] SSL is enabled for database connection

## 🎯 Next Steps After Successful Deployment

1. **Initialize Database:**
   - Run migrations on your Neon database
   - Create admin user
   - Seed initial data if needed

2. **Update Frontend:**
   - Set VITE_API_BASE_URL to your backend URL
   - Deploy frontend to Vercel

3. **Update CORS:**
   - After frontend is deployed, update CORS_ORIGIN in backend
   - Redeploy backend

4. **Test Full Flow:**
   - Login from frontend
   - Test CRUD operations
   - Verify WhatsApp features (if configured)

## 📝 Useful Vercel CLI Commands

Install Vercel CLI:
```powershell
npm install -g vercel
```

Common commands:
```powershell
# Login to Vercel
vercel login

# Deploy from command line
vercel --prod

# View logs
vercel logs

# List environment variables
vercel env ls

# Pull environment variables locally
vercel env pull
```

## 🆘 Still Having Issues?

1. Check Vercel Status: https://www.vercel-status.com/
2. Check Neon Status: https://neon.tech/status
3. Review Vercel Documentation: https://vercel.com/docs/functions/serverless-functions/runtimes/node-js
4. Check your deployment logs carefully for specific error messages

---

**Last Updated:** After fixing serverless function configuration
**Backend URL:** https://herhealthbackend.vercel.app
**Status:** Ready for deployment
