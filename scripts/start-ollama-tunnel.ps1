# Starts a public tunnel to local Ollama (Qwen) for Vercel/Render/Slack demos.
# Requires: Ollama running on 127.0.0.1:11434, cloudflared at C:\Tools\cloudflared\
#
# Usage (PowerShell):
#   .\scripts\start-ollama-tunnel.ps1
#
# Then paste the printed HTTPS URL into Vercel + Render as OLLAMA_BASE_URL.

$ErrorActionPreference = 'Stop'
$cloudflared = 'C:\Tools\cloudflared\cloudflared.exe'

if (-not (Test-Path $cloudflared)) {
  Write-Host 'Downloading cloudflared…'
  New-Item -ItemType Directory -Force -Path 'C:\Tools\cloudflared' | Out-Null
  curl.exe -L -o $cloudflared 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'
}

Write-Host 'Checking local Ollama…'
try {
  $null = Invoke-WebRequest -Uri 'http://127.0.0.1:11434/api/tags' -UseBasicParsing -TimeoutSec 5
} catch {
  Write-Error 'Ollama is not reachable on http://127.0.0.1:11434 — start Ollama first.'
}

Write-Host ''
Write-Host 'Starting Cloudflare tunnel to Ollama…'
Write-Host 'Keep this window open. Copy the https://….trycloudflare.com URL below.'
Write-Host 'Set on Vercel AND Render:'
Write-Host '  OLLAMA_ENABLED=true'
Write-Host '  OLLAMA_BASE_URL=<that URL>'
Write-Host '  OLLAMA_CHAT_MODEL=qwen2.5-coder:7b'
Write-Host '  OLLAMA_EMBED_MODEL=nomic-embed-text'
Write-Host '  EMBEDDINGS_PROVIDER=ollama'
Write-Host ''

& $cloudflared tunnel --url http://127.0.0.1:11434 --http-host-header 'localhost:11434'
