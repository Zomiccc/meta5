@echo off
REM Launches PAKFX backend + frontend in detached windows, logging to files.
start "PAKFX Backend" cmd /k "cd /d d:\Projects\MetaAi\apps\backend && set DATABASE_URL=postgresql://postgres:12345@127.0.0.1:5432/brokerdb && node dist\main.js > d:\Projects\MetaAi\backend.log 2>&1"
timeout /t 2 /nobreak >nul
start "PAKFX Frontend" cmd /k "cd /d d:\Projects\MetaAi\apps\frontend && node d:\Projects\MetaAi\node_modules\next\dist\bin\next dev -p 3000 > d:\Projects\MetaAi\frontend.log 2>&1"
echo Launched both servers in detached windows.
