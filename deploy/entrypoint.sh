#!/bin/sh
set -eu

if [ -z "${DATABASE_URL_UNPOOLED:-}" ]; then
  export DATABASE_URL_UNPOOLED="${DATABASE_URL}"
fi

echo "iCash Exchange: applying database migrations…"
node node_modules/prisma/build/index.js migrate deploy

echo "iCash Exchange: starting…"
exec node server.js
