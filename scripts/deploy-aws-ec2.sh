#!/usr/bin/env bash

# ==============================================================================
# PeoplePay360 - AWS EC2 Automated Deployment Script (Ubuntu 22.04 / 24.04)
# ==============================================================================
# Usage:
#   chmod +x scripts/deploy-aws-ec2.sh
#   ./scripts/deploy-aws-ec2.sh
# ==============================================================================

set -euo pipefail

# ANSI Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}      PeoplePay360 AWS EC2 Automated Deployment      ${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Root / Sudo check
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}[!] Please run with sudo: sudo ./scripts/deploy-aws-ec2.sh${NC}"
  exit 1
fi

# Detect Server Public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || curl -s ifconfig.me || echo "localhost")
echo -e "${BLUE}[*] Detected Server Public IP:${NC} $PUBLIC_IP"

# 2. Setup 4GB Swap Memory (Prevents Maven & Next.js OOM crashes on EC2)
echo -e "\n${BLUE}[1/7] Configuring Swap Memory (4GB)...${NC}"
if ! swapon --show | grep -q "/swapfile"; then
  fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q "/swapfile" /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  echo -e "${GREEN}[✓] 4GB Swap file created and activated.${NC}"
else
  echo -e "${GREEN}[✓] Swap memory is already active.${NC}"
fi

# 3. Install System Dependencies & Docker
echo -e "\n${BLUE}[2/7] Installing Docker, Git, and Nginx...${NC}"
apt-get update -y
apt-get install -y ca-certificates curl gnupg lsb-release git nginx ufw

# Install Docker if not present
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}[*] Installing Docker Engine...${NC}"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
  echo -e "${GREEN}[✓] Docker installed successfully.${NC}"
else
  echo -e "${GREEN}[✓] Docker already installed.${NC}"
fi

# 4. Generate Production Secrets & .env File
echo -e "\n${BLUE}[3/7] Setting up Environment Variables (.env)...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

chmod +x scripts/init-postgres.sh || true

if [ ! -f .env.production ]; then
  # Generate cryptographically secure random secrets
  GENERATED_JWT_SECRET=$(openssl rand -hex 32)
  GENERATED_DB_PASS=$(openssl rand -hex 16)

  cat <<EOF > .env.production
# --- PeoplePay360 Production Configuration ---
DB_USERNAME=postgres
DB_PASSWORD=${GENERATED_DB_PASS}

# Database URLs
DATABASE_URL=postgresql://postgres:${GENERATED_DB_PASS}@postgres:5432/oddo_hr
DB_URL=jdbc:postgresql://postgres:5432/oddo

# Authentication Secrets (Must match across all microservices)
JWT_SECRET=${GENERATED_JWT_SECRET}
NEXTAUTH_SECRET=${GENERATED_JWT_SECRET}
HR_API_JWT_SECRET=${GENERATED_JWT_SECRET}

# Endpoints
NEXTAUTH_URL=http://${PUBLIC_IP}
HR_API_URL=http://hr-api:3001/api/hr
NEXT_PUBLIC_HR_API_URL=http://${PUBLIC_IP}/api/hr
PAYROLL_API_URL=http://payroll:8080
EOF
  echo -e "${GREEN}[✓] Generated new .env.production with secure random secrets.${NC}"
else
  echo -e "${GREEN}[✓] Existing .env.production detected, using current values.${NC}"
fi

# Ensure docker-compose uses .env.production
cp .env.production .env

# 5. Build and Launch Containers
echo -e "\n${BLUE}[4/7] Building and starting Docker containers...${NC}"
echo -e "${YELLOW}[*] This will compile Spring Boot (Java 21) and Next.js (takes ~5-7 mins)...${NC}"
docker compose down --remove-orphans || true
docker compose up -d --build

# 6. Wait for PostgreSQL and HR API to become healthy
echo -e "\n${BLUE}[5/7] Waiting for Database and API to initialize...${NC}"
docker compose ps

echo -e "${YELLOW}[*] Waiting for PostgreSQL to be ready...${NC}"
until docker compose exec postgres pg_isready -U postgres -d postgres > /dev/null 2>&1; do
  sleep 2
done
echo -e "${GREEN}[✓] PostgreSQL is online.${NC}"

sleep 5

# 7. Run Prisma Migrations and Seed Database
echo -e "\n${BLUE}[6/7] Applying Database Migrations & Initial Seed Data...${NC}"
docker compose exec hr-api pnpm --filter @peoplepay360/db exec prisma migrate deploy
docker compose exec hr-api pnpm db:seed || echo -e "${YELLOW}[!] Seed script notice: verify if records already exist.${NC}"
echo -e "${GREEN}[✓] Database migrations and seed applied.${NC}"

# 8. Configure Nginx Reverse Proxy
echo -e "\n${BLUE}[7/7] Configuring Nginx Reverse Proxy (Port 80 -> Web 3000)...${NC}"
cat << 'EOF' > /etc/nginx/sites-available/peoplepay360
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 50M;

    # Frontend Next.js app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # HR API Proxy
    location /api/hr/ {
        proxy_pass http://127.0.0.1:3001/api/hr/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/peoplepay360 /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo -e "${GREEN}[✓] Nginx configured and reloaded.${NC}"

# Summary output
echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}      🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!           ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "${BLUE}Application URL:${NC} http://${PUBLIC_IP}"
echo -e "${BLUE}HR API Health:${NC}   http://${PUBLIC_IP}/api/hr/dashboard"
echo -e "${BLUE}Payroll API:${NC}     http://${PUBLIC_IP}:8080 (Internal port)"
echo -e ""
echo -e "${YELLOW}Next Steps (SSL / HTTPS with Custom Domain):${NC}"
echo -e "  1. Point your domain (A Record) to ${PUBLIC_IP}"
echo -e "  2. Run: sudo apt install -y certbot python3-certbot-nginx"
echo -e "  3. Run: sudo certbot --nginx -d yourdomain.com"
echo -e "======================================================"
