# ===========================================
# Flashcards — Automatisk installation (Windows)
# ===========================================
# Användaren klistrar in EN rad i PowerShell:
#   irm https://raw.githubusercontent.com/viggofredriksson-lgtm/viggos-flashcard-app/main/install.ps1 | iex

$ErrorActionPreference = "Stop"

# Färger
function Print-Step($num, $text) {
    Write-Host ""
    Write-Host "  [$num/4] $text" -ForegroundColor Green
    Write-Host ""
}

function Print-Info($text) {
    Write-Host "  > $text" -ForegroundColor Yellow
}

function Print-Success($text) {
    Write-Host "  ✓ $text" -ForegroundColor Green
}

function Print-Error($text) {
    Write-Host "  ✗ $text" -ForegroundColor Red
}

Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor White
Write-Host "  ║     Flashcards — Installation        ║" -ForegroundColor White
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor White
Write-Host ""
Write-Host "  Installationen tar ca 3-5 minuter." -ForegroundColor DarkGray
Write-Host ""

# -------------------------------------------
# Steg 1: Node.js
# -------------------------------------------
Print-Step 1 "Kollar Node.js..."

$nodeInstalled = $false
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Print-Success "Redan installerat ($nodeVersion)."
        $nodeInstalled = $true
    }
} catch {}

if (-not $nodeInstalled) {
    # Kolla om Node finns i vanliga installationsplatser
    $nodePaths = @(
        "$env:ProgramFiles\nodejs\node.exe",
        "$env:LOCALAPPDATA\fnm_multishells\*\node.exe",
        "$env:USERPROFILE\.local\node\node.exe"
    )

    foreach ($p in $nodePaths) {
        $found = Get-Item $p -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $nodeDir = Split-Path $found.FullName
            $env:PATH = "$nodeDir;$env:PATH"
            $nodeInstalled = $true
            Print-Success "Hittade Node.js i $nodeDir."
            break
        }
    }
}

if (-not $nodeInstalled) {
    Print-Info "Installerar Node.js..."

    $NODE_VERSION = "v22.14.0"
    $NODE_URL = "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-win-x64.zip"
    $NODE_DIR = "$env:USERPROFILE\.local\node"
    $TEMP_ZIP = "$env:TEMP\node.zip"
    $TEMP_EXTRACT = "$env:TEMP\node-extract"

    Print-Info "Laddar ner Node.js $NODE_VERSION..."
    Invoke-WebRequest -Uri $NODE_URL -OutFile $TEMP_ZIP -UseBasicParsing

    Print-Info "Packar upp..."
    if (Test-Path $TEMP_EXTRACT) { Remove-Item -Recurse -Force $TEMP_EXTRACT }
    Expand-Archive -Path $TEMP_ZIP -DestinationPath $TEMP_EXTRACT

    # Hitta den uppackade mappen (namnet kan variera)
    $extractedFolder = Get-ChildItem -Path $TEMP_EXTRACT -Directory | Select-Object -First 1
    if (-not $extractedFolder) {
        Print-Error "Kunde inte packa upp Node.js."
        Read-Host "Tryck Enter for att stanga"
        exit 1
    }

    # Skapa .local-mappen om den inte finns
    $localDir = Split-Path $NODE_DIR
    if (-not (Test-Path $localDir)) { New-Item -ItemType Directory -Path $localDir -Force | Out-Null }

    if (Test-Path $NODE_DIR) { Remove-Item -Recurse -Force $NODE_DIR }
    Move-Item $extractedFolder.FullName $NODE_DIR

    Remove-Item $TEMP_ZIP -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force $TEMP_EXTRACT -ErrorAction SilentlyContinue

    # Lägg till i PATH för denna session
    $env:PATH = "$NODE_DIR;$env:PATH"

    # Lägg till i PATH permanent (för användaren)
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*\.local\node*") {
        [Environment]::SetEnvironmentVariable("Path", "$NODE_DIR;$currentPath", "User")
    }

    Print-Success "Node.js installerat ($(node --version))."
}

# -------------------------------------------
# Steg 2: Ladda ner appen
# -------------------------------------------
Print-Step 2 "Laddar ner appen..."

$INSTALL_DIR = "$env:USERPROFILE\Desktop\viggos-flashcard-app"

