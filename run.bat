@echo off
title EV-Share - P2P Home EV Charger Rental Network
echo ========================================================
echo Starting EV-Share Full-Stack Web Platform...
echo Node Server listening on http://localhost:5000 and http://localhost:3000
echo ========================================================
start "" http://localhost:5000
node server.js
pause
