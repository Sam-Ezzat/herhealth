# Visit Payment System Migration Script
# Run this to apply the database changes for the payment feature

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Visit Payment System Migration" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your database connection string." -ForegroundColor Yellow
    exit 1
}

# Load environment variables
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
        $name = $matches[1]
        $value = $matches[2]
        Set-Item -Path "env:$name" -Value $value
    }
}

$DATABASE_URL = $env:DATABASE_URL

if (-not $DATABASE_URL) {
    Write-Host "ERROR: DATABASE_URL not found in .env file!" -ForegroundColor Red
    exit 1
}

Write-Host "Database URL found: $($DATABASE_URL.Substring(0, [Math]::Min(30, $DATABASE_URL.Length)))..." -ForegroundColor Green
Write-Host ""

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlPath) {
    Write-Host "ERROR: PostgreSQL client (psql) not found!" -ForegroundColor Red
    Write-Host "Please install PostgreSQL or ensure psql is in your PATH." -ForegroundColor Yellow
    exit 1
}

Write-Host "Running migration: 007_visit_payments.sql" -ForegroundColor Yellow
Write-Host ""

# Run the migration
$migrationFile = "src\database\migrations\007_visit_payments.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

try {
    $env:PGPASSWORD = ""
    psql $DATABASE_URL -f $migrationFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "====================================" -ForegroundColor Green
        Write-Host "Migration completed successfully!" -ForegroundColor Green
        Write-Host "====================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "The visit_payments table has been created with:" -ForegroundColor Cyan
        Write-Host "  - visit_id (FK to visits)" -ForegroundColor White
        Write-Host "  - patient_id (FK to patients)" -ForegroundColor White
        Write-Host "  - amount (decimal)" -ForegroundColor White
        Write-Host "  - method (Cash, Instapay, No Payment, ReConsultation)" -ForegroundColor White
        Write-Host "  - notes (optional)" -ForegroundColor White
        Write-Host "  - payment_date" -ForegroundColor White
        Write-Host "  - created_by (FK to users)" -ForegroundColor White
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Restart your backend server: npm run dev" -ForegroundColor White
        Write-Host "  2. Restart your frontend: npm run dev" -ForegroundColor White
        Write-Host "  3. Navigate to a patient detail page and click 'Add Payment'" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "ERROR: Migration failed!" -ForegroundColor Red
        Write-Host "Please check the error messages above." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: An exception occurred!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
