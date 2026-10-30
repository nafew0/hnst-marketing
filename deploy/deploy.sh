#!/bin/sh
# Pull, build, migrate, and roll back to the previous images if /api/health fails.
# Run on the VM from anywhere: ./deploy/deploy.sh
# Localhost does not use this script.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$ROOT"
COMPOSE="docker compose -f deploy/docker-compose.yml"

tag_previous() {
  image=$1
  if docker image inspect "$image:current" >/dev/null 2>&1; then
    docker tag "$image:current" "$image:previous"
  fi
}

rollback() {
  echo "health check failed; rolling back" >&2
  if docker image inspect hnst-web:previous >/dev/null 2>&1; then
    docker tag hnst-web:previous hnst-web:current
  fi
  if docker image inspect hnst-worker:previous >/dev/null 2>&1; then
    docker tag hnst-worker:previous hnst-worker:current
  fi
  $COMPOSE up -d --no-build
  exit 1
}

git pull --ff-only
tag_previous hnst-web
tag_previous hnst-worker
$COMPOSE build
$COMPOSE run --rm worker bun scripts/migrate.ts
if [ -f payload.config.ts ]; then
  # The standalone web image has no Payload CLI; the worker image has all deps.
  $COMPOSE run --rm worker bunx payload migrate
else
  echo "payload.config.ts is not in this checkout yet; skipping payload migrate"
fi
$COMPOSE up -d

i=0
while [ "$i" -lt 30 ]; do
  if curl -fsS http://127.0.0.1/api/health >/dev/null; then
    echo "healthy"
    exit 0
  fi
  i=$((i + 1))
  sleep 2
done
rollback
