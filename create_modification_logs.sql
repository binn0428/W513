-- Create Modification Logs Table
create table modification_logs (
  id uuid default uuid_generate_v4() primary key,
  table_name text not null, -- 'phones', 'dispatch_phones', 'images'
  record_id text, -- ID of the modified record (can be uuid or text)
  action text not null, -- 'UPDATE', 'DELETE', 'INSERT'
  changed_fields text, -- Summary of changes
  old_data jsonb, -- Snapshot of data before change
  new_data jsonb, -- Snapshot of data after change
  modified_by text, -- Username of the modifier
  modified_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table modification_logs enable row level security;

-- Policies
create policy "Public Read Logs" on modification_logs for select using (true);
create policy "Public Insert Logs" on modification_logs for insert with check (true);
