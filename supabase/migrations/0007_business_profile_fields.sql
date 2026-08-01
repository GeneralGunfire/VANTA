-- Business Profile page — adds the fields the onboarding flow (AuthPage's
-- "business" step) already collects but never persisted anywhere: business
-- name and business type. business_profile previously only tracked
-- registration_status (added in 0003_phase2_features.sql), which is why
-- Tax Calendar's registration selector was session-only until now.
--
-- Run this manually in the Supabase SQL editor. NOT applied automatically
-- and NOT executed against any live database by the agent that wrote it.
alter table business_profile add column business_name text;
alter table business_profile add column business_type text;
