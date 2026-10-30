-- Up Migration

CREATE INDEX IF NOT EXISTS event_buffer_email_idx
  ON integration.event_buffer (email)
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS event_buffer_anonymous_ts_idx
  ON integration.event_buffer (ts)
  WHERE email IS NULL;

-- Down Migration

DROP INDEX IF EXISTS integration.event_buffer_anonymous_ts_idx;
DROP INDEX IF EXISTS integration.event_buffer_email_idx;
