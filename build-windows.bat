@echo off
echo Building Stitching Unit ERP for Windows...
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    goto :EOF
)

:: Run the build script with Windows flag
node build-electron.js --win

echo.
if %ERRORLEVEL% EQU 0 (
    echo Build completed successfully!
    echo The installer can be found in the 'release' directory.
) else (
    echo Build failed with error code %ERRORLEVEL%.
)

pause