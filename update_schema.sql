
-- Add new columns to phones table to match new Excel structure
alter table phones add column if not exists lens text;
alter table phones add column if not exists mdf_port text; -- 機房端子編號
alter table phones add column if not exists call_class text; -- 通話等級

-- Grant permissions just in case
grant all on phones to anon, authenticated, service_role;
