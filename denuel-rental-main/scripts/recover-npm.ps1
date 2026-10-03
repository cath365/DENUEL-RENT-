<#
PowerShell script: recover-npm.ps1
Purpose: Recover from npm ECOMPROMISED / lock issues, reinstall dependencies, and run unit tests.
Usage: Open an Administrator PowerShell (if possible), cd to project root and run:
  ./scripts/recover-npm.ps1
#>

param(
  [switch]$AutoConfirm
)

function ExitOnError($msg) {
  Write-Error $msg
  exit 1
}

Write-Host "=== DENUEL APP: NPM Recovery Script ===" -ForegroundColor Cyan

if (-not $AutoConfirm) {
  $answer = Read-Host "This will clean npm cache, remove node_modules and package-lock.json, reinstall dependencies and run unit tests. Continue? (y/n)"
  if ($answer.ToLower() -ne 'y') { Write-Host "Aborted by user."; exit 0 }
}

try {
  Write-Host "Checking npm & node versions..."
  node -v
  npm -v
} catch {
  ExitOnError "Failed to read node/npm versions. Ensure Node is installed and available in PATH."
}

# Step 1: Clean npm cache
Write-Host "Cleaning npm cache (force)..." -ForegroundColor Yellow
npm cache clean --force
if ($LASTEXITCODE -ne 0) { Write-Host "npm cache clean returned non-zero code: $LASTEXITCODE" -ForegroundColor Red }

# Step 2: Verify cache
Write-Host "Verifying npm cache..." -ForegroundColor Yellow
npm cache verify
if ($LASTEXITCODE -ne 0) { Write-Host "npm cache verify returned non-zero code: $LASTEXITCODE" -ForegroundColor Yellow }

# Step 3: Remove node_modules and package-lock.json
if (Test-Path -Path "node_modules") {
  Write-Host "Removing node_modules..." -ForegroundColor Yellow
  Remove-Item -Recurse -Force node_modules -ErrorAction Stop
} else { Write-Host "No node_modules found." }

if (Test-Path -Path "package-lock.json") {
  Write-Host "Removing package-lock.json..." -ForegroundColor Yellow
  Remove-Item -Force package-lock.json -ErrorAction Stop
} else { Write-Host "No package-lock.json found." }

# Step 4: Show recent npm logs (optional)
$logsPath = Join-Path $env:LOCALAPPDATA "npm-cache\_logs"
if (Test-Path $logsPath) {
  $latestLog = Get-ChildItem -Path $logsPath -Filter "*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($latestLog) {
    Write-Host "Found latest npm debug log: $($latestLog.FullName)" -ForegroundColor Green
    Write-Host "--- tail of log ---"
    Get-Content $latestLog.FullName -Tail 50
    Write-Host "--- end of log ---"
  }
}

# Step 5: Reinstall deps
Write-Host "Installing dependencies (npm install)..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { ExitOnError "npm install failed with code $LASTEXITCODE. Inspect the output above." }

# Step 6: Run unit tests
Write-Host "Running unit tests (npm run test:unit)..." -ForegroundColor Cyan
npm run test:unit
if ($LASTEXITCODE -ne 0) { Write-Host "Unit tests finished with non-zero exit code: $LASTEXITCODE" -ForegroundColor Red }

Write-Host "Recovery script completed. If issues persist, paste the npm debug log path above or share the latest errors." -ForegroundColor Green

exit 0
