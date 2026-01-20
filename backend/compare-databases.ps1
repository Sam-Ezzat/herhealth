# Database Schema Comparison Script
# Compares local herhealth_clinic with Neon database

$LOCAL_DB = "herhealth_clinic"
$LOCAL_USER = "postgres"
$NEON_DB = "postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Database Schema Comparison" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Set local password
$localPassword = Read-Host "Enter your local PostgreSQL password" -MaskInput
$env:PGPASSWORD = $localPassword

# Export local schema
Write-Host "Exporting local database schema..." -ForegroundColor Yellow
psql -h localhost -U $LOCAL_USER -d $LOCAL_DB -c "\d+" > local_schema.txt

# Export Neon schema
Write-Host "Exporting Neon database schema..." -ForegroundColor Yellow
psql $NEON_DB -c "\d+" > neon_schema.txt

# Get table list from local
Write-Host "`nGetting local tables..." -ForegroundColor Yellow
psql -h localhost -U $LOCAL_USER -d $LOCAL_DB -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" > local_tables.txt

# Get table list from Neon
Write-Host "Getting Neon tables..." -ForegroundColor Yellow
psql $NEON_DB -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" > neon_tables.txt

# Get column details from local
Write-Host "Getting local column details..." -ForegroundColor Yellow
psql -h localhost -U $LOCAL_USER -d $LOCAL_DB -t -c "
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
" > local_columns.txt

# Get column details from Neon
Write-Host "Getting Neon column details..." -ForegroundColor Yellow
psql $NEON_DB -t -c "
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
" > neon_columns.txt

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Comparison Results" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Compare tables
$localTables = Get-Content local_tables.txt | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() }
$neonTables = Get-Content neon_tables.txt | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() }

$missingInNeon = $localTables | Where-Object { $_ -notin $neonTables }
$extraInNeon = $neonTables | Where-Object { $_ -notin $localTables }

if ($missingInNeon) {
    Write-Host "`nTables in LOCAL but NOT in NEON:" -ForegroundColor Red
    $missingInNeon | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
} else {
    Write-Host "`nAll local tables exist in Neon" -ForegroundColor Green
}

if ($extraInNeon) {
    Write-Host "`nTables in NEON but NOT in LOCAL:" -ForegroundColor Yellow
    $extraInNeon | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}

Write-Host "`nColumn comparison saved to:" -ForegroundColor Cyan
Write-Host "  - local_columns.txt" -ForegroundColor White
Write-Host "  - neon_columns.txt" -ForegroundColor White
Write-Host "`nReview these files to find column differences." -ForegroundColor Cyan

# Clean up
$env:PGPASSWORD = $null

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Files created:" -ForegroundColor Cyan
Write-Host "  - local_schema.txt" -ForegroundColor White
Write-Host "  - neon_schema.txt" -ForegroundColor White
Write-Host "  - local_tables.txt" -ForegroundColor White
Write-Host "  - neon_tables.txt" -ForegroundColor White
Write-Host "  - local_columns.txt" -ForegroundColor White
Write-Host "  - neon_columns.txt" -ForegroundColor White
Write-Host "================================" -ForegroundColor Cyan
