#!/usr/bin/env bash
# Uso: deploy/pi/deploy.sh [api|web|all]   (desde la raiz del repo)
# Variables: PI (pi@192.168.1.40), PUBLIC_API_URL (URL publica de la API, se hornea en la web),
#            CLERK_PK (si no, se lee de multi-tenant-starter-template/.env.local)
set -euo pipefail
PI="${PI:-pi@192.168.1.40}"
PUBLIC_API_URL="${PUBLIC_API_URL:-https://servidor.tailf41173.ts.net:8443}"
WHAT="${1:-all}"
CLERK_PK="${CLERK_PK:-$(grep -E '^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=' multi-tenant-starter-template/.env.local | cut -d= -f2- | tr -d '"\r')}"

tar czf - --exclude=node_modules --exclude=.next --exclude=dist --exclude=coverage \
  --exclude='.env*' --exclude='secrets.*.json' --exclude=tsconfig.tsbuildinfo \
  api multi-tenant-starter-template deploy \
  | ssh "$PI" 'rm -rf ~/b2b-src && mkdir -p ~/b2b-src && tar xzf - -C ~/b2b-src'

ssh "$PI" bash -s <<EOF
set -e
cd ~/b2b-src
[ "$WHAT" = web ] || docker build -t b2b-api:latest api
[ "$WHAT" = api ] || docker build -t b2b-web:latest \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY='$CLERK_PK' \
  --build-arg NEXT_PUBLIC_API_URL='$PUBLIC_API_URL' multi-tenant-starter-template
cp deploy/pi/docker-compose.yml ~/docker/b2b/docker-compose.yml
cd ~/docker/b2b
docker compose up -d --force-recreate \$( [ "$WHAT" = all ] && echo "api web" || echo "$WHAT" )
docker image prune -f >/dev/null
docker ps --format '{{.Names}} {{.Status}}' | grep b2b
EOF
