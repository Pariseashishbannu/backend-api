# Cloudflare Tunnel Setup Script for PowerShell
# Run with: ./setup-tunnel.ps1

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Cloudflare Tunnel Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Authenticate
Write-Host "[Step 1/4] Authenticating with Cloudflare..." -ForegroundColor Yellow
Write-Host "This will open a browser. Log in with your Cloudflare account." -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to continue"

docker run --rm -v $env:USERPROFILE\.cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel login

Write-Host ""
Write-Host "[Step 1 Complete] Credentials saved!" -ForegroundColor Green
Write-Host ""

# Step 2: Create Tunnel
Write-Host "[Step 2/4] Creating tunnel 'backend-api-tunnel'..." -ForegroundColor Yellow
Write-Host ""
docker run --rm -v $env:USERPROFILE\.cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel create backend-api-tunnel

Write-Host ""
Write-Host "[Step 2 Complete] Tunnel created!" -ForegroundColor Green
Write-Host ""

# Step 3: Get Tunnel ID
Write-Host "[Step 3/4] Tunnel ID (save this):" -ForegroundColor Yellow
Write-Host ""
docker run --rm -v $env:USERPROFILE\.cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel list

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "NEXT: Configure in Cloudflare Dashboard" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://dash.cloudflare.com" -ForegroundColor White
Write-Host "2. Select: pariseashish.com" -ForegroundColor White
Write-Host "3. Go to: Networks > Tunnels" -ForegroundColor White
Write-Host "4. Find: backend-api-tunnel" -ForegroundColor White
Write-Host "5. Click: Configure" -ForegroundColor White
Write-Host "6. Add public hostname:" -ForegroundColor White
Write-Host "   - Subdomain: api" -ForegroundColor Gray
Write-Host "   - Type: HTTPS" -ForegroundColor Gray
Write-Host "   - URL: http://localhost:8000" -ForegroundColor Gray
Write-Host "7. Click: Save hostname" -ForegroundColor White
Write-Host ""
Write-Host ""

# Step 4: Run Tunnel
Write-Host "[Step 4/4] Starting tunnel..." -ForegroundColor Yellow
Write-Host "Tunnel will run in background. Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

docker run -v $env:USERPROFILE\.cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel run backend-api-tunnel

Write-Host ""
Write-Host "Tunnel stopped." -ForegroundColor Yellow
