@echo off
REM Cloudflare Tunnel Setup Script for Windows
REM This script creates a tunnel and routes api.pariseashish.com to your backend

echo.
echo ============================================
echo Cloudflare Tunnel Setup
echo ============================================
echo.

REM Step 1: Authenticate
echo [Step 1] Authenticating with Cloudflare...
echo This will open a browser. Log in with your Cloudflare account.
echo.
pause
docker run --rm -v %USERPROFILE%\.cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel login

echo.
echo [Step 1 Complete] Credentials saved to ~/.cloudflared/cert.pem
echo.

REM Step 2: Create Tunnel
echo [Step 2] Creating tunnel named 'backend-api-tunnel'...
echo.
docker run --rm -v %USERPROFILE%\.cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel create backend-api-tunnel

echo.
echo [Step 2 Complete] Tunnel created!
echo.

REM Step 3: Display tunnel ID
echo [Step 3] Getting tunnel ID...
echo.
docker run --rm -v %USERPROFILE%\.cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel list

echo.
echo ============================================
echo MANUAL STEPS REQUIRED IN CLOUDFLARE DASHBOARD
echo ============================================
echo.
echo 1. Go to https://dash.cloudflare.com
echo 2. Select domain: pariseashish.com
echo 3. Go to Networks > Tunnels
echo 4. Find: backend-api-tunnel
echo 5. Click "Configure"
echo 6. Add public hostname:
echo    - Subdomain: api
echo    - Type: HTTPS
echo    - URL: http://localhost:8000 (or your server IP)
echo.
echo 7. Save hostname
echo.
echo ============================================
echo.

REM Step 4: Start tunnel
echo [Step 4] Starting tunnel...
echo Press Ctrl+C to stop tunnel later
echo.
docker run -v %USERPROFILE%\.cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel run backend-api-tunnel

echo.
echo Tunnel stopped.
echo.
pause
