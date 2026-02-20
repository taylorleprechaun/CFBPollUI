<#
.SYNOPSIS
    Publishes and deploys the CFBPoll API to the Linode VPS.

.DESCRIPTION
    This script automates the full API deployment process:
    1. Builds a release publish of the API
    2. Copies the published files to the server
    3. Copies the SQLite databases (data/) to the server, including rankings (cfbpoll.db) and cache (cache.db)
    4. Copies appsettings-private.json to the server
    5. Restarts the API service on the server

.PARAMETER ServerIP
    The IP address of the Linode VPS. Required.

.PARAMETER ServerUser
    The SSH user. Defaults to root.

.PARAMETER RemotePath
    The deployment path on the server. Defaults to /var/www/cfbpoll-api.

.PARAMETER SkipBuild
    Skip the dotnet publish step and deploy existing publish output.

.PARAMETER SkipData
    Skip copying the SQLite databases (cfbpoll.db and cache.db).

.EXAMPLE
    .\Deploy-API.ps1 -ServerIP "123.45.67.89"

.EXAMPLE
    .\Deploy-API.ps1 -ServerIP "123.45.67.89" -SkipBuild

.EXAMPLE
    .\Deploy-API.ps1 -ServerIP "123.45.67.89" -SkipData
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$ServerIP,

    [string]$ServerUser = "root",

    [string]$RemotePath = "/var/www/cfbpoll-api",

    [switch]$SkipBuild,

    [switch]$SkipData
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path (Join-Path $ProjectRoot "src\CFBPoll.API"))) {
    $ProjectRoot = Split-Path -Parent $PSScriptRoot
}

$ApiProject = Join-Path $ProjectRoot "src\CFBPoll.API"
$PublishDir = Join-Path $ProjectRoot "publish"
$DataDir = Join-Path $ApiProject "data"
$PrivateConfig = Join-Path $ApiProject "appsettings-private.json"
$RemoteTarget = "${ServerUser}@${ServerIP}:${RemotePath}"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "  [OK] $Message" -ForegroundColor Green
}

function Write-Skip {
    param([string]$Message)
    Write-Host "  [SKIP] $Message" -ForegroundColor Yellow
}

# Step 1: Build
Write-Step "Step 1: Publish Release Build"
if ($SkipBuild) {
    Write-Skip "Build skipped (-SkipBuild)"
    if (-not (Test-Path (Join-Path $PublishDir "CFBPoll.API.dll"))) {
        Write-Host "  [ERROR] No publish output found at $PublishDir" -ForegroundColor Red
        Write-Host "  Run without -SkipBuild first." -ForegroundColor Red
        exit 1
    }
}
else {
    dotnet publish "$ApiProject" -c Release -o "$PublishDir"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERROR] dotnet publish failed" -ForegroundColor Red
        exit 1
    }
    Write-Success "Published to $PublishDir"
}

# Step 2: Copy application files
Write-Step "Step 2: Deploy Application Files"
scp -r "${PublishDir}/*" "${RemoteTarget}/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Failed to copy application files" -ForegroundColor Red
    exit 1
}
Write-Success "Application files deployed"

# Step 3: Copy appsettings-private.json
Write-Step "Step 3: Deploy Private Configuration"
if (Test-Path $PrivateConfig) {
    scp "$PrivateConfig" "${RemoteTarget}/appsettings-private.json"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERROR] Failed to copy appsettings-private.json" -ForegroundColor Red
        exit 1
    }
    Write-Success "appsettings-private.json deployed"
}
else {
    Write-Skip "appsettings-private.json not found at $PrivateConfig"
}

# Step 4: Copy SQLite databases (rankings + cache)
Write-Step "Step 4: Deploy SQLite Databases"
if ($SkipData) {
    Write-Skip "Database copy skipped (-SkipData)"
}
elseif (Test-Path $DataDir) {
    ssh "${ServerUser}@${ServerIP}" "mkdir -p ${RemotePath}/data"
    scp -r "${DataDir}/*" "${RemoteTarget}/data/"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERROR] Failed to copy database files" -ForegroundColor Red
        exit 1
    }
    Write-Success "Databases deployed from $DataDir (cfbpoll.db + cache.db)"
}
else {
    Write-Skip "No data directory found at $DataDir"
}

# Step 5: Restart the service
Write-Step "Step 5: Restart API Service"
ssh "${ServerUser}@${ServerIP}" "sudo systemctl restart cfbpoll-api"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Failed to restart service" -ForegroundColor Red
    exit 1
}
Write-Success "cfbpoll-api service restarted"

# Done
Write-Step "Deployment Complete"
Write-Host "  Application: $RemoteTarget" -ForegroundColor Green
Write-Host "  Databases:   $(if ($SkipData) { 'skipped' } elseif (Test-Path $DataDir) { 'deployed' } else { 'not found' })" -ForegroundColor Green
Write-Host ""
