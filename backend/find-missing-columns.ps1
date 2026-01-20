# Detailed Column Comparison Script

$LOCAL_DB = "herhealth_clinic"
$LOCAL_USER = "postgres"
$NEON_DB = "postgresql://neondb_owner:npg_MnmEP8WUJBy1@ep-lucky-cake-aghkbcia-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

Write-Host "Analyzing column differences..." -ForegroundColor Cyan

$localPassword = Read-Host "Enter your local PostgreSQL password" -MaskInput
$env:PGPASSWORD = $localPassword

# Get detailed column info from local
$localColumns = psql -h localhost -U $LOCAL_USER -d $LOCAL_DB -t -A -F"|" -c "
SELECT 
    table_name || '.' || column_name as full_column,
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
"

# Get detailed column info from Neon
$neonColumns = psql $NEON_DB -t -A -F"|" -c "
SELECT 
    table_name || '.' || column_name as full_column,
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
"

$localColumnList = $localColumns -split "`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object { ($_ -split "\|")[0].Trim() }
$neonColumnList = $neonColumns -split "`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object { ($_ -split "\|")[0].Trim() }

$missingInNeon = $localColumnList | Where-Object { $_ -notin $neonColumnList }

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Missing Columns in Neon" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

if ($missingInNeon) {
    $missingInNeon | ForEach-Object {
        $parts = $_ -split "\."
        Write-Host "  Table: $($parts[0])" -ForegroundColor Yellow
        Write-Host "  Column: $($parts[1])" -ForegroundColor Red
        Write-Host ""
    }
    
    Write-Host "`nGenerating ALTER TABLE statements..." -ForegroundColor Cyan
    
    $alterStatements = @()
    foreach ($missing in $missingInNeon) {
        $parts = $missing -split "\."
        $tableName = $parts[0]
        $columnName = $parts[1]
        
        # Find the column details
        $detail = $localColumns -split "`n" | Where-Object { $_ -match "^$missing\|" } | Select-Object -First 1
        if ($detail) {
            $fields = $detail -split "\|"
            $dataType = $fields[3]
            $maxLength = $fields[4]
            $nullable = $fields[5]
            $default = $fields[6]
            
            $fullType = $dataType
            if ($maxLength -and $maxLength -ne "") {
                $fullType = "$dataType($maxLength)"
            }
            
            $alterStatements += "ALTER TABLE $tableName ADD COLUMN IF NOT EXISTS $columnName $fullType;"
        }
    }
    
    $alterStatements | Out-File -FilePath "fix_missing_columns.sql"
    Write-Host "`nSQL fix saved to: fix_missing_columns.sql" -ForegroundColor Green
    Write-Host "`nTo apply fixes, run:" -ForegroundColor Yellow
    Write-Host "  psql `"$NEON_DB`" -f fix_missing_columns.sql" -ForegroundColor White
    
} else {
    Write-Host "`nNo missing columns found! Schemas match." -ForegroundColor Green
}

$env:PGPASSWORD = $null
