# Atlas Endüstri Ağı — independent network phase 2

This is an additive feature release on the standalone Render/Neon pilot. It does **not** migrate the original Base44 authentication, private business records, tenders, historical user accounts, or original jobs.

Included:
- Worker / team / company contact-interest form; no password or uploaded certificates.
- Private Neon applications table with default pending status and required consent.
- Moderated public project read-only API and board, empty until independently verified listings are approved.
- Browser-only safe DOM rendering (`textContent`), not HTML string injection.
- Public site login and unapproved directory listings remain disabled.
- SQL `002` migration is additive, never deletes Base44/Atlas Earth data.
- Running service identity `atlas_pilot_api` has read/insert access to applications and **read-only** access to project listings.

Known next phase:
- Document full KVKK notice, controller/operator identity, retention and deletion rights.
- Add authenticated account creation with role-based access controls, verified company/worker identity and safe profile editing.
- Migrate original Base44 data *privately* after field mapping, deduplication and consent/provenance review.
- Set up a moderation dashboard, immutable audit log, and production-grade rate limiting before scaling onboarding.
