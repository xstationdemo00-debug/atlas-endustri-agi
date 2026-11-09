-- Atlas Endüstri Ağı independent phase 2. Additive migration only.
-- These tables must remain separate from Atlas Earth and Base44 production data.
CREATE TABLE IF NOT EXISTS public.atlas_network_applications (
  id VARCHAR(36) PRIMARY KEY,
  kind VARCHAR(16) NOT NULL CHECK (kind IN ('worker', 'team', 'company')),
  name VARCHAR(180) NOT NULL,
  contact_name VARCHAR(140) NOT NULL,
  email VARCHAR(254) NOT NULL,
  city VARCHAR(120) NOT NULL,
  specialty VARCHAR(140) NOT NULL,
  details TEXT NOT NULL,
  consent_confirmed BOOLEAN NOT NULL CHECK (consent_confirmed),
  status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS atlas_network_applications_created_at_idx
  ON public.atlas_network_applications (created_at DESC);
CREATE TABLE IF NOT EXISTS public.atlas_project_listings (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  city VARCHAR(120) NOT NULL,
  trade VARCHAR(140) NOT NULL,
  scope_summary TEXT NOT NULL,
  public_source_url TEXT,
  approval_status VARCHAR(24) NOT NULL DEFAULT 'draft' CHECK (approval_status IN ('draft', 'approved', 'rejected')),
  public_visible BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS atlas_project_public_idx
  ON public.atlas_project_listings (public_visible, approval_status, created_at DESC);
-- Do not expose application rows via PUBLIC grants or any anonymous database API.
REVOKE ALL ON public.atlas_network_applications FROM PUBLIC;
REVOKE ALL ON public.atlas_project_listings FROM PUBLIC;
-- App role can accept applications, but cannot publish projects through any HTTP route.
GRANT SELECT, INSERT ON public.atlas_network_applications TO atlas_pilot_api;
REVOKE UPDATE, DELETE ON public.atlas_network_applications FROM atlas_pilot_api;
GRANT SELECT ON public.atlas_project_listings TO atlas_pilot_api;
REVOKE INSERT, UPDATE, DELETE ON public.atlas_project_listings FROM atlas_pilot_api;
