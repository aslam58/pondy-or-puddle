-- Run once against the chosen PostgreSQL database. This migration is transactional.
BEGIN;
CREATE SCHEMA IF NOT EXISTS pondy;
REVOKE ALL ON SCHEMA pondy FROM PUBLIC;
CREATE TABLE IF NOT EXISTS pondy.reports (
 id uuid PRIMARY KEY,
 street text NOT NULL CHECK (length(street) BETWEEN 1 AND 100),
 note text NOT NULL CHECK (length(note)<=180),
 lat double precision NOT NULL CHECK (lat BETWEEN 11.88 AND 12.04),
 lng double precision NOT NULL CHECK (lng BETWEEN 79.73 AND 79.87),
 status text NOT NULL CHECK (status IN ('red','orange','yellow','green')),
 created_at bigint NOT NULL,
 observed_at bigint NOT NULL,
 author uuid NOT NULL,
 votes integer NOT NULL DEFAULT 0 CHECK (votes>=0)
);
CREATE INDEX IF NOT EXISTS reports_observed_idx ON pondy.reports(observed_at DESC);
CREATE TABLE IF NOT EXISTS pondy.actions (
 report_id uuid NOT NULL REFERENCES pondy.reports(id) ON DELETE CASCADE,
 actor uuid NOT NULL,
 kind text NOT NULL CHECK (kind IN ('confirm','clear','flag')),
 created_at bigint NOT NULL,
 PRIMARY KEY(report_id,actor,kind)
);
CREATE TABLE IF NOT EXISTS pondy.rate_limits (
 key text PRIMARY KEY,
 count integer NOT NULL CHECK (count>=1),
 expires_at bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limits_expires_idx ON pondy.rate_limits(expires_at);
ALTER TABLE pondy.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pondy.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pondy.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA pondy FROM PUBLIC;
-- A dedicated application role can access only this private schema's tables.
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='pondy_app') THEN
  CREATE ROLE pondy_app NOLOGIN NOINHERIT;
 END IF;
END $$;
GRANT CONNECT ON DATABASE postgres TO pondy_app;
GRANT USAGE ON SCHEMA pondy TO pondy_app;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA pondy TO pondy_app;
DO $$ DECLARE tbl text; BEGIN
 FOREACH tbl IN ARRAY ARRAY['reports','actions','rate_limits'] LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='pondy' AND tablename=tbl AND policyname='pondy_server_access') THEN
   EXECUTE format('CREATE POLICY pondy_server_access ON pondy.%I FOR ALL TO pondy_app USING (true) WITH CHECK (true)',tbl);
  END IF;
 END LOOP;
END $$;
ALTER ROLE pondy_app SET search_path=pondy,pg_catalog;
-- Enable LOGIN and set its random password separately; never put secrets in this file.
COMMIT;
