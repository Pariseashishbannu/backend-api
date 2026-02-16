# Cloudflare Tunnel Setup - Backend API

Connect your Django backend to `api.pariseashish.com` via Cloudflare Tunnel.

## Quick Summary

Your backend is configured to accept requests from:
- Frontend: `npm.pariseashish.com`
- API Domain: `api.pariseashish.com`
- Localhost: `localhost:8000`

## Setup Instructions

### Option 1: Cloudflare Dashboard (Recommended - Easiest)

1. **Log in to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Select your domain (pariseashish.com)

2. **Create a Tunnel**
   - Go to **Networks > Tunnels** (left sidebar)
   - Click **Create a tunnel**
   - Choose **Cloudflare Tunnel**
   - Name it: `backend-api-tunnel`
   - Click **Save tunnel**

3. **Get Your Token**
   - After creating, copy the **Installation Token**
   - Save it somewhere safe (you'll use it only once)

4. **Add to Backend**
   - Create `.env` file in backend directory:
   ```env
   CLOUDFLARE_TUNNEL_TOKEN=<your-token-here>
   ```

5. **Start Tunnel Service**
   ```bash
   docker-compose up -d cloudflare
   ```

6. **Configure DNS**
   - Back in Cloudflare Dashboard, go to **Public Hostnames**
   - Click **Add a public hostname**
   - **Subdomain:** `api`
   - **Type:** HTTPS
   - **URL:** `http://web:8000`
   - Click **Save hostname**

### Option 2: Command Line

If you prefer terminal setup:

```bash
# Stop containers first
docker-compose down

# Start cloudflare to get auth
docker-compose run --rm cloudflare tunnel login

# Follow the browser prompt to authorize Cloudflare
# Copy the credentials shown

# Set environment variable
export CLOUDFLARE_TUNNEL_TOKEN=your_credentials_here

# Create tunnel
docker-compose run --rm cloudflare tunnel create backend-api-tunnel

# Start all services
docker-compose up -d
```

## Verify It's Working

1. **Check tunnel status:**
   ```bash
   docker-compose logs cloudflare
   ```
   
   Look for:
   ```
   Connected to api.pariseashish.com
   ```

2. **Test from browser:**
   - Visit: `https://api.pariseashish.com/admin/`
   - You should see the Django admin login

3. **Test CORS:**
   - From `npm.pariseashish.com`, call your API:
   ```javascript
   fetch('https://api.pariseashish.com/api/v1/...')
     .then(r => r.json())
     .then(console.log)
   ```

## Environment Variables Already Set

These are configured in `docker-compose.yml`:
- ✅ `CORS_ALLOWED_ORIGINS=https://npm.pariseashish.com`
- ✅ `DJANGO_ALLOWED_HOSTS=api.pariseashish.com,npm.pariseashish.com`
- ✅ `CSRF_TRUSTED_ORIGINS` includes all domains

## Common Issues

**Tunnel shows but won't connect:**
- Token might be expired
- Create a new tunnel with fresh token
- Restart: `docker-compose restart cloudflare`

**DNS shows but returns 502/503:**
- Check Docker logs: `docker-compose logs web`
- Ensure Django is running: `docker-compose logs web --tail 5`

**CORS errors from npm.pariseashish.com:**
- Verify dns origin: `https://npm.pariseashish.com` (note https)
- Check that API responds with correct CORS headers:
  ```bash
  curl -i https://api.pariseashish.com/api/v1/ \
    -H "Origin: https://npm.pariseashish.com"
  ```

## Next Steps

After setup, your frontend can call:
```javascript
const API_BASE = 'https://api.pariseashish.com'

// Login
fetch(`${API_BASE}/api/v1/auth/login/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'bannu', password: '7852' })
})

// Admin
fetch(`${API_BASE}/admin/`) // Should load the dashboard
```

## Disable Tunnel

To stop using Cloudflare tunnel:
```bash
docker-compose down cloudflare
# or just remove the cloudflare service from docker-compose.yml
```
