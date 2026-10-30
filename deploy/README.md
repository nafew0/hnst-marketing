# HONEST website operations

P2 runs on localhost. The VM files in this folder are ready for later; do not point `hnst.marketing` at them until the Founder says go.

## Localhost

From the repo root, with Node 24.20+ and Bun 1.4.4:

```sh
bun run db:up
```

If port 5432 is already in use, start Postgres 17 on 5433 instead:

```sh
docker compose -f deploy/docker-compose.localhost.yml up -d
```

Set `DATABASE_URL` to `postgres://hnst:hnst@127.0.0.1:5432/hnst` after `bun run db:up`, or `postgres://hnst:hnst@127.0.0.1:5433/hnst` for the 5433 file. Also set `GHL_PIT`, `GHL_LOCATION_ID`, `GHL_PIPELINE_ID`, `GHL_STAGE_NEW_ID`, `GHL_CALENDAR_ID`, and `ALTCHA_HMAC_KEY` (32+ characters). Never put the token in a `NEXT_PUBLIC_` name.

```sh
bun scripts/migrate.ts
bun scripts/ghl-setup.ts
bun dev
bun worker/index.ts
```

`GET /api/health` checks Postgres and reports the worker heartbeat. `POST /api/v1/leads` needs an `Idempotency-Key` UUID and a solved ALTCHA payload. A repeated key returns the same `202` ref. The hidden honeypot field is `company_website_confirm`; Astra's forms should send it empty.

GoHighLevel is called only from the worker. SMS do-not-disturb is set when `consent.sms` is false.

## Backup

```sh
BACKUP_DIR=/tmp/hnst-backups ./deploy/backup.sh
./deploy/backup.sh --restore /tmp/hnst-backups/hnst-YYYYMMDDTHHMMSSZ.dump hnst_restore
```

The script uses the `db` service of `COMPOSE_FILE` (default `docker-compose.dev.yml`). It will not restore over the database named `hnst`.

## VM, later

Ubuntu 24.04, ports 22, 80, and 443 only. `.env` at mode 600. `BACKUP_DIR=/srv/backups`. Install `deploy/crontab`. `deploy/deploy.sh` builds `hnst-web:current` and `hnst-worker:current`, migrates (both migrations run in the worker image), and retags the previous images if `http://127.0.0.1/api/health` does not succeed. `/api/health` and `/api/webhooks/*` stay open when `SITE_PASSWORD` gates staging. Media lives on the host at `/srv/media` (`MEDIA_DIR` to override); the crontab also archives it weekly. Uptime Kuma listens on `127.0.0.1:3001` only. Caddy serves `/media/*` from `/srv/media` with a one-year immutable cache.

`payload migrate` runs only after `payload.config.ts` exists (Astra, P3).
