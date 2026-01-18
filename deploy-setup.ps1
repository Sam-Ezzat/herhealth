# Vercel Deployment - Quick Start Script

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  HerHealth Deployment Helper" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-Not (Test-Path ".git")) {
    Write-Host "⚠️  Git not initialized. Initializing..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git initialized" -ForegroundColor Green
}

# Generate JWT Secrets
Write-Host ""
Write-Host "🔐 Generating JWT Secrets..." -ForegroundColor Cyan
$jwt_secret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$jwt_refresh_secret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

Write-Host "JWT_SECRET: $jwt_secret" -ForegroundColor Green
Write-Host "JWT_REFRESH_SECRET: $jwt_refresh_secret" -ForegroundColor Green
Write-Host ""

# Create production .env files with secrets
Write-Host "📝 Creating production environment files..." -ForegroundColor Cyan

# Backend .env
$backendEnv = @"
NODE_ENV=production
PORT=5000
API_PREFIX=/api/v1
DATABASE_URL=
JWT_SECRET=$jwt_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=$jwt_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=
LOG_LEVEL=info
"@

Set-Content -Path "backend/.env.production" -Value $backendEnv
Write-Host "✅ Created backend/.env.production" -ForegroundColor Green

# Frontend .env
$frontendEnv = @"
VITE_API_BASE_URL=
VITE_APP_NAME=HerHealth OBGYN Clinic
"@

Set-Content -Path "frontend/.env.production" -Value $frontendEnv
Write-Host "✅ Created frontend/.env.production" -ForegroundColor Green

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Create Neon Database:" -ForegroundColor Yellow
Write-Host "   - Go to https://console.neon.tech"
Write-Host "   - Create new project: 'herhealth-obgyn'"
Write-Host "   - Copy the connection string"
Write-Host ""
Write-Host "2️⃣  Update Production .env files:" -ForegroundColor Yellow
Write-Host "   - Add DATABASE_URL to backend/.env.production"
Write-Host "   - Add VITE_API_BASE_URL to frontend/.env.production"
Write-Host ""
Write-Host "3️⃣  Push to GitHub:" -ForegroundColor Yellow
Write-Host "   git add ."
Write-Host "   git commit -m 'Ready for deployment'"
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/herhealth.git"
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "4️⃣  Deploy on Vercel:" -ForegroundColor Yellow
Write-Host "   - Go to https://vercel.com/new"
Write-Host "   - Import your GitHub repository"
Write-Host "   - Deploy backend (root: backend)"
Write-Host "   - Deploy frontend (root: frontend)"
Write-Host ""
Write-Host "See DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
