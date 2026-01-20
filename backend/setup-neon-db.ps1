# Setup Neon Database - Run All Migrations

$NEON_DB = "postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

Write-Host "Setting up Neon Database..." -ForegroundColor Cyan
Write-Host ""

# Migration files in order
$migrations = @(
    "src/database/migrations/001_initial_schema.sql",
    "src/database/migrations/002_seed_admin.sql",
    "src/database/migrations/007_add_reservation_type.sql",
    "database/migrations/007_create_calendar_tables.sql",
    "database/migrations/008_insert_whatsapp_templates.sql",
    "database/migrations/009_add_template_id_to_whatsapp_messages.sql",
    "database/migrations/010_add_created_by_to_appointments.sql",
    "migrations/create_pregnancy_journey_system.sql",
    "add_color_code_columns.sql",
    "add_is_closed_column.sql"
)

$success = 0
$failed = 0

foreach ($migration in $migrations) {
    if (Test-Path $migration) {
        Write-Host "Running: $migration" -ForegroundColor Yellow
        psql $NEON_DB -f $migration
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Success" -ForegroundColor Green
            $success++
        } else {
            Write-Host "  Failed (may be expected if already exists)" -ForegroundColor Red
            $failed++
        }
    } else {
        Write-Host "Skipping: $migration (not found)" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Migration Summary:" -ForegroundColor Cyan
Write-Host "  Success: $success" -ForegroundColor Green
Write-Host "  Failed: $failed" -ForegroundColor Red
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Verify
Write-Host "Verifying database setup..." -ForegroundColor Cyan
psql $NEON_DB -c "\dt"
Write-Host ""
psql $NEON_DB -c "SELECT COUNT(*) as user_count FROM users;"

Write-Host ""
Write-Host "Database setup complete!" -ForegroundColor Green
Write-Host "Default admin login:" -ForegroundColor Yellow
Write-Host "  Email: admin@herhealth.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
