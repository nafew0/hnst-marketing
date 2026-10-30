#!/bin/sh
# Nightly logical backup of the HONEST database.
#   BACKUP_DIR=/srv/backups COMPOSE_FILE=deploy/docker-compose.yml ./deploy/backup.sh
#   ./deploy/backup.sh --restore /path/to/hnst-*.dump hnst_restore
#
# Keeps 14 days of dumps. Refuses to restore over the live `hnst` database.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
COMPOSE_FILE=${COMPOSE_FILE:-"$ROOT/docker-compose.dev.yml"}
BACKUP_DIR=${BACKUP_DIR:-/tmp/hnst-backups}
POSTGRES_USER=${POSTGRES_USER:-hnst}
POSTGRES_DB=${POSTGRES_DB:-hnst}

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

if [ "${1:-}" = "--restore" ]; then
  dump=${2:-}
  target=${3:-hnst_restore}
  if [ -z "$dump" ] || [ ! -f "$dump" ]; then
    echo "usage: deploy/backup.sh --restore <dump> [target-database]" >&2
    exit 1
  fi
  case "$target" in
    hnst) echo "refusing to restore over the live database" >&2; exit 1 ;;
    *[!a-z0-9_]*) echo "target database name must be lowercase letters, digits, or underscore" >&2; exit 1 ;;
  esac
  compose exec -T db psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 \
    -c "DROP DATABASE IF EXISTS \"$target\"" \
    -c "CREATE DATABASE \"$target\""
  compose exec -T db pg_restore -U "$POSTGRES_USER" -d "$target" --no-owner --exit-on-error < "$dump"
  compose exec -T db psql -U "$POSTGRES_USER" -d "$target" -v ON_ERROR_STOP=1 \
    -c "SELECT count(*) FROM integration.outbox"
  echo "restored $dump into $target"
  exit 0
fi

mkdir -p "$BACKUP_DIR"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
out="$BACKUP_DIR/hnst-$stamp.dump"
compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$out"
find "$BACKUP_DIR" -name 'hnst-*.dump' -mtime +14 -delete
echo "$out"
