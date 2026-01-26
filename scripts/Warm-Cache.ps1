<#
.SYNOPSIS
    Warms the CFBPoll API cache by fetching historical data for all seasons and weeks.

.DESCRIPTION
    This script calls the API endpoints for every year/week combination from 2002 to the
    current year, which populates the persistent cache with historical data that will
    never expire.

.PARAMETER BaseUrl
    The base URL of the API. Defaults to http://localhost:5000.

.PARAMETER StartYear
    The first year to fetch. Defaults to 2010.

.PARAMETER EndYear
    The last year to fetch. Defaults to the previous year (current year - 1) since
    the current season's data may not be available yet.

.PARAMETER DelayMs
    Delay between API calls in milliseconds. Defaults to 100.

.EXAMPLE
    .\Warm-Cache.ps1

.EXAMPLE
    .\Warm-Cache.ps1 -BaseUrl "https://myapi.com" -StartYear 2020 -EndYear 2024
#>

param(
    [string]$BaseUrl = "http://localhost:5000",
    [int]$StartYear = 2010,
    [int]$EndYear = (Get-Date).Year - 1,
    [int]$DelayMs = 1000
)

$ErrorActionPreference = "Stop"

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Write-Progress-Banner {
    param([string]$Message)
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Cyan
}

function Invoke-ApiCall {
    param(
        [string]$Url,
        [string]$Description
    )

    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 120
        Write-Host "  [OK] $Description" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "  [FAIL] $Description - $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Progress-Banner "CFBPoll Cache Warming Script"
Write-Host "Base URL: $BaseUrl"
Write-Host "Year Range: $StartYear - $EndYear"
Write-Host "Delay: ${DelayMs}ms between calls"
Write-Host ""

$totalSeasons = $EndYear - $StartYear + 1
$currentSeason = 0
$totalWeeksCached = 0
$failedCalls = 0
$startTime = Get-Date

for ($year = $EndYear; $year -ge $StartYear; $year--) {
    $currentSeason++
    Write-Progress-Banner "Season $year ($currentSeason of $totalSeasons)"

    $weeksUrl = "$BaseUrl/api/seasons/$year/weeks"
    Write-Host "Fetching weeks for $year..." -ForegroundColor Yellow
    Write-Host $weeksUrl

    $weeksResponse = Invoke-ApiCall -Url $weeksUrl -Description "Calendar for $year"

    if ($null -eq $weeksResponse) {
        $failedCalls++
        Write-Host "  Skipping season $year due to calendar fetch failure" -ForegroundColor Yellow
        continue
    }

    Start-Sleep -Milliseconds $DelayMs

    $weeks = $weeksResponse.weeks
    if ($null -eq $weeks -or $weeks.Count -eq 0) {
        Write-Host "  No weeks found for season $year" -ForegroundColor Yellow
        continue
    }

    Write-Host "Found $($weeks.Count) weeks for season $year" -ForegroundColor Yellow
    Write-Host ""

    foreach ($week in $weeks) {
        $weekNumber = $week.weekNumber
        $weekLabel = $week.label

        $rankingsUrl = "$BaseUrl/api/rankings?season=$year&week=$weekNumber"
        Write-Host $rankingsUrl
        $result = Invoke-ApiCall -Url $rankingsUrl -Description "Week $weekNumber ($weekLabel)"

        if ($null -eq $result) {
            $failedCalls++
        }
        else {
            $totalWeeksCached++
        }

        Start-Sleep -Milliseconds $DelayMs
    }
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Progress-Banner "Cache Warming Complete"
Write-Host "Duration: $($duration.ToString('hh\:mm\:ss'))"
Write-Host "Seasons processed: $totalSeasons"
Write-Host "Weeks cached: $totalWeeksCached" -ForegroundColor Green
Write-Host "Failed calls: $failedCalls" -ForegroundColor $(if ($failedCalls -gt 0) { "Red" } else { "Green" })
Write-Host ""
