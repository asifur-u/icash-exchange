#!/usr/bin/env bash
# Update code on the VPS without touching secrets.
# Usage:  cd /opt/icash-exchange && bash deploy/vps-update.sh
set -euo pipefail
cd "$(dirname "$0")/.."

cp -a .env /tmp/icash.env.bak
git fetch origin
git checkout jim
git reset --hard origin/jim
git clean -fd -e .env
cp -a /tmp/icash.env.bak .env

docker compose up -d --build --remove-orphans
docker compose exec -T app printenv ICASH_ENV
docker compose exec -T app printenv ICASH_DELIVERY
curl -fsS --retry 8 --retry-delay 3 http://127.0.0.1/api/health
echo "Updated. .env preserved."
