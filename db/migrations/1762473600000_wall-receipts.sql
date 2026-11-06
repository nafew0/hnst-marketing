-- Up Migration

-- Replay store for POST /api/v1/wall. remove_token is the visitor's secret:
-- the photo row keeps only a hash. Never log this table.
CREATE TABLE integration.wall_posts (
  idempotency_key uuid PRIMARY KEY,
  public_id uuid NOT NULL,
  remove_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One row per address and photo. The address is stored as a hash.
CREATE TABLE integration.wall_reports (
  public_id uuid NOT NULL,
  visitor_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (public_id, visitor_hash)
);

-- Down Migration

DROP TABLE IF EXISTS integration.wall_reports;
DROP TABLE IF EXISTS integration.wall_posts;
