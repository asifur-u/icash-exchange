#!/bin/sh
set -eu
DOMAIN="${DOMAIN:-icash.exchange}"
export DOMAIN
mkdir -p /etc/nginx/conf.d
if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  envsubst '${DOMAIN}' < /templates/https.conf > /etc/nginx/conf.d/default.conf
else
  envsubst '${DOMAIN}' < /templates/http.conf > /etc/nginx/conf.d/default.conf
fi
exec nginx -g "daemon off;"
