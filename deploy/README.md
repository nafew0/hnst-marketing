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

## Server

The site runs natively on a server shared with other apps, because nginx already owns ports 80 and 443 there and Docker must stay off. `deploy/native/` holds its systemd services, nginx template, `hnst-update` (update, rollback, health check), `hnst-backup` and cron schedule. `/api/health` and `/api/webhooks/*` stay open when `SITE_PASSWORD` gates staging. Media lives at `/srv/media`, with CMS uploads in `/srv/media/uploads`; nginx serves `/media/*` with a one-year immutable cache.

The server's address and the step-by-step commands are in the private `HONEST-Website-Deploy-Plan.md`, because this repo is public.

## Docker files

`docker-compose.yml`, `Caddyfile`, `deploy.sh`, `backup.sh` and `crontab` describe a dedicated VM where Caddy owns ports 80 and 443. The shared server doesn't use them.
