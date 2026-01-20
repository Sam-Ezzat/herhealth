# Export and Import Patient Data to Neon

$LOCAL_DB = "herhealth_clinic"
$LOCAL_USER = "postgres"
$NEON_DB = "postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

Write-Host "Exporting patient data from local database..." -ForegroundColor Cyan

# Ask for local password
$localPassword = Read-Host "Enter your local PostgreSQL password" -MaskInput
$env:PGPASSWORD = $localPassword

# Export patients and related data
Write-Host "`nExporting patients..." -ForegroundColor Yellow
pg_dump -h localhost -U $LOCAL_USER -d $LOCAL_DB -t patients --data-only --inserts -f patients_export.sql

Write-Host "Exporting doctors..." -ForegroundColor Yellow
pg_dump -h localhost -U $LOCAL_USER -d $LOCAL_DB -t doctors --data-only --inserts -f doctors_export.sql

Write-Host "Exporting appointments..." -ForegroundColor Yellow
pg_dump -h localhost -U $LOCAL_USER -d $LOCAL_DB -t appointments --data-only --inserts -f appointments_export.sql

Write-Host "Exporting visits..." -ForegroundColor Yellow
pg_dump -h localhost -U $LOCAL_USER -d $LOCAL_DB -t visits --data-only --inserts -f visits_export.sql

Write-Host "Exporting pregnancies..." -ForegroundColor Yellow
pg_dump -h localhost -U $LOCAL_USER -d $LOCAL_DB -t pregnancies --data-only --inserts -f pregnancies_export.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Data exported successfully" -ForegroundColor Green
    
    # Import to Neon
    Write-Host "`nImporting to Neon database..." -ForegroundColor Cyan
    
    if (Test-Path "patients_export.sql") {
        Write-Host "Importing patients..." -ForegroundColor Yellow
        psql $NEON_DB -f patients_export.sql
    }
    
    if (Test-Path "doctors_export.sql") {
        Write-Host "Importing doctors..." -ForegroundColor Yellow
        psql $NEON_DB -f doctors_export.sql
    }
    
    if (Test-Path "appointments_export.sql") {
        Write-Host "Importing appointments..." -ForegroundColor Yellow
        psql $NEON_DB -f appointments_export.sql
    }
    
    if (Test-Path "visits_export.sql") {
        Write-Host "Importing visits..." -ForegroundColor Yellow
        psql $NEON_DB -f visits_export.sql
    }
    
    if (Test-Path "pregnancies_export.sql") {
        Write-Host "Importing pregnancies..." -ForegroundColor Yellow
        psql $NEON_DB -f pregnancies_export.sql
    }
    
    Write-Host "`n✓ Import completed!" -ForegroundColor Green
    
    # Verify
    Write-Host "`nVerifying import..." -ForegroundColor Cyan
    psql $NEON_DB -c "SELECT COUNT(*) as patient_count FROM patients;"
    psql $NEON_DB -c "SELECT COUNT(*) as doctor_count FROM doctors;"
    psql $NEON_DB -c "SELECT COUNT(*) as appointment_count FROM appointments;"
    
    Write-Host "`nExported files saved in current directory:" -ForegroundColor Yellow
    Write-Host "  - patients_export.sql"
    Write-Host "  - doctors_export.sql"
    Write-Host "  - appointments_export.sql"
    Write-Host "  - visits_export.sql"
    Write-Host "  - pregnancies_export.sql"
    
} else {
    Write-Host "`n✗ Export failed. Check your local database connection." -ForegroundColor Red
}

# Clear password
$env:PGPASSWORD = $null
