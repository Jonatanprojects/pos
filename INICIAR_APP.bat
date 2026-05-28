@echo off
title NexusPOS - Arquitectura Tecnica y Diseno
color 0D

:: Ajustar tamano de consola
mode con: cols=90 lines=25

echo ==========================================================================
echo   ┌──────────────────────────────────────────────────────────────────┐
echo   │              NEXUSPOS - ARQUITECTURA Y DISENO TECNICO            │
echo   └──────────────────────────────────────────────────────────────────┘
echo ==========================================================================
echo.

:: Definir rutas
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

:: 1. VERIFICACION DE NODE.JS
echo  [1/3] Verificando entorno de ejecucion...
echo ──────────────────────────────────────────────────────────────────────────

:: Verificar si node esta disponible en el sistema
where node >nul 2>&1
if %errorlevel% neq 0 goto CHECK_PORTABLE
for /f "tokens=*" %%v in ('node -v') do echo      [+] Node.js (Sistema) detectado: %%v
goto CHECK_DEPENDENCIES

:CHECK_PORTABLE
if not exist "%PROJECT_DIR%node-portable\node.exe" goto DOWNLOAD_NODE
echo      [+] Node.js (Portable) detectado localmente.
set "PATH=%PROJECT_DIR%node-portable;%PATH%"
goto CHECK_DEPENDENCIES

:DOWNLOAD_NODE
echo      [!] Node.js no esta instalado en este sistema.
echo      [i] Para evitar pedir permisos de Administrador, descargaremos 
echo          una version portable y segura de Node.js v20 (LTS).
echo.
echo      Descargando Node.js Portable (aprox. 30MB). Por favor espere...
echo      (Esto dependera de su velocidad de internet)
echo.

:: Descargar usando PowerShell
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.19.2/node-v20.19.2-win-x64.zip' -OutFile 'node-portable.zip'"

if not exist "node-portable.zip" (
    echo.
    echo      [ERROR] No se pudo descargar Node.js portable.
    echo      Compruebe su conexion a internet e intente de nuevo.
    pause
    exit /b 1
)

echo      [+] Descarga completada con exito.
echo      [+] Extrayendo archivos...
echo.

:: Extraer usando PowerShell
powershell -Command "Expand-Archive -Path 'node-portable.zip' -DestinationPath 'node-temp' -Force"

if not exist "node-temp" (
    echo.
    echo      [ERROR] Error al extraer los archivos de Node.js.
    pause
    exit /b 1
)

:: Mover y limpiar
move "node-temp\node-v20.19.2-win-x64" "node-portable" >nul
del "node-portable.zip" >nul
rmdir /s /q "node-temp" >nul

if not exist "%PROJECT_DIR%node-portable\node.exe" (
    echo.
    echo      [ERROR] Estructura de carpetas inesperada tras la extraccion.
    pause
    exit /b 1
)

echo      [+] Node.js Portable configurado correctamente en el proyecto.
set "PATH=%PROJECT_DIR%node-portable;%PATH%"
echo.

:CHECK_DEPENDENCIES
echo.
echo  [2/3] Verificando dependencias del proyecto...
echo ──────────────────────────────────────────────────────────────────────────

:: Comprobar si existe node_modules
if exist "%PROJECT_DIR%node_modules" goto DEPENDENCIES_OK
echo      [!] La carpeta node_modules no existe.
echo      [+] Instalando dependencias (npm install)...
echo      (Solo la primera vez, esto puede tardar entre 1 y 2 minutos)
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo      [ERROR] Fallo la instalacion de dependencias.
    echo      Asegurese de tener conexion a internet estable.
    pause
    exit /b 1
)
echo.
echo      [+] Dependencias instaladas correctamente.
goto RUN_APP

:DEPENDENCIES_OK
echo      [+] Dependencias ya estan instaladas (node_modules detectado).

:RUN_APP
echo.
echo  [3/3] Iniciando aplicacion...
echo ──────────────────────────────────────────────────────────────────────────
echo.
echo  ========================================================================
echo    El servidor de desarrollo se esta iniciando.
echo    Su aplicacion estara disponible en:
echo.
echo         http://localhost:5173
echo.
echo    Esta ventana debe permanecer abierta mientras use la aplicacion.
echo    Para cerrarla, presione Ctrl + C en este terminal.
echo  ========================================================================
echo.

:: Abrir navegador automaticamente
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"

:: Ejecutar servidor de desarrollo
call npm run dev

pause
