
-- Enable DELETE for public (or authenticated) users
-- Run this in Supabase SQL Editor

-- 1. Phones Table
drop policy if exists "Public Delete Phones" on phones;
create policy "Public Delete Phones" on phones for delete using (true);

-- 2. Dispatch Phones Table
drop policy if exists "Public Delete Dispatch" on dispatch_phones;
create policy "Public Delete Dispatch" on dispatch_phones for delete using (true);

-- 3. Images Table (Fix Admin Delete Image Issue)
drop policy if exists "Public Delete Images" on images;
create policy "Public Delete Images" on images for delete using (true);

-- 4. Storage Objects (Fix Storage Delete Issue for 'images' bucket)
drop policy if exists "Public Delete Storage" on storage.objects;
create policy "Public Delete Storage" on storage.objects for delete using ( bucket_id = 'images' );
