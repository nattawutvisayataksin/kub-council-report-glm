# Generate the current Pixel-theme hero artwork through PixelLab.
# Requires PIXELLAB_TOKEN or scripts/pixellab-token.txt; never commit credentials.
$ErrorActionPreference = "Stop"

$token = $env:PIXELLAB_TOKEN
if (-not $token) {
  $tokenFile = Join-Path $PSScriptRoot "pixellab-token.txt"
  if (Test-Path $tokenFile) { $token = (Get-Content $tokenFile -Raw).Trim() }
}
if (-not $token) { throw "No PixelLab token. Set PIXELLAB_TOKEN or create scripts/pixellab-token.txt" }

$outDir = Join-Path $PSScriptRoot "..\src\assets\pixel"
$headers = @{ Authorization = "Bearer $token" }
$jobs = @(
  @{
    name = "kub-pixel-party-banner.png"; width = 768; height = 280; noBackground = $false
    prompt = "Wide pixel art hero banner for a KUB Chain community council election dashboard. EXACTLY FIVE and only five original adult male fantasy adventurers, full bodies visible, standing in one row: male knight, male ranger, male mage, male engineer, male guardian. No female characters, no sixth person, no creatures, no extra portraits, no duplicate people. Confident heroic party pose, modern polished 16-bit JRPG-inspired aesthetic, crisp readable pixel clusters, distinct male silhouettes, emerald KUB green (#2fe97a), deep forest green, white, limited gold and blue accents. Subtle abstract geometric blockchain background. No text, no letters, no UI, no watermark, no copied characters or named game franchises. Bright professional high contrast landscape composition."
  }
)

foreach ($job in $jobs) {
  $body = @{
    description = $job.prompt
    image_size = @{ width = $job.width; height = $job.height }
    no_background = $job.noBackground
  } | ConvertTo-Json -Depth 4
  $response = Invoke-RestMethod -Uri "https://api.pixellab.ai/v2/create-image-pixen" -Headers $headers -ContentType "application/json" -Method Post -Body $body
  $outFile = Join-Path $outDir $job.name
  [IO.File]::WriteAllBytes($outFile, [Convert]::FromBase64String($response.image.base64))
  Write-Host "Saved $outFile"
}
