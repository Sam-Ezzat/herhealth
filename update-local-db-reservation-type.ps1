# Update Reservation Type Constraint in Local Database
Write-Host "Updating reservation type constraint in local database..." -ForegroundColor Cyan

# IMPORTANT: Update this connection string with your local database credentials
# Format: postgresql://username:password@localhost:5432/database_name
$localDbUrl = "postgresql://postgres:postgres123@localhost:5432/herhealth_clinic"

Write-Host "Connection String: $localDbUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "If the connection string above is incorrect, please update it in this file" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Enter to continue or Ctrl+C to cancel..."
Read-Host

# Execute the SQL update script
psql $localDbUrl -f backend/update_reservation_type_constraint.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Local database updated successfully!" -ForegroundColor Green
    Write-Host "   - Dropped old constraint" -ForegroundColor Green
    Write-Host "   - Added new constraint with: Clinic, samar_phone, Habiba_phone, Doctor, website" -ForegroundColor Green
    Write-Host "   - Updated existing 'phone' records to 'samar_phone'" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update local database" -ForegroundColor Red
    exit 1
}
