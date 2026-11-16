#!/usr/bin/env bash
# Factory-reset the VPS desk: all rows, screenshots, and Redis.
# Usage:  cd /opt/icash-exchange && bash deploy/wipe-orders.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "This deletes EVERY desk record: buys, sells, users, owners, catalog, activity, screenshots, Redis."
echo "After this you must open /admin and create the first owner again."
printf "Type WIPE to continue: "
read -r confirm
if [ "$confirm" != "WIPE" ]; then
  echo "Aborted."
  exit 1
fi

docker compose exec -T db psql -U icash -d icash -v ON_ERROR_STOP=1 < deploy/wipe-orders.sql
docker compose exec -u root app sh -c 'rm -rf /data/proofs && mkdir -p /data/proofs && chown nextjs:nodejs /data/proofs'
docker compose exec -T redis sh -c 'REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli FLUSHALL'
echo "Desk is empty. Open /admin and create the owner."
