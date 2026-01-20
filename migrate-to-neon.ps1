# Quick Database Migration Script

# Export local database
Write-Host "Exporting local database..." -ForegroundColor Cyan
$env:PGPASSWORD = Read-Host "Enter your local PostgreSQL password" -AsSecureString | ConvertFrom-SecureString
pg_dump -h localhost -U postgres -d obgyn_clinic -f local_backup.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Local database exported to local_backup.sql" -ForegroundColor Green
    
    # Import to Neon
    Write-Host "`nImporting to Neon database..." -ForegroundColor Cyan
    $NEON_DB = "postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
    
    psql $NEON_DB -f local_backup.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database imported to Neon successfully!" -ForegroundColor Green
        
        # Verify
        Write-Host "`nVerifying migration..." -ForegroundColor Cyan
        psql $NEON_DB -c "SELECT COUNT(*) as user_count FROM users;"
        psql $NEON_DB -c "SELECT COUNT(*) as patient_count FROM patients;"
        psql $NEON_DB -c "SELECT COUNT(*) as appointment_count FROM appointments;"
        
        Write-Host "`nMigration completed!" -ForegroundColor Green
    } else {
        Write-Host "✗ Import failed. Check error messages above." -ForegroundColor Red
    }
} else {
    Write-Host "✗ Export failed. Make sure PostgreSQL is running and credentials are correct." -ForegroundColor Red
}

Write-Host "`nBackup file saved as: local_backup.sql" -ForegroundColor Yellow
