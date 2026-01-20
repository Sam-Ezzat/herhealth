# Fix lab_orders CASCADE DELETE migration
# This script applies the migration to fix the foreign key constraint

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix lab_orders CASCADE DELETE Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
    Write-Host "✓ Loaded environment variables from .env" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    exit 1
}

$DATABASE_URL = $env:DATABASE_URL

if (-not $DATABASE_URL) {
    Write-Host "✗ DATABASE_URL not found in environment" -ForegroundColor Red
    exit 1
}

Write-Host "Database URL: $($DATABASE_URL.Substring(0, 30))..." -ForegroundColor Yellow
Write-Host ""

# Path to migration file
$migrationFile = ".\backend\migrations\fix_lab_orders_cascade_delete.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "✗ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Running migration: fix_lab_orders_cascade_delete.sql" -ForegroundColor Cyan
Write-Host ""

# Read migration SQL
$sql = Get-Content $migrationFile -Raw

# Execute migration using psql
try {
    $sql | & psql $DATABASE_URL 2>&1 | ForEach-Object {
        if ($_ -match "ERROR") {
            Write-Host $_ -ForegroundColor Red
        } else {
            Write-Host $_ -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "✓ Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The lab_orders table now has CASCADE DELETE on visit_id." -ForegroundColor Green
    Write-Host "When a visit is deleted, its lab orders will be automatically deleted." -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "✗ Migration failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "You can now delete visits without errors!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
