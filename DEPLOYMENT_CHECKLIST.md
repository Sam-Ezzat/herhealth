# Quick Deployment Checklist

## ✅ Pre-Deployment Steps

- [ ] All code committed to Git
- [ ] Push to GitHub repository
- [ ] Database migrations ready
- [ ] Environment variable examples created

## 🗄️ Neon Database Setup

1. **Create Neon Project**
   - Go to https://console.neon.tech
   - Create new project: "herhealth-obgyn"
   - Copy connection string

2. **Run Migrations**
   - Connect to Neon database
   - Execute migration files from `backend/database/migrations/`

3. **Create Admin User**
   - Use script from `backend/create_admin.sql`
   - Or manually create admin account

## 🚀 Vercel Backend Deployment

1. **Create Vercel Project**
   - Import from GitHub
   - Root directory: `backend`
   - Build command: `npm run build`
   - Output directory: `dist`

2. **Set Environment Variables**
   ```
   NODE_ENV=production
   DATABASE_URL=<neon-connection-string>
   JWT_SECRET=<generate-strong-secret>
   JWT_REFRESH_SECRET=<generate-strong-secret>
   CORS_ORIGIN=<will-add-after-frontend-deployed>
   ```

3. **Deploy**
   - Click Deploy
   - Copy backend URL

## 🎨 Vercel Frontend Deployment

1. **Create Vercel Project**
   - Same GitHub repository
   - Root directory: `frontend`
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

2. **Set Environment Variables**
   ```
   VITE_API_BASE_URL=<backend-url>/api/v1
   VITE_APP_NAME=HerHealth OBGYN Clinic
   ```

3. **Deploy**
   - Click Deploy
   - Copy frontend URL

## 🔄 Final Configuration

1. **Update Backend CORS**
   - Go to backend project in Vercel
   - Update `CORS_ORIGIN` with frontend URL
   - Redeploy backend

2. **Test Everything**
   - Open frontend URL
   - Try logging in
   - Test key features

## 📝 Your Deployment URLs

- **Frontend**: ___________________________
- **Backend**: ___________________________
- **Database**: ___________________________

## 🔐 Generate JWT Secrets

Run in PowerShell:
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Run twice to get two different secrets.

## 📚 Full Documentation

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.
