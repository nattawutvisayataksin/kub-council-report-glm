# Generate pixel-art assets for the "Pixel Arts" version of the site via PixelLab API (pixen, 1 gen each).
# Token: set env PIXELLAB_TOKEN, or put it in scripts/pixellab-token.txt (gitignored).
$ErrorActionPreference = "Stop"

$token = $env:PIXELLAB_TOKEN
if (-not $token) {
  $tokenFile = Join-Path $PSScriptRoot "pixellab-token.txt"
  if (Test-Path $tokenFile) { $token = (Get-Content $tokenFile -Raw).Trim() }
}
if (-not $token) { throw "No PixelLab token. Set PIXELLAB_TOKEN env or create scripts/pixellab-token.txt" }

$outDir = Join-Path $PSScriptRoot "..\public\pixel"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$style = "retro 16-bit pixel art game sprite, crisp chunky pixels, vibrant neon green and gold palette, clean silhouette, transparent background, no text"

$assets = @(
  @{ name = "ballot-box"; w = 64; h = 64; prompt = "cute golden ballot box with a glowing neon green checkmark on the front, slot on top, $style" },
  @{ name = "hourglass";    w = 32; h = 32; prompt = "hourglass timer with glowing green sand, golden frame, $style" },
  @{ name = "coin";         w = 32; h = 32; prompt = "shiny gold token coin with an emerald green gem in the center, $style" },
  @{ name = "flame";        w = 32; h = 32; prompt = "small magical green flame fire, burning bright, $style" },
  @{ name = "scroll";       w = 32; h = 32; prompt = "rolled parchment scroll tied with a green ribbon seal, $style" },
  @{ name = "trophy";       w = 32; h = 32; prompt = "golden trophy cup with emerald gems, winner prize, $style" },
  @{ name = "cube";         w = 32; h = 32; prompt = "glowing neon green blockchain cube block with circuit lines, isometric, $style" },
  @{ name = "voter";        w = 48; h = 48; prompt = "cute chibi pixel character voter, happy person holding a ballot paper, green cap, front view, $style" }
)

$headers = @{ Authorization = "Bearer $token" }

foreach ($a in $assets) {
  $outFile = Join-Path $outDir "$($a.name).png"
  if (Test-Path $outFile) { Write-Host "skip $($a.name) (exists)"; continue }

  $body = @{
    description   = $a.prompt
    image_size    = @{ width = $a.w; height = $a.h }
    no_background = $true
  } | ConvertTo-Json -Depth 4

  Write-Host "generating $($a.name) ..."
  $r = Invoke-RestMethod -Uri "https://api.pixellab.ai/v2/create-image-pixen" -Headers $headers -ContentType "application/json" -Method Post -Body $body
  [IO.File]::WriteAllBytes($outFile, [Convert]::FromBase64String($r.image.base64))
  Write-Host "  saved $outFile (used $($r.usage.generations) gen)"
}

Write-Host "done."
