# Add Environment Variables to Vercel Backend

## 📋 Step-by-Step Guide

### Step 1: Go to Backend Project Settings
1. Visit: https://vercel.com/dashboard
2. Click on your **backend project** (`herhealthbackend`)
3. Click **Settings** tab (top menu)
4. Click **Environment Variables** (left sidebar)

### Step 2: Add Each Variable

Click **Add New** button and add these one by one:

#### Variable 1: NODE_ENV
- **Name**: `NODE_ENV`
- **Value**: `production`
- **Environment**: Production ✓
- Click **Save**

#### Variable 2: PORT
- **Name**: `PORT`
- **Value**: `5000`
- **Environment**: Production ✓
- Click **Save**

#### Variable 3: API_PREFIX
- **Name**: `API_PREFIX`
- **Value**: `/api/v1`
- **Environment**: Production ✓
- Click **Save**

#### Variable 4: DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: `postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require`
- **Environment**: Production ✓
- Click **Save**

#### Variable 5: JWT_SECRET
- **Name**: `JWT_SECRET`
- **Value**: `wEhy1oYauJQlFdfUM2C7gAWmiHPDNGzT`
- **Environment**: Production ✓
- Click **Save**

#### Variable 6: JWT_EXPIRES_IN
- **Name**: `JWT_EXPIRES_IN`
- **Value**: `24h`
- **Environment**: Production ✓
- Click **Save**

#### Variable 7: JWT_REFRESH_SECRET
- **Name**: `JWT_REFRESH_SECRET`
- **Value**: `mbv41cEyzFHxCBPYDKWifQTe96l7SqI8`
- **Environment**: Production ✓
- Click **Save**

#### Variable 8: JWT_REFRESH_EXPIRES_IN
- **Name**: `JWT_REFRESH_EXPIRES_IN`
- **Value**: `7d`
- **Environment**: Production ✓
- Click **Save**

#### Variable 9: CORS_ORIGIN
- **Name**: `CORS_ORIGIN`
- **Value**: `https://herhealthfrontend.vercel.app`
- **Environment**: Production ✓
- Click **Save**

#### Variable 10: LOG_LEVEL
- **Name**: `LOG_LEVEL`
- **Value**: `info`
- **Environment**: Production ✓
- Click **Save**

### Step 3: Redeploy Backend
After adding ALL variables:

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Confirm by clicking **Redeploy**
5. Wait 1-2 minutes for deployment to complete

### Step 4: Verify Deployment
Test the backend:

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

## 📝 Quick Copy-Paste Format

If Vercel allows bulk import, here's the format:

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

## ⚠️ Important Notes

1. **No spaces** around the `=` sign
2. **No quotes** around values (Vercel adds them automatically)
3. Select **Production** environment for all variables
4. **Must redeploy** after adding variables
5. Variables are case-sensitive

## 🎯 Checklist

After adding variables, you should see 10 environment variables in Vercel:

- [ ] NODE_ENV
- [ ] PORT
- [ ] API_PREFIX
- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] JWT_EXPIRES_IN
- [ ] JWT_REFRESH_SECRET
- [ ] JWT_REFRESH_EXPIRES_IN
- [ ] CORS_ORIGIN
- [ ] LOG_LEVEL

## ✅ After Successful Deployment

Your backend should now work! Test it:

1. Backend health: https://herhealthbackend.vercel.app/health
2. Frontend login: https://herhealthfrontend.vercel.app

If you see errors, check the **Runtime Logs** in Vercel:
- Deployments → Click on deployment → Runtime Logs tab
