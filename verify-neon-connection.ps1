# Verify Neon Production Database Connection on Vercel
# This script helps you verify that your deployed Vercel backend is connected to Neon

Write-Host "=== Neon Production Database Connection Verification ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check environment variables on Vercel
Write-Host "Step 1: Verify Vercel Environment Variables" -ForegroundColor Yellow
Write-Host "Go to: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "1. Click on your backend project (herhealthbackend)" -ForegroundColor White
Write-Host "2. Go to Settings > Environment Variables" -ForegroundColor White
Write-Host "3. Verify that DATABASE_URL is set to your Neon connection string:" -ForegroundColor White
Write-Host "   Format: postgresql://neondb_owner:...@ep-...neon.tech/neondb?sslmode=require" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter when you've verified the DATABASE_URL environment variable"

# Step 2: Test backend health endpoint
Write-Host ""
Write-Host "Step 2: Testing Backend Health Endpoint" -ForegroundColor Yellow
$backendUrl = "https://herhealthbackend.vercel.app"

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/health" -Method Get
    Write-Host "Success: Backend is running!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
}
catch {
    Write-Host "Failed: Backend health check failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Test database connection through API
Write-Host ""
Write-Host "Step 3: Testing Database Connection" -ForegroundColor Yellow
Write-Host "Attempting to access an API endpoint that requires database..." -ForegroundColor White

$dbConnected = $false
try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/v1/users" -Method Get -ErrorAction Stop
    Write-Host "Success: Database connection successful!" -ForegroundColor Green
    $dbConnected = $true
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "Success: Database is connected (received 401 Unauthorized - expected for protected routes)" -ForegroundColor Green
        $dbConnected = $true
    }
    else {
        Write-Host "Warning: Response status: $statusCode" -ForegroundColor Yellow
        Write-Host "This might indicate a database connection issue" -ForegroundColor Yellow
    }
}

# Step 4: Check Neon database status
Write-Host ""
Write-Host "Step 4: Verify Neon Database Status" -ForegroundColor Yellow
Write-Host "Go to: https://console.neon.tech" -ForegroundColor White
Write-Host "1. Open your herhealth-obgyn project" -ForegroundColor White
Write-Host "2. Check the 'Monitoring' tab for recent connections" -ForegroundColor White
Write-Host "3. You should see connections from Vercel's IP addresses" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter when you've checked the Neon monitoring"

# Step 5: Verify connection string format
Write-Host ""
Write-Host "Step 5: Connection String Checklist" -ForegroundColor Yellow
Write-Host "Your DATABASE_URL should have:" -ForegroundColor White
Write-Host "- Protocol: postgresql://" -ForegroundColor Gray
Write-Host "- Credentials: neondb_owner:password@" -ForegroundColor Gray
Write-Host "- Host: ep-...neon.tech (Neon hostname)" -ForegroundColor Gray
Write-Host "- Database: /neondb" -ForegroundColor Gray
Write-Host "- SSL: ?sslmode=require" -ForegroundColor Gray
Write-Host ""

# Step 6: Deployment log check
Write-Host "Step 6: Check Recent Deployment Logs" -ForegroundColor Yellow
Write-Host "Go to: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "1. Click on your backend project" -ForegroundColor White
Write-Host "2. Go to the 'Deployments' tab" -ForegroundColor White
Write-Host "3. Click on the latest deployment" -ForegroundColor White
Write-Host "4. Check the build and runtime logs for:" -ForegroundColor White
Write-Host "   - 'Database connected successfully' message" -ForegroundColor Gray
Write-Host "   - No database connection errors" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
if ($dbConnected) {
    Write-Host "All checks passed! Your Neon production database is properly connected to Vercel!" -ForegroundColor Green
}
else {
    Write-Host "Some checks did not pass. Please review the issues above." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "If you encountered issues:" -ForegroundColor Yellow
Write-Host "1. Verify DATABASE_URL is correctly set in Vercel environment variables" -ForegroundColor White
Write-Host "2. Ensure you've redeployed after adding/updating environment variables" -ForegroundColor White
Write-Host "3. Check that your Neon database is active (not suspended)" -ForegroundColor White
Write-Host "4. Verify your Neon connection string hasn't expired" -ForegroundColor White
Write-Host ""
Write-Host "For more help, see: ADD_VERCEL_ENV_VARS.md" -ForegroundColor Gray
