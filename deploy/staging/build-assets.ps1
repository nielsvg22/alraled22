$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")

Write-Host "Building storefront..." -ForegroundColor Cyan
Push-Location (Join-Path $root "aldraled")
if (!(Test-Path "node_modules")) { npm install }
$env:REACT_APP_API_URL = "https://$env:STAGING_DOMAIN"
npm run build
Pop-Location

Write-Host "Building CRM..." -ForegroundColor Cyan
Push-Location (Join-Path $root "crm-frontend")
if (!(Test-Path "node_modules")) { npm install }
$env:VITE_BASE_PATH = "/crm/"
$env:VITE_API_URL = "https://$env:STAGING_DOMAIN"
$env:VITE_API_BASE = "/api"
npm run build
Pop-Location

$public = Join-Path $PSScriptRoot "public"
$storefrontOut = Join-Path $public "storefront"
$crmOut = Join-Path $public "crm"

New-Item -ItemType Directory -Force -Path $storefrontOut | Out-Null
New-Item -ItemType Directory -Force -Path $crmOut | Out-Null

Write-Host "Copying storefront build -> deploy/staging/public/storefront" -ForegroundColor Cyan
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue (Join-Path $storefrontOut "*")
Copy-Item -Recurse -Force (Join-Path $root "aldraled\build\*") $storefrontOut

Write-Host "Copying CRM build -> deploy/staging/public/crm" -ForegroundColor Cyan
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue (Join-Path $crmOut "*")
Copy-Item -Recurse -Force (Join-Path $root "crm-frontend\dist\*") $crmOut

Write-Host "Done." -ForegroundColor Green

