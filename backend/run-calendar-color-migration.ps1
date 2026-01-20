# Script to apply the Multiple Calendars color code migration
# Run this script to update your database with calendar color features

# Replace with your actual database connection string
$DB_CONNECTION = "postgresql://your_user:your_password@your_host/your_database?sslmode=require"

Write-Host "=== Multiple Calendars Feature - Database Migration ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will add color code support to doctor calendars and link appointments to calendars." -ForegroundColor Yellow
Write-Host ""
Write-Host "Changes to be made:" -ForegroundColor Green
Write-Host "  1. Add color_code, color_name, notes columns to doctor_calendars table"
Write-Host "  2. Add calendar_id column to appointments table"
Write-Host "  3. Create index on appointments.calendar_id"
Write-Host "  4. Link existing appointments to their doctor's default calendar"
Write-Host ""

$confirm = Read-Host "Do you want to proceed? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Migration cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Please enter your database connection string:" -ForegroundColor Cyan
Write-Host "Example: postgresql://user:password@host:5432/database?sslmode=require"
$DB_CONNECTION = Read-Host "Connection String"

if ([string]::IsNullOrWhiteSpace($DB_CONNECTION)) {
    Write-Host "Error: Connection string is required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Running migration..." -ForegroundColor Yellow

# Run the migration
$migrationFile = Join-Path $PSScriptRoot "database\migrations\008_add_color_code_to_calendars.sql"

if (Test-Path $migrationFile) {
    try {
        Get-Content $migrationFile | psql $DB_CONNECTION
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✓ Migration completed successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Cyan
            Write-Host "  1. Restart your backend server"
            Write-Host "  2. Go to Settings → Doctor Calendars"
            Write-Host "  3. Create/edit calendars and set colors"
            Write-Host "  4. Create new appointments and select calendars"
            Write-Host ""
        } else {
            Write-Host ""
            Write-Host "✗ Migration failed! Please check the error messages above." -ForegroundColor Red
            Write-Host ""
            exit 1
        }
    } catch {
        Write-Host ""
        Write-Host "✗ Error running migration: $_" -ForegroundColor Red
        Write-Host ""
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "✗ Migration file not found: $migrationFile" -ForegroundColor Red
    Write-Host ""
    exit 1
}
