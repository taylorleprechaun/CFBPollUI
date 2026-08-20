<#
.SYNOPSIS
    Updates the auto-generated test-count/coverage block in README.md from fresh test output.

.DESCRIPTION
    Reads backend TRX + Cobertura output (from `dotnet test --collect:"XPlat Code Coverage"
    --logger trx`) and frontend Vitest JSON test-report + coverage-summary output (from
    `vitest run --coverage --reporter=json --outputFile.json=...`), computes the badge/table
    numbers, and replaces the content between the `<!-- coverage:start -->` /
    `<!-- coverage:end -->` markers in README.md. Intended to run in CI after both test suites
    have already executed with coverage collection enabled; fails loudly (non-zero exit) if any
    expected input is missing so a broken pipeline doesn't silently leave the README stale.

.EXAMPLE
    ./.github/scripts/Update-ReadmeCoverage.ps1
#>

#Requires -Version 7

param(
    [string]$RepoRoot = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
)

$ErrorActionPreference = 'Stop'

# --- Backend: TRX test counts ---
$trxFiles = Get-ChildItem -Path "$RepoRoot/tests" -Recurse -Filter "*.trx"
if ($trxFiles.Count -eq 0) {
    throw "No .trx files found under tests/ - did 'dotnet test --logger trx' run first?"
}

$backendTotal = 0
foreach ($file in $trxFiles) {
    [xml]$trx = Get-Content $file.FullName
    $backendTotal += [int]$trx.TestRun.ResultSummary.Counters.total
}

# --- Backend: Cobertura line/branch % per project (dedupe by keeping the higher reading, since
# a project's own test assembly reports its coverage highest - matches Get-BackendCoverage.ps1) ---
$coberturaFiles = Get-ChildItem -Path "$RepoRoot/tests" -Recurse -Filter "coverage.cobertura.xml"
if ($coberturaFiles.Count -eq 0) {
    throw "No coverage.cobertura.xml files found under tests/ - did '--collect:`"XPlat Code Coverage`"' run?"
}

$backendResults = @{}
foreach ($file in $coberturaFiles) {
    [xml]$xml = Get-Content $file.FullName
    foreach ($pkg in $xml.coverage.packages.package) {
        $name = $pkg.name
        $lineRate = [math]::Round([double]$pkg.'line-rate' * 100)
        $branchRate = [math]::Round([double]$pkg.'branch-rate' * 100)

        if (-not $backendResults.ContainsKey($name) -or $lineRate -gt $backendResults[$name].LinePercent) {
            $backendResults[$name] = [PSCustomObject]@{
                LinePercent   = $lineRate
                BranchPercent = $branchRate
            }
        }
    }
}

$core = $backendResults['CFBPoll.Core']
$api = $backendResults['CFBPoll.API']
if (-not $core -or -not $api) {
    throw "Expected CFBPoll.Core and CFBPoll.API packages in Cobertura output, got: $($backendResults.Keys -join ', ')"
}

# --- Frontend: Vitest JSON test report ---
$webReportPath = "$RepoRoot/src/cfbpoll-web/coverage/test-report.json"
if (-not (Test-Path $webReportPath)) {
    throw "$webReportPath not found - did 'vitest run --reporter=json --outputFile.json=coverage/test-report.json' run?"
}
$webReport = Get-Content $webReportPath -Raw | ConvertFrom-Json
$frontendTotal = [int]$webReport.numTotalTests

# --- Frontend: coverage-summary.json ---
$webSummaryPath = "$RepoRoot/src/cfbpoll-web/coverage/coverage-summary.json"
if (-not (Test-Path $webSummaryPath)) {
    throw "$webSummaryPath not found - did 'json-summary' get added to vitest.config.ts coverage.reporter?"
}
$webSummary = Get-Content $webSummaryPath -Raw | ConvertFrom-Json
$webLine = [math]::Round([double]$webSummary.total.lines.pct)
$webBranch = [math]::Round([double]$webSummary.total.branches.pct)

# --- Render replacement block ---
$block = @"
![Backend Tests](https://img.shields.io/badge/Backend_Tests-$backendTotal-blue)
![Frontend Tests](https://img.shields.io/badge/Frontend_Tests-$frontendTotal-blue)
![Core Coverage](https://img.shields.io/badge/Core_Coverage-$($core.LinePercent)%25-brightgreen)
![API Coverage](https://img.shields.io/badge/API_Coverage-$($api.LinePercent)%25-brightgreen)
![Web Coverage](https://img.shields.io/badge/Web_Coverage-$webLine%25-brightgreen)

| Project | Line Coverage | Branch Coverage |
|---------|---------------|-----------------|
| CFBPoll.Core | $($core.LinePercent)% | $($core.BranchPercent)% |
| CFBPoll.API | $($api.LinePercent)% | $($api.BranchPercent)% |
| cfbpoll-web | $webLine% | $webBranch% |
"@.Replace("`r`n", "`n")

# --- Splice into README.md between markers ---
# Normalize to LF for matching/replacing regardless of the working copy's line endings (e.g. a
# Windows checkout with core.autocrlf=true), then restore CRLF on write if that's what was there.
$readmePath = "$RepoRoot/README.md"
$readmeRaw = Get-Content $readmePath -Raw
$usesCrlf = $readmeRaw -match "`r`n"
$readme = $readmeRaw -replace "`r`n", "`n"

$pattern = '(?s)(<!-- coverage:start -->\n).*?(\n<!-- coverage:end -->)'
if ($readme -notmatch $pattern) {
    throw "coverage:start/coverage:end markers not found in README.md - check they weren't accidentally removed."
}

$newReadme = [regex]::Replace($readme, $pattern, { param($m) $m.Groups[1].Value + $block + $m.Groups[2].Value })
if ($usesCrlf) {
    $newReadme = $newReadme -replace "`n", "`r`n"
}

if ($newReadme -eq $readmeRaw) {
    Write-Host "README.md coverage block unchanged."
}
else {
    Set-Content -Path $readmePath -Value $newReadme -NoNewline
    Write-Host "README.md coverage block updated."
}
