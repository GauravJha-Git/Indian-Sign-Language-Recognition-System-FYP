@echo off
echo ===================================================
echo Starting Indian Sign Language Recognition System...
echo ===================================================

echo.
echo Starting Backend API (FastAPI)...
start "Backend Server" cmd /k ".\.venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo.
echo Starting Frontend UI (React/Vite)...
cd frontend
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting up!
echo - Backend API will be available at: http://localhost:8000
echo - Frontend UI will be available at: http://localhost:5173
echo.
echo You can close the newly opened command windows to stop the servers.
pause
