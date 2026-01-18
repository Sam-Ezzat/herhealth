# Deployment Guide: Vercel + Neon

This guide will walk you through deploying the HerHealth OBGYN Clinic application to Vercel (frontend & backend) and Neon (database).

## Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- Neon account (sign up at https://neon.tech)

## Part 1: Set Up Neon Database

### Step 1: Create a Neon Project

1. Go to https://console.neon.tech
2. Click "New Project"
3. Configure your project:
   - **Name**: `herhealth-obgyn`
   - **Region**: Choose closest to your users
   - **Compute size**: Start with the free tier
4. Click "Create Project"

### Step 2: Get Your Connection String

1. After project creation, you'll see the connection details
2. Copy the **Connection String** (it looks like):
   ```
   postgresql://username:password@host.neon.tech/dbname?sslmode=require
   ```
3. Save this - you'll need it for Vercel environment variables

### Step 3: Initialize the Database Schema

You have two options:

**Option A: Using the Neon SQL Editor**
1. In Neon Console, go to "SQL Editor"
2. Run your migration files in order:
   - Copy content from `backend/database/migrations/*.sql`
   - Execute each migration file

**Option B: Using a local tool (recommended)**
1. Install a PostgreSQL client like pgAdmin or use psql
2. Connect using your Neon connection string
3. Run all migration files in sequence

## Part 2: Deploy Backend to Vercel

### Step 1: Push Your Code to GitHub

```powershell
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - ready for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/herhealth.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend on Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the backend:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Configure Backend Environment Variables

In the Vercel project settings, add these environment variables:

```
NODE_ENV=production
PORT=5000
API_PREFIX=/api/v1
DATABASE_URL=<your-neon-connection-string>
JWT_SECRET=<generate-a-strong-random-string>
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=<generate-another-strong-random-string>
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=<your-frontend-url>
LOG_LEVEL=info
```

**Generate secure JWT secrets using PowerShell:**
```powershell
# Run this to generate random secrets
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Copy your backend URL (e.g., `https://herhealth-backend.vercel.app`)

## Part 3: Deploy Frontend to Vercel

### Step 1: Create Another Vercel Project

1. In Vercel dashboard, click "Add New" → "Project"
2. Select the same GitHub repository
3. Configure the frontend:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 2: Configure Frontend Environment Variables

Add these environment variables:

```
VITE_API_BASE_URL=<your-backend-url>/api/v1
VITE_APP_NAME=HerHealth OBGYN Clinic
```

Example:
```
VITE_API_BASE_URL=https://herhealth-backend.vercel.app/api/v1
```

### Step 3: Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Your frontend will be live at `https://your-project.vercel.app`

## Part 4: Update CORS Configuration

### Step 1: Update Backend Environment Variables

1. Go to your backend project in Vercel
2. Navigate to Settings → Environment Variables
3. Update `CORS_ORIGIN` with your frontend URL:
   ```
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```

### Step 2: Redeploy Backend

1. Go to the Deployments tab
2. Click the three dots on the latest deployment
3. Select "Redeploy"

## Part 5: Seed the Database

### Create an Admin User

1. Connect to your Neon database using a SQL client
2. Run the admin creation script from `backend/create_admin.sql`:

```sql
-- Or create manually
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@herhealth.com',
  -- Use bcrypt to hash 'admin123' or your preferred password
  '$2b$10$...',
  'System Administrator',
  'admin',
  true
);
```

**To generate a password hash:**
```javascript
// Run in Node.js or use an online bcrypt tool
const bcrypt = require('bcrypt');
console.log(bcrypt.hashSync('your-password', 10));
```

## Part 6: Verify Deployment

### Test the Backend

```powershell
# Test the health endpoint
curl https://your-backend.vercel.app/api/v1/health

# Test login
curl -X POST https://your-backend.vercel.app/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@herhealth.com","password":"your-password"}'
```

### Test the Frontend

1. Open your frontend URL in a browser
2. Try logging in with your admin credentials
3. Navigate through the app to ensure all features work

## Part 7: Domain Configuration (Optional)

### Add a Custom Domain

1. In Vercel, go to your project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions
5. Update environment variables with your new domain

## Troubleshooting

### Common Issues

**Issue: Database connection fails**
- Verify your DATABASE_URL is correct
- Ensure SSL is enabled (`?sslmode=require`)
- Check Neon project is active

**Issue: CORS errors**
- Verify CORS_ORIGIN matches your frontend URL exactly
- No trailing slash in URLs
- Redeploy backend after changing environment variables

**Issue: Build fails**
- Check build logs in Vercel
- Ensure all dependencies are in package.json
- Verify TypeScript compiles locally

**Issue: 404 errors on API calls**
- Verify VITE_API_BASE_URL is correct
- Include `/api/v1` in the URL
- Check API routes are correctly defined

### Debugging

**View Backend Logs:**
1. Go to your backend project in Vercel
2. Click on a deployment
3. View "Runtime Logs" tab

**View Database Queries:**
1. Go to Neon Console
2. Navigate to "Monitoring"
3. View query logs and performance

## Monitoring and Maintenance

### Vercel

- Monitor deployments in the Vercel dashboard
- Set up notifications for deployment failures
- Use Analytics to track usage

### Neon

- Monitor database usage in Neon Console
- Set up usage alerts
- Regular backups are automatic

### Database Migrations

When you need to run new migrations:

1. Connect to Neon database
2. Run migration SQL files manually
3. Or set up automated migrations via GitHub Actions

## Security Checklist

- [ ] Strong JWT secrets generated
- [ ] DATABASE_URL kept secret
- [ ] CORS configured to only allow your frontend
- [ ] Default admin password changed
- [ ] Environment variables set correctly
- [ ] SSL enabled for database connections
- [ ] Rate limiting configured (if needed)

## Performance Optimization

### Backend

- [ ] Enable response compression
- [ ] Add caching for frequently accessed data
- [ ] Optimize database queries
- [ ] Set appropriate connection pool size

### Frontend

- [ ] Enable gzip/brotli compression
- [ ] Optimize images
- [ ] Code splitting implemented
- [ ] Lazy loading for routes

## Next Steps

1. Configure WhatsApp Business API (optional)
2. Set up monitoring and alerting
3. Configure backup strategy
4. Add CDN for static assets
5. Set up CI/CD pipeline

## Cost Estimates

- **Neon Free Tier**: $0/month (0.5 GB storage, 191 hours compute)
- **Vercel Hobby**: $0/month (100 GB bandwidth)
- **Upgrade Costs**: Scale as needed

For production, consider:
- Neon Pro: $19/month
- Vercel Pro: $20/month per user

## Support Resources

- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs
- GitHub Issues: Report bugs in your repository

---

**Deployment Date**: Update this when you deploy
**Frontend URL**: _your-frontend.vercel.app_
**Backend URL**: _your-backend.vercel.app_
**Database**: Neon PostgreSQL
