<#
Download KUB Docs for offline AI-assisted research.

Default: current page index (`llms.txt`).
Use -Full only when a full static snapshot is needed; it can become stale.
Downloaded files are intentionally gitignored because documentation changes upstream.
#>
param(
	[switch]$Full
)

$ErrorActionPreference = "Stop"

$outDir = Join-Path $PSScriptRoot "..\.cache\kub-docs"
$fileName = if ($Full) { "llms-full.txt" } else { "llms.txt" }
$outFile = Join-Path $outDir $fileName
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$uri = "https://docs.kubchain.com/$fileName"
Invoke-WebRequest -Uri $uri -OutFile $outFile -UseBasicParsing
Write-Host "Saved KUB Docs file: $outFile"
if ($Full) {
	Write-Host "This is a static snapshot. Refresh it before relying on time-sensitive documentation."
} else {
	Write-Host "Use the listed URLs for targeted fetches. Use -Full only when an offline full snapshot is necessary."
}
