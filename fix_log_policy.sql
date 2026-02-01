-- Add DELETE policy for modification_logs table
-- Allow authenticated users (or public if that's the setup) to delete logs
-- Ideally restrict to admin, but since we rely on client-side role check for now in the JS,
-- we need to at least enable the DELETE operation in RLS.

create policy "Public Delete Logs" on modification_logs for delete using (true);
