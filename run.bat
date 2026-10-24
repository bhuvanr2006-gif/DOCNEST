@echo off
title DocNest - Encrypted Household Vault
echo ====================================================
echo           DocNest - Launching Application           
echo ====================================================
echo.
echo Starting FastAPI Backend (Port 8000)...
echo Starting React Vite Frontend (Port 5173)...
echo.

:: Open browser after a brief pause so servers initialize
start "" http://localhost:5173

:: Start both backend and frontend concurrently
npm start
