-- Up Migration

CREATE SCHEMA IF NOT EXISTS integration;

CREATE TABLE integration.outbox (
  id uuid PRIMARY KEY,
  idempotency_key text NOT NULL UNIQUE,
  type text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  attempts int NOT NULL DEFAULT 0,
  ghl_contact_id text,
  -- Set after the note is stored. A retry that dies after GoHighLevel accepts
  -- the note and before this column is written will add a second note.
  -- Cost: one duplicate note in that window, instead of a note on every retry.
  ghl_note_id text,
  ghl_opportunity_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE integration.consent_log (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  phone text,
  sms boolean NOT NULL,
  email_marketing boolean NOT NULL,
  consent_text text NOT NULL,
  ip inet,
  user_agent text,
  page_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE integration.webhook_receipts (
  id text PRIMARY KEY,
  source text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE integration.event_buffer (
  id bigserial PRIMARY KEY,
  anon_id text NOT NULL,
  email text,
  name text NOT NULL,
  props jsonb,
  ts timestamptz NOT NULL
);

CREATE TABLE integration.worker_heartbeat (
  id text PRIMARY KEY,
  beat_at timestamptz NOT NULL
);

-- Down Migration

DROP TABLE IF EXISTS integration.worker_heartbeat;
DROP TABLE IF EXISTS integration.event_buffer;
DROP TABLE IF EXISTS integration.webhook_receipts;
DROP TABLE IF EXISTS integration.consent_log;
DROP TABLE IF EXISTS integration.outbox;
