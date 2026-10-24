@echo off
title DocNest - Encrypted Household Vault
echo ====================================================
echo           DocNest - Launching Application           
echo ====================================================
echo.
echo Starting FastAPI Backend (Port 8000)...
echo Starting React Vite Frontend (Port 5173)...
echo.

echo Application URL: http://localhost:5173/login
echo.

:: Open browser directly to login page
start "" http://localhost:5173/login

:: Start both backend and frontend concurrently
npm start
