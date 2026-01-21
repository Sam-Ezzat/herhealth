# Fix Neon Production Database - Pregnancy Function Issue
# This script fixes the calculate_pregnancy_week function that's causing 500 errors

Write-Host "=" -ForegroundColor Cyan
Write-Host "Fixing Neon Production Database - Pregnancy Function" -ForegroundColor Cyan
Write-Host "=" -ForegroundColor Cyan
Write-Host ""

# Neon connection string
$CONNECTION_STRING = "postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

Write-Host "Reading SQL fix script..." -ForegroundColor Yellow
$SQL_FILE = "fix-neon-pregnancy-function.sql"

if (-not (Test-Path $SQL_FILE)) {
    Write-Host "ERROR: SQL file not found: $SQL_FILE" -ForegroundColor Red
    exit 1
}

Write-Host "Connecting to Neon production database..." -ForegroundColor Yellow
Write-Host ""

try {
    # Execute the SQL fix using psql
    $result = psql $CONNECTION_STRING -f $SQL_FILE 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Function fixed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Output:" -ForegroundColor Cyan
        Write-Host $result
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Test the patient-summaries endpoint: https://herhealthbackend.vercel.app/api/v1/visits/patient-summaries" -ForegroundColor White
        Write-Host "2. Refresh your frontend dashboard" -ForegroundColor White
    } else {
        Write-Host "ERROR: Failed to apply fix" -ForegroundColor Red
        Write-Host $result
        exit 1
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Fix completed!" -ForegroundColor Green
