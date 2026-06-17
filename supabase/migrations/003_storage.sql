-- Buckets de storage
insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true);
insert into storage.buckets (id, name, public) values ('logos', 'logos', true);

-- Políticas de storage
create policy "Authenticated users upload post images" on storage.objects
  for insert with check (bucket_id = 'post-images' and auth.role() = 'authenticated');
create policy "Public read post images" on storage.objects
  for select using (bucket_id = 'post-images');
create policy "Owners delete own post images" on storage.objects
  for delete using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Authenticated users upload logos" on storage.objects
  for insert with check (bucket_id = 'logos' and auth.role() = 'authenticated');
create policy "Public read logos" on storage.objects
  for select using (bucket_id = 'logos');
