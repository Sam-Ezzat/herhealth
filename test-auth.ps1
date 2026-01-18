# Test Authentication API

Write-Host "Testing Authentication API..." -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n1. Health Check:" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri 'http://localhost:5000/api/v1/health' -Method Get
    Write-Host "Success: $($health | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Login
Write-Host "`n2. Login:" -ForegroundColor Yellow
try {
    $loginBody = @{
        username = 'admin'
        password = 'admin123'
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/v1/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
    Write-Host "Success: Login successful" -ForegroundColor Green
    Write-Host "User: $($loginResponse.data.user.username) - $($loginResponse.data.user.full_name)" -ForegroundColor Green
    Write-Host "Token: $($loginResponse.data.token.Substring(0, 20))..." -ForegroundColor Green
    
    $token = $loginResponse.data.token
    
    # Test 3: Get Current User
    Write-Host "`n3. Get Current User (Protected Route):" -ForegroundColor Yellow
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $userResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/v1/auth/me' -Method Get -Headers $headers
    Write-Host "Success: $($userResponse.data.username) - $($userResponse.data.email)" -ForegroundColor Green
    
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 4: Register New User
Write-Host "`n4. Register New User:" -ForegroundColor Yellow
try {
    # First, get the doctor role ID
    $roles = Invoke-RestMethod -Uri 'http://localhost:5000/api/v1/auth/roles' -Method Get -ErrorAction SilentlyContinue
    
    $registerBody = @{
        username = 'testdoctor'
        password = 'password123'
        fullName = 'Dr. Test User'
        roleId = '00000000-0000-0000-0000-000000000002'  # Placeholder - should get from roles
        email = 'testdoctor@herhealth.com'
        phone = '555-1234'
    } | ConvertTo-Json
    
    $registerResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/v1/auth/register' -Method Post -Body $registerBody -ContentType 'application/json'
    Write-Host "Success: User registered - $($registerResponse.data.user.username)" -ForegroundColor Green
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host "`nAll tests completed!" -ForegroundColor Cyan
