@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set "EXECUTAVEL_PNPM="
for /f "delims=" %%P in ('where pnpm.cmd 2^>nul') do if not defined EXECUTAVEL_PNPM set "EXECUTAVEL_PNPM=%%P"
if defined EXECUTAVEL_PNPM goto instalar
set "EXECUTAVEL_PNPM=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
set "PATH=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback;%PATH%"
if exist "%EXECUTAVEL_PNPM%" goto instalar
echo Instale Node.js e pnpm conforme as instruções do README.md.
pause
exit /b 1
:instalar
if exist "node_modules\expo\package.json" goto executar
call "%EXECUTAVEL_PNPM%" install
if errorlevel 1 exit /b %errorlevel%
:executar
echo Iniciando Instituto Mão Amiga no navegador.
call "%EXECUTAVEL_PNPM%" web %*
exit /b %errorlevel%
