# Compare Indexes and Constraints

$LOCAL_DB = "herhealth_clinic"
$LOCAL_USER = "postgres"
$NEON_DB = "postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

Write-Host "Comparing indexes and constraints..." -ForegroundColor Cyan

$localPassword = Read-Host "Enter your local PostgreSQL password" -MaskInput
$env:PGPASSWORD = $localPassword

# Compare indexes
Write-Host "`nChecking indexes..." -ForegroundColor Yellow

$localIndexes = psql -h localhost -U $LOCAL_USER -d $LOCAL_DB -t -c "
SELECT tablename || '.' || indexname as full_name
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
"

$neonIndexes = psql $NEON_DB -t -c "
SELECT tablename || '.' || indexname as full_name
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
"

$localIndexList = $localIndexes -split "`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() }
$neonIndexList = $neonIndexes -split "`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() }

$missingIndexes = $localIndexList | Where-Object { $_ -notin $neonIndexList }

if ($missingIndexes) {
    Write-Host "`nIndexes missing in Neon:" -ForegroundColor Red
    $missingIndexes | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
} else {
    Write-Host "`nAll indexes present in Neon ✓" -ForegroundColor Green
}

# Compare foreign keys
Write-Host "`nChecking foreign keys..." -ForegroundColor Yellow

$localFKs = psql -h localhost -U $LOCAL_USER -d $LOCAL_DB -t -c "SELECT tc.table_name || '.' || tc.constraint_name as full_name FROM information_schema.table_constraints tc WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public' ORDER BY tc.table_name, tc.constraint_name;"

$neonFKs = psql $NEON_DB -t -c "SELECT tc.table_name || '.' || tc.constraint_name as full_name FROM information_schema.table_constraints tc WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public' ORDER BY tc.table_name, tc.constraint_name;"

$localFKList = $localFKs -split "`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() }
$neonFKList = $neonFKs -split "`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() }

$missingFKs = $localFKList | Where-Object { $_ -notin $neonFKList }

if ($missingFKs) {
    Write-Host "`nForeign keys missing in Neon:" -ForegroundColor Red
    $missingFKs | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
} else {
    Write-Host "`nAll foreign keys present in Neon ✓" -ForegroundColor Green
}

# Check data counts
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Data Count Comparison" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$tables = @('users', 'roles', 'patients', 'doctors', 'appointments', 'visits', 'pregnancies', 'color_code')

foreach ($table in $tables) {
    $localCount = (psql -h localhost -U $LOCAL_USER -d $LOCAL_DB -t -c "SELECT COUNT(*) FROM $table;" 2>$null).Trim()
    $neonCount = (psql $NEON_DB -t -c "SELECT COUNT(*) FROM $table;" 2>$null).Trim()
    
    if ($localCount -and $neonCount) {
        $status = if ($localCount -eq $neonCount) { "✓" } else { "⚠" }
        $color = if ($localCount -eq $neonCount) { "Green" } else { "Yellow" }
        Write-Host "$status ${table}: Local=$localCount, Neon=$neonCount" -ForegroundColor $color
    }
}

$env:PGPASSWORD = $null

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Comparison Complete!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