if (Test-Path $INSTALL_DIR) {
    Print-Info "Mappen finns redan. Uppdaterar..."
    Set-Location $INSTALL_DIR
    git pull origin main 2>$null
} else {
    # Kolla om git finns
    try {
        git --version | Out-Null
    } catch {
        Print-Error "Git hittades inte. Installera Git fran https://git-scm.com/download/win och kor scriptet igen."
        Read-Host "Tryck Enter for att stanga"
        exit 1
    }

    Print-Info "Laddar ner fran internet..."
    git clone --quiet --depth 1 https://github.com/viggofredriksson-lgtm/viggos-flashcard-app.git $INSTALL_DIR
    Set-Location $INSTALL_DIR
}

Print-Success "Appen nedladdad till skrivbordet."

# Skapa .env om den saknas
if (-not (Test-Path "$INSTALL_DIR\.env")) {
    'DATABASE_URL="file:./dev.db"' | Out-File -FilePath "$INSTALL_DIR\.env" -Encoding utf8
}

# -------------------------------------------
# Steg 3: Installera paket och databas
# -------------------------------------------
Print-Step 3 "Installerar allt appen behover..."

Print-Info "Installerar paket..."
npm ci --loglevel=error 2>&1 | Select-Object -Last 1
Print-Success "Paket installerade."

Print-Info "Satter upp databasen..."
npx prisma generate 2>$null | Out-Null
npx prisma db push 2>$null | Out-Null
Print-Success "Databasen redo."

# -------------------------------------------
# Steg 4: Skapa genväg på skrivbordet
# -------------------------------------------
Print-Step 4 "Skapar genvag pa skrivbordet..."

$batContent = @'
@echo off
cls
set "APP_DIR=%USERPROFILE%\Desktop\viggos-flashcard-app"

if not exist "%APP_DIR%" (
    echo.
    echo Appen hittades inte!
    echo Kor installationen igen.
    echo.
    pause
    exit /b 1
)

cd /d "%APP_DIR%"

:: Se till att node finns i PATH
if exist "%USERPROFILE%\.local\node\node.exe" (
    set "PATH=%USERPROFILE%\.local\node;%PATH%"
)

where npm >nul 2>nul
if errorlevel 1 (
    echo.
    echo Node.js hittades inte. Kor installationen igen.
    echo.
    pause
    exit /b 1
)

:: Kolla om appen redan ar igang
netstat -ano | findstr ":3000.*LISTENING" >nul 2>nul
if not errorlevel 1 (
    echo.
    echo Appen verkar redan vara igang!
    start http://localhost:3000
    echo.
    pause
    exit /b 0
)

echo.
echo ══════════════════════════════════════
echo   Flashcards startar...
echo ══════════════════════════════════════
echo.
echo   Webblasaren oppnas automatiskt.
echo.
echo   FOR ATT STANGA APPEN:
echo   Stang bara det har fonstret.
echo.
echo ══════════════════════════════════════
echo.

:: Oppna webblasaren nar servern ar redo
start /b cmd /c "for /L %%i in (1,1,30) do (curl -s http://localhost:3000 >nul 2>nul && start http://localhost:3000 && exit /b || timeout /t 1 /nobreak >nul)"

npm run dev
'@

$batPath = "$env:USERPROFILE\Desktop\starta-flashcards.bat"
$batContent | Out-File -FilePath $batPath -Encoding ascii

Print-Success "Genvag skapad: 'starta-flashcards' pa skrivbordet."

# -------------------------------------------
# Klart!
# -------------------------------------------
Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║        Installation klar!            ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Nasta gang du vill plugga:" -ForegroundColor White
Write-Host "  Dubbelklicka 'starta-flashcards' pa skrivbordet." -ForegroundColor White
Write-Host "  Webblasaren oppnas automatiskt." -ForegroundColor White
Write-Host ""

$reply = Read-Host "  Vill du starta appen nu? (j/n)"
if ($reply -match "^[jJyY]$") {
    Write-Host ""
    Print-Info "Startar appen..."
    Start-Process cmd -ArgumentList "/c", "timeout /t 10 /nobreak >nul && start http://localhost:3000" -WindowStyle Hidden
    npm run dev
}
