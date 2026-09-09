@echo off
setlocal
cd /d "%~dp0"
echo =============================================
echo   Wiki one-click update  (lianhuay.top)
echo =============================================
git add -A
git commit -m "site update %date% %time%" >nul 2>&1
if errorlevel 1 (
    echo [No local changes to update - done.]
    goto :end
)
set GIT_SSH_COMMAND=ssh -o BatchMode=yes
echo [1/2] Backup to GitHub ...
git push origin main
if errorlevel 1 echo [WARN] GitHub push failed - server deploy still continues
echo [2/2] Deploy to server and rebuild ...
git push deploy main
if errorlevel 1 (
    echo [FAILED] Push to server failed. Check network or run: git push deploy main
    goto :end
)
echo.
echo [DONE] Site updated:  https://lianhuay.top
:end
echo.
pause
