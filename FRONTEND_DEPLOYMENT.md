# Frontend Deployment Guide - Vercel

## 📦 Quick Setup Steps

### Step 1: Update Environment Variables (✅ Already Done)

The `.env.production` file is already configured with:
```
VITE_API_BASE_URL=https://herhealthbackend.vercel.app/api/v1
VITE_APP_NAME=HerHealth OBGYN Clinic
```

### Step 2: Test Build Locally

```powershell
cd frontend
npm run build
```

This will create a `dist` folder with your production build.

### Step 3: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit: https://vercel.com/new
   - Click "Add New" → "Project"

2. **Import Repository**
   - Select your GitHub repository: `herhealth`
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` ← IMPORTANT!
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
   - **Install Command**: `npm install` (default)

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   
   | Name | Value |
   |------|-------|
   | VITE_API_BASE_URL | https://herhealthbackend.vercel.app/api/v1 |
   | VITE_APP_NAME | HerHealth OBGYN Clinic |

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for deployment
   - Copy your frontend URL (e.g., `https://herhealth-frontend.vercel.app`)

#### Option B: Using Vercel CLI

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Navigate to frontend folder
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Follow the prompts:
# - Link to existing project? No
# - Project name: herhealth-frontend
# - Directory: ./
# - Override settings? No
```

### Step 4: Update Backend CORS

After getting your frontend URL, update the backend:

1. **Go to Backend Project in Vercel**
   - https://vercel.com/dashboard
   - Select: `herhealthbackend`

2. **Update Environment Variable**
   - Go to Settings → Environment Variables
   - Find `CORS_ORIGIN`
   - Update to: `https://your-frontend-url.vercel.app`
   - Click "Save"

3. **Redeploy Backend**
   - Go to Deployments tab
   - Click three dots on latest deployment
   - Select "Redeploy"

### Step 5: Test Your Application

1. **Open Frontend URL**
   ```
   https://your-frontend-url.vercel.app
   ```

2. **Test Login**
   - Try logging in with admin credentials
   - Check browser console for any errors

3. **Test API Calls**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Perform actions and verify API calls succeed

## 🔧 Configuration Files Created

- ✅ `frontend/vercel.json` - Handles client-side routing
- ✅ `frontend/.env.production` - Production environment variables

## 🐛 Common Issues & Solutions

### Issue 1: Blank Page After Deployment

**Symptoms:** Page loads but shows blank screen

**Solutions:**
1. Check browser console for errors (F12)
2. Verify VITE_API_BASE_URL is set correctly in Vercel
3. Check that all environment variables start with `VITE_`
4. Ensure base path in vite.config.ts is correct

### Issue 2: API Calls Failing (CORS Errors)

**Symptoms:** 
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**
1. Verify backend CORS_ORIGIN matches your frontend URL exactly
2. No trailing slash in URLs
3. Redeploy backend after changing CORS_ORIGIN
4. Clear browser cache

### Issue 3: 404 on Page Refresh

**Symptoms:** Refreshing non-home pages shows 404

**Solution:** The `vercel.json` file handles this by rewriting all routes to `index.html`

### Issue 4: Environment Variables Not Working

**Symptoms:** API calls go to wrong URL or undefined

**Solutions:**
1. Ensure all env vars start with `VITE_` prefix
2. Rebuild after changing environment variables
3. Clear Vite cache: `rm -rf node_modules/.vite`
4. In Vercel, go to Settings → Environment Variables
5. Make sure variables are set for "Production" environment
6. Redeploy after adding variables

## 📊 Verifying Deployment

### Check Build Logs
1. Go to Vercel dashboard
2. Click on your frontend project
3. Select latest deployment
4. View "Build Logs" for any errors

### Check Environment Variables
```powershell
# In Vercel dashboard
Settings → Environment Variables

# Should see:
VITE_API_BASE_URL = https://herhealthbackend.vercel.app/api/v1
VITE_APP_NAME = HerHealth OBGYN Clinic
```

### Test API Connection
```javascript
// Open browser console on your deployed site
console.log(import.meta.env.VITE_API_BASE_URL)
// Should output: https://herhealthbackend.vercel.app/api/v1
```

## 🎨 Custom Domain (Optional)

### Add Custom Domain to Frontend

1. **In Vercel Dashboard**
   - Select frontend project
   - Go to Settings → Domains
   - Click "Add"
   - Enter your domain: `app.yourdomain.com`

2. **Configure DNS**
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Wait for DNS propagation (5-30 minutes)

3. **Update Backend CORS**
   - Update CORS_ORIGIN to your custom domain
   - Redeploy backend

4. **Update Frontend Env**
   - If backend also has custom domain, update VITE_API_BASE_URL
   - Redeploy frontend

## 🔐 Security Best Practices

- ✅ All API keys and secrets in backend only
- ✅ Use HTTPS for all connections
- ✅ CORS properly configured
- ✅ Environment variables not in code
- ✅ .env files in .gitignore

## 📝 Post-Deployment Checklist

- [ ] Frontend deployed successfully
- [ ] Can access the login page
- [ ] Login works with test credentials
- [ ] API calls succeed (check Network tab)
- [ ] No CORS errors in console
- [ ] Backend CORS_ORIGIN updated with frontend URL
- [ ] All pages load correctly
- [ ] Client-side routing works (refresh test)
- [ ] Mobile responsive (test on phone)

## 🚀 Useful Commands

```powershell
# Build locally
cd frontend
npm run build

# Preview production build locally
npm run preview

# Check for TypeScript errors
npm run build

# Update dependencies
npm update

# Clear cache and rebuild
rm -rf node_modules/.vite
npm run build
```

## 🔄 Update Workflow

When you make changes:

```powershell
# 1. Make your changes
# 2. Test locally
npm run dev

# 3. Build to check for errors
npm run build

# 4. Commit and push
git add .
git commit -m "Your changes"
git push

# Vercel will automatically redeploy!
```

## 📱 URLs Summary

After deployment, update these in your documentation:

- **Frontend**: https://your-frontend.vercel.app
- **Backend**: https://herhealthbackend.vercel.app
- **Database**: Neon PostgreSQL
- **Admin Email**: admin@herhealth.com

## 🆘 Need Help?

1. Check Vercel build logs for specific errors
2. Review browser console for frontend errors
3. Test API endpoints directly using curl/Postman
4. Verify all environment variables are set correctly
5. Check [VERCEL_TROUBLESHOOTING.md](../VERCEL_TROUBLESHOOTING.md) for backend issues

---

**Ready to deploy!** 🎉

Follow Step 3 above to deploy your frontend to Vercel.
