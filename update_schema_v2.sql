
-- Add new column for '遠端機櫃 MC-ID (第幾對線)'
alter table phones add column if not exists remote_mc_id text;

-- Grant permissions just in case
grant all on phones to anon, authenticated, service_role;
