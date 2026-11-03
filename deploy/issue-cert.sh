#!/usr/bin/env bash
# Get a Let's Encrypt cert, then reload nginx with HTTPS.
# Usage: bash deploy/issue-cert.sh
set -euo pipefail
cd "$(dirname "$0")/.."

DOMAIN="$(grep -E '^DOMAIN=' .env | head -n1 | cut -d= -f2-)"
EMAIL="$(grep -E '^ACME_EMAIL=' .env | head -n1 | cut -d= -f2-)"
DOMAIN="${DOMAIN:-icash.exchange}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"

echo "Issuing certificate for ${DOMAIN} and www.${DOMAIN}…"
docker compose run --rm --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos --no-eff-email --keep-until-expiry

docker compose up -d --force-recreate nginx
echo "HTTPS should be live at https://${DOMAIN}"
