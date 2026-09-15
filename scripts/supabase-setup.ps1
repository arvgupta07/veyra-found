# Veyra Found — Supabase setup for Windows (PowerShell)
# 1. Get a token: https://supabase.com/dashboard/account/tokens
# 2. Run: .\scripts\supabase-setup.ps1 -AccessToken "your-token-here"

param(
  [Parameter(Mandatory = $true)]
  [string]$AccessToken,
  [string]$ProjectRef = "lyqkzunsqworhvwphsia"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $Parent -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))

Write-Host "Logging in to Supabase..."
npx supabase login --token $AccessToken

Write-Host "Linking project $ProjectRef..."
npx supabase link --project-ref $ProjectRef

Write-Host "Pushing database migrations..."
npx supabase db push

Write-Host "Done. Next: paste API keys into .env from"
Write-Host "https://supabase.com/dashboard/project/$ProjectRef/settings/api"
