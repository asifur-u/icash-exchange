#!/usr/bin/env bash
# Run on the VPS from the repo root:  sudo bash deploy/vps-setup.sh your-domain.com you@email.com
set -euo pipefail

cd "$(dirname "$0")/.."

DOMAIN="${1:-}"
EMAIL="${2:-}"

need() { command -v "$1" >/dev/null 2>&1; }

if ! need docker || ! docker compose version >/dev/null 2>&1; then
  if [ "$(id -u)" -ne 0 ]; then
    echo "Docker is not installed. Re-run with sudo, or install Docker first:"
    echo "  curl -fsSL https://get.docker.com | sudo sh"
    exit 1
  fi
  echo "Installing Docker…"
  curl -fsSL https://get.docker.com | sh
  if [ -n "${SUDO_USER:-}" ]; then
    usermod -aG docker "$SUDO_USER" || true
  fi
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

set_kv() {
  local key="$1"
  local value="$2"
  local tmp
  tmp="$(mktemp)"
  awk -v k="$key" -v v="$value" '
    BEGIN { done = 0 }
    index($0, k "=") == 1 { print k "=" v; done = 1; next }
    { print }
    END { if (!done) print k "=" v }
  ' .env > "$tmp"
  mv "$tmp" .env
}

fill_if_empty() {
  local key="$1"
  local value="$2"
  local current
  current="$(grep -E "^${key}=" .env | head -n1 | cut -d= -f2- || true)"
  if [ -z "$current" ]; then
    set_kv "$key" "$value"
  fi
}

fill_if_empty AUTH_SECRET "$(openssl rand -base64 32 | tr -d '\n')"
fill_if_empty CODE_ENCRYPTION_KEY "$(openssl rand -base64 32 | tr -d '\n')"
fill_if_empty POSTGRES_PASSWORD "$(openssl rand -hex 16)"
fill_if_empty REDIS_PASSWORD "$(openssl rand -hex 16)"

PG_PASS="$(grep -E "^POSTGRES_PASSWORD=" .env | head -n1 | cut -d= -f2-)"
RD_PASS="$(grep -E "^REDIS_PASSWORD=" .env | head -n1 | cut -d= -f2-)"
set_kv DATABASE_URL "postgresql://icash:${PG_PASS}@db:5432/icash"
set_kv DATABASE_URL_UNPOOLED "postgresql://icash:${PG_PASS}@db:5432/icash"
set_kv REDIS_URL "redis://:${RD_PASS}@redis:6379/0"

if [ -n "$DOMAIN" ]; then
  set_kv DOMAIN "$DOMAIN"
  set_kv NEXT_PUBLIC_SITE_URL "https://${DOMAIN}"
fi
if [ -n "$EMAIL" ]; then
  set_kv ACME_EMAIL "$EMAIL"
  fill_if_empty ADMIN_NOTIFY_EMAIL "$EMAIL"
  fill_if_empty DELIVERY_FROM "iCash Exchange <${EMAIL}>"
fi

if need ufw && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp
  ufw allow 443/tcp
fi

echo "Building and starting Postgres + Redis + app + nginx…"
docker compose up -d --build --remove-orphans

echo
echo "Desk is up (self-hosted Postgres + Redis)."
echo "  Site:     ${DOMAIN:+https://$DOMAIN}${DOMAIN:-http://SERVER_IP}"
echo "  Admin:    ${DOMAIN:+https://$DOMAIN}${DOMAIN:-http://SERVER_IP}/admin"
echo "  Health:   curl -sS http://127.0.0.1/api/health"
echo "  Logs:     docker compose logs -f app"
IP="$(curl -4 -fsS --max-time 8 https://api.ipify.org || true)"
if [ -n "$IP" ]; then
  echo "  Public IP (whitelist this at iCash): $IP"
fi
echo
echo "Postgres and Redis are not published to the internet — only the app can reach them."
if [ -n "$DOMAIN" ]; then
  echo "When DNS for ${DOMAIN} points here, run:  bash deploy/issue-cert.sh"
fi
