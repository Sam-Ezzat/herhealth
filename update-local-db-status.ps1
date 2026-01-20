# Update Appointment Status Constraint in Local Database
Write-Host "Updating appointment status constraint in local database..." -ForegroundColor Cyan

$localDbUrl = "postgresql://postgres:postgres123@localhost:5432/herhealth_clinic"

Write-Host "Connection String: $localDbUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will add 'no-answer' as a valid appointment status" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Enter to continue or Ctrl+C to cancel..."
Read-Host

# Execute the SQL update script
psql $localDbUrl -f backend/update_appointment_status_constraint.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Local database updated successfully!" -ForegroundColor Green
    Write-Host "   - Added 'no-answer' to valid appointment statuses" -ForegroundColor Green
    Write-Host "   - Valid statuses: scheduled, confirmed, cancelled, completed, no-show, no-answer" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update local database" -ForegroundColor Red
    exit 1
}
