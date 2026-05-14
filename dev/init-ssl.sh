#!/bin/bash
set -e

DOMAIN="api.petlifelog.site"
EMAIL="ohohdmswlgd@gmail.com"
CERTBOT_CONF="$(pwd)/nginx/certbot/conf"

mkdir -p "$CERTBOT_CONF"

echo ">>> Stopping nginx (port 80 must be free)..."
docker-compose stop nginx 2>/dev/null || true

echo ">>> Obtaining SSL certificate for $DOMAIN (standalone mode)..."
docker run --rm \
  -v "$CERTBOT_CONF:/etc/letsencrypt" \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos --no-eff-email

echo ">>> Starting all services..."
docker-compose up -d

echo ">>> Done. https://$DOMAIN should be live shortly."
