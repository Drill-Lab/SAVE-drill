# Copies Drill-lab audio from Google Drive into public/audio/save-drill with names expected by lib/save-drill-config.ts
# Run from repo root:  pwsh -File web/scripts/sync-drill-audio-from-drive.ps1
# Or:                     powershell -ExecutionPolicy Bypass -File web/scripts/sync-drill-audio-from-drive.ps1

$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot ".."
$dest = Join-Path $root "public\audio\save-drill"
$lab = "G:\My Drive\Drill-lab"

if (-not (Test-Path $lab)) {
  Write-Error "Drill-lab folder not found: $lab"
}

New-Item -ItemType Directory -Force -Path $dest | Out-Null

$opening = Join-Path $lab "Opening Scripts - SAVE"
Copy-Item (Join-Path $opening "Support introduction.m4a") (Join-Path $dest "support-intro.m4a") -Force
Copy-Item (Join-Path $opening "Acknowledge Introduction.m4a") (Join-Path $dest "acknowledge-intro.m4a") -Force
Copy-Item (Join-Path $opening "Validate Introduction.m4a") (Join-Path $dest "validate-intro.m4a") -Force
Copy-Item (Join-Path $opening "Emotion Naming Introduction.m4a") (Join-Path $dest "emotion-naming-intro.m4a") -Force

function Copy-Numbered {
  param([string]$SourceDir, [string]$Prefix)
  $files = Get-ChildItem (Join-Path $SourceDir "*.m4a") | Sort-Object Name
  for ($i = 0; $i -lt $files.Count; $i++) {
    $n = $i + 1
    Copy-Item $files[$i].FullName (Join-Path $dest "$Prefix-$n.m4a") -Force
  }
  Write-Host "  $Prefix : $($files.Count) file(s)"
}

Write-Host "Syncing from $lab -> $dest"
Copy-Numbered (Join-Path $lab "Support") "support"
Copy-Numbered (Join-Path $lab "Acknowledge") "acknowledge"
Copy-Numbered (Join-Path $lab "Validate") "validate"
Copy-Numbered (Join-Path $lab "Emotion Naming") "emotion-naming"
Write-Host "Done."
