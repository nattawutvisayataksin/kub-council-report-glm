# Generate the Pixel-theme hero banner with PixelLab.
# Requires PIXELLAB_TOKEN or scripts/pixellab-token.txt (both kept out of source control).
$ErrorActionPreference = "Stop"

$token = $env:PIXELLAB_TOKEN
if (-not $token) {
  $tokenFile = Join-Path $PSScriptRoot "pixellab-token.txt"
  if (Test-Path $tokenFile) { $token = (Get-Content $tokenFile -Raw).Trim() }
}
if (-not $token) { throw "No PixelLab token. Set PIXELLAB_TOKEN or create scripts/pixellab-token.txt" }

$outFile = Join-Path $PSScriptRoot "..\src\assets\pixel\kub-pixel-party-banner.png"
$prompt = @"
Wide cinematic pixel art hero banner for a KUB Chain community council election dashboard. Exactly five original adult male heroic fantasy adventurers — knight, ranger, mage, engineer, and guardian — standing together in a confident party pose. Grand polished 16-bit JRPG aesthetic, crisp readable pixel clusters, dramatic emerald and cyan rim lighting, warm gold magical highlights, deep forest shadows, luminous particles, subtle energy arcs, and a rich colorful night-sky atmosphere. Distinct silhouettes, high contrast, landscape composition with clear empty side margins. Add a subtle abstract KUB-inspired geometric emblem in the background, but no text, no letters, no logos copied from other games, no UI, no watermark.
"@

$body = @{
  description = $prompt.Trim()
  image_size = @{ width = 768; height = 280 }
  no_background = $false
} | ConvertTo-Json -Depth 4

$response = Invoke-RestMethod -Uri "https://api.pixellab.ai/v2/create-image-pixen" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Method Post -Body $body
[IO.File]::WriteAllBytes($outFile, [Convert]::FromBase64String($response.image.base64))
Write-Host "Saved $outFile"
