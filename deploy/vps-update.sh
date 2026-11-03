#!/usr/bin/env bash
# Manual update on the VPS (CI/CD does the same over SSH).
set -euo pipefail
cd "$(dirname "$0")/.."
git fetch origin
git checkout main
git pull --ff-only origin main
docker compose up -d --build
docker compose ps
curl -fsS --retry 8 --retry-delay 3 http://127.0.0.1/api/health
echo "Updated."
