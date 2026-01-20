# Update Appointment Status Constraint in Neon Database
Write-Host "Updating appointment status constraint in Neon database..." -ForegroundColor Cyan

# Get Neon database connection string from environment or use the production one
$neonDbUrl = $env:DATABASE_URL
if (-not $neonDbUrl) {
    # Use the Neon database URL from .env.production
    $neonDbUrl = "postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
    Write-Host "Using Neon database URL from configuration" -ForegroundColor Yellow
}

Write-Host "Connecting to Neon database..." -ForegroundColor Yellow
Write-Host "This will add 'no-answer' as a valid appointment status" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Enter to continue or Ctrl+C to cancel..."
Read-Host

# Execute the SQL update script
psql $neonDbUrl -f backend/update_appointment_status_constraint.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Neon database updated successfully!" -ForegroundColor Green
    Write-Host "   - Added 'no-answer' to valid appointment statuses" -ForegroundColor Green
    Write-Host "   - Valid statuses: scheduled, confirmed, cancelled, completed, no-show, no-answer" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update Neon database" -ForegroundColor Red
    exit 1
}
