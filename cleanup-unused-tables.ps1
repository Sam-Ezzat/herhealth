# Cleanup Lab Orders, Imaging, and Prescriptions
# This script deletes all records from these tables so you can delete visits

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Cleanup: Lab Orders, Imaging, Prescriptions" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Change to the backend directory if not already there
$backendPath = Join-Path $PSScriptRoot "backend"
if (Test-Path $backendPath) {
    Set-Location $backendPath
    Write-Host "Changed directory to: $backendPath" -ForegroundColor Gray
}

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
} elseif (Test-Path ../.env) {
    Get-Content ../.env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
    Write-Host "✓ Loaded environment variables from ../.env" -ForegroundColor Green
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

# Find the cleanup SQL file
$sqlFile = $null
if (Test-Path "..\cleanup-lab-imaging-prescriptions.sql") {
    $sqlFile = "..\cleanup-lab-imaging-prescriptions.sql"
} elseif (Test-Path "cleanup-lab-imaging-prescriptions.sql") {
    $sqlFile = "cleanup-lab-imaging-prescriptions.sql"
}

if (-not $sqlFile) {
    Write-Host "✗ Cleanup SQL file not found" -ForegroundColor Red
    exit 1
}

Write-Host "⚠️  WARNING: This will delete ALL records from:" -ForegroundColor Yellow
Write-Host "  - lab_results" -ForegroundColor Yellow
Write-Host "  - lab_orders" -ForegroundColor Yellow
Write-Host "  - imaging" -ForegroundColor Yellow
Write-Host "  - prescription_items" -ForegroundColor Yellow
Write-Host "  - prescriptions" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Are you sure you want to continue? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "Operation cancelled." -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Host "Running cleanup script..." -ForegroundColor Cyan
Write-Host ""

# Read and execute SQL
$sql = Get-Content $sqlFile -Raw

try {
    $output = $sql | & psql $DATABASE_URL 2>&1
    
    $output | ForEach-Object {
        $line = $_.ToString()
        if ($line -match "ERROR") {
            Write-Host $line -ForegroundColor Red
        } elseif ($line -match "DELETE|COUNT") {
            Write-Host $line -ForegroundColor Green
        } else {
            Write-Host $line -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "✓ Cleanup completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now delete visits without errors!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "✗ Cleanup failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
