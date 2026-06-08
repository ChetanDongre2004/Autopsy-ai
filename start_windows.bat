@echo off
echo Starting Autopsy AI...

echo Starting Backend Server...
start "Autopsy AI - Backend" cmd /c "cd backend && uvicorn main:app --reload --port 8000"

echo Starting Frontend Server...
start "Autopsy AI - Frontend" cmd /c "cd frontend && npm run dev"

echo Servers are starting in separate windows.
echo Frontend will be available at http://localhost:5173 (or similar, check the frontend window)
echo Backend API will be available at http://localhost:8000
