-- Create org-logos storage bucket (public — logos are not sensitive)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-logos',
  'org-logos',
  true,
  2097152, -- 2 MB
  array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
)
on conflict (id) do nothing;

-- Allow authenticated users to upload/update logos for their own org
create policy "org_logos_upload"
on storage.objects for insert
with check (
  bucket_id = 'org-logos'
  and auth.uid() is not null
);

create policy "org_logos_update"
on storage.objects for update
using (
  bucket_id = 'org-logos'
  and auth.uid() is not null
);

create policy "org_logos_public_read"
on storage.objects for select
using (bucket_id = 'org-logos');
