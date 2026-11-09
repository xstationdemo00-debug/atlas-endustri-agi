-- ONLY for new Neon project wispy-term-01261231, production branch.
-- Apply after granting scoped write access. Never run on Atlas Earth.
-- Backend owns connections. No browser, public Data API or anonymous SQL rights.
BEGIN;
CREATE TABLE IF NOT EXISTS public.service_inquiries (
  id varchar(36) PRIMARY KEY,
  company_name varchar(180) NOT NULL,
  contact_name varchar(140) NOT NULL,
  contact_email varchar(254) NOT NULL,
  city varchar(120),
  service_type varchar(64) NOT NULL CHECK (service_type IN ('supplier_research','subcontractor_research','technical_review')),
  description text NOT NULL,
  consent_confirmed boolean NOT NULL CHECK (consent_confirmed),
  status varchar(32) NOT NULL DEFAULT 'new',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS service_inquiries_created_at_idx ON public.service_inquiries (created_at DESC);
-- No public role should be able to query this personally identifiable information.
REVOKE ALL ON public.service_inquiries FROM PUBLIC;
COMMIT;
