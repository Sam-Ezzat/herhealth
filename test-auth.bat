@echo off
echo Testing Authentication API...

echo.
echo 1. Health Check:
curl -s http://localhost:5000/api/v1/health

echo.
echo.
echo 2. Login (admin):
curl -s -X POST http://localhost:5000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}" > login_response.json
type login_response.json

echo.
echo.
echo Done! Check login_response.json for the full response.
