# Proxmox LXC & Secure Storage Setup Guide

## 1. Create LXC Container
Run this on your Proxmox Host Shell:
```bash
# Download Template (if needed)
pveam update
pveam download local debian-12-standard_12.2-1_amd64.tar.zst

# Create Container (replace <ID> with unique ID, e.g., 105)
pct create <ID> local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst \
  --hostname django-backend \
  --cores 2 --memory 2048 --swap 512 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --features nesting=1,keyctl=1
```

## 2. Mount Secure Storage (`sda`)
Assuming your secure physical drive is mounted on the Proxmox Host at `/mnt/sda/storage`.
We will bind-mount it to `/data` inside the container.

Run on Proxmox Host:
```bash
# Add bind mount config
pct set <ID> -mp0 /mnt/sda/storage,mp=/data
```
*Note: Ensure the directory `/mnt/sda/storage` exists on the host.*

## 3. Install Docker Inside LXC
Enter the container:
```bash
pct start <ID>
pct enter <ID>
```

Install Docker:
```bash
apt update && apt install -y curl
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

## 4. Deploy Backend
Clone your repo or copy files to the LXC.
```bash
cd /path/to/backend
```

Create `.env` file for production:
```bash
DJANGO_SECRET_KEY=your_secure_random_key_here
DJANGO_ALLOWED_HOSTS=api.pariseashish.com,localhost
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=your_postgres_host_or_ip
DB_PORT=5432
```

Build and Run:
```bash
docker build -t django-backend .
docker run -d \
  --name backend \
  --restart always \
  -p 8000:8000 \
  -v /data:/data \
  --env-file .env \
  django-backend
```

## 5. Reverse Proxy (Nginx Proxy Manager)
Point your domain `api.pariseashish.com` to the LXC IP address on port `8000`.
