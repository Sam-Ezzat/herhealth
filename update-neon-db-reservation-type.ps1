# Update Reservation Type Constraint in Neon Database
Write-Host "Updating reservation type constraint in Neon database..." -ForegroundColor Cyan

# Get Neon database connection string from environment or use the production one
$neonDbUrl = $env:DATABASE_URL
if (-not $neonDbUrl) {
    # Use the Neon database URL from .env.production
    $neonDbUrl = "postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
    Write-Host "Using Neon database URL from configuration" -ForegroundColor Yellow
}

Write-Host "Connecting to Neon database..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Enter to continue or Ctrl+C to cancel..."
Read-Host

# Execute the SQL update script
psql $neonDbUrl -f backend/update_reservation_type_constraint.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Neon database updated successfully!" -ForegroundColor Green
    Write-Host "   - Dropped old constraint" -ForegroundColor Green
    Write-Host "   - Added new constraint with: Clinic, samar_phone, Habiba_phone, Doctor, website" -ForegroundColor Green
    Write-Host "   - Updated existing 'phone' records to 'samar_phone'" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update Neon database" -ForegroundColor Red
    exit 1
}
