#!/bin/bash
set -e

DOMAIN="api.petlifelog.site"
EMAIL="ohohdmswlgd@gmail.com"
CERTBOT_WWW="$(pwd)/nginx/certbot/www"
CERTBOT_CONF="$(pwd)/nginx/certbot/conf"

mkdir -p "$CERTBOT_WWW" "$CERTBOT_CONF"

# nginx가 이미 80 포트를 점유 중이면 잠시 멈춤
if docker-compose ps nginx 2>/dev/null | grep -q "Up"; then
  echo ">>> Stopping nginx temporarily..."
  docker-compose stop nginx
fi

echo ">>> Starting temporary nginx for ACME challenge..."
docker run --rm -d --name nginx-init \
  -v "$(pwd)/nginx/nginx-init.conf:/etc/nginx/conf.d/default.conf:ro" \
  -v "$CERTBOT_WWW:/var/www/certbot" \
  -p 80:80 nginx:1.27-alpine

echo ">>> Obtaining SSL certificate for $DOMAIN..."
docker run --rm \
  -v "$CERTBOT_CONF:/etc/letsencrypt" \
  -v "$CERTBOT_WWW:/var/www/certbot" \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos --no-eff-email

docker stop nginx-init

echo ">>> Starting all services..."
docker-compose up -d

echo ">>> Done. https://$DOMAIN should be live shortly."
