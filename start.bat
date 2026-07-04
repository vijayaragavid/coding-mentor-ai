@echo off
echo ========================================
echo   Coding Mentor AI - Starting...
echo ========================================
echo.

:: Kill anything on port 3001 first (clean start)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Kill anything on port 5173 first (clean start)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo [1/2] Starting Backend Server...
start "Coding Mentor - Backend" cmd /k "cd /d "c:\Users\anand\Downloads\Coding Agent\backend" && npm run dev"

echo Waiting for backend to start...
timeout /t 6 /nobreak > nul

echo [2/2] Starting Frontend Server...
start "Coding Mentor - Frontend" cmd /k "cd /d "c:\Users\anand\Downloads\Coding Agent\frontend" && npm run dev"

echo Waiting for frontend to start...
timeout /t 6 /nobreak > nul

echo.
echo ========================================
echo   Opening app in browser...
echo ========================================
start "" "http://localhost:5173"

echo.
echo App is running at http://localhost:5173
echo.
echo To STOP: Close both terminal windows
echo ========================================
pause
