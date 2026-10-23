@echo off
rem Wrapper for the Windows scheduled task: Task Scheduler starts in System32,
rem and daily-check.mjs reads its data files relative to the repo root.
cd /d "%~dp0"
if not exist "logs" mkdir "logs"
"C:\Program Files\nodejs\node.exe" daily-check.mjs >> "logs\daily-check.log" 2>&1
exit /b %ERRORLEVEL%
