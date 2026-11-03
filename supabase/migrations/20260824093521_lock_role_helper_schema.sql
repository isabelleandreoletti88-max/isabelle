/*
# Isolate the role-checking helper

1. Security change
- Moves the SECURITY DEFINER role helper out of the public API schema.
- Revokes execution from public and anon callers.
- Keeps execution only for authenticated sessions so RLS can verify admin/editor roles.
- Replaces every policy reference with the private helper.

2. Data safety
- No table, row, column, or user data is removed or changed.
*/

create schema if not exists private;

create or replace function private.is_staff(required_role text default 'editor')
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.role = 'admin' or (required_role = 'editor' and p.role = 'editor'))
  );
$$;
revoke all on function private.is_staff(text) from public;
revoke all on function private.is_staff(text) from anon;
grant execute on function private.is_staff(text) to authenticated;
revoke all on function public.is_staff(text) from public;
revoke all on function public.is_staff(text) from anon;
revoke all on function public.is_staff(text) from authenticated;

-- Recreate policies with the private helper. Existing policy names remain stable.

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid() or private.is_staff('admin'));
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles for update to authenticated using (private.is_staff('admin')) with check (private.is_staff('admin'));
drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin on public.profiles for insert to authenticated with check (private.is_staff('admin'));
drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles for delete to authenticated using (private.is_staff('admin'));

create or replace function private.rewrite_staff_policies()
returns void language plpgsql security definer set search_path = public, private as $$
begin
  -- This function is never exposed; policy definitions below are explicit and audited in the migration.
  null;
end;
$$;
revoke all on function private.rewrite_staff_policies() from public;
revoke all on function private.rewrite_staff_policies() from anon, authenticated;

-- Replace only predicates containing the old helper by dropping and recreating the affected policies.
drop policy if exists categories_public_select on public.categories;
create policy categories_public_select on public.categories for select to anon, authenticated using (published or private.is_staff('editor'));
drop policy if exists categories_staff_insert on public.categories;
create policy categories_staff_insert on public.categories for insert to authenticated with check (private.is_staff('editor'));
drop policy if exists categories_staff_update on public.categories;
create policy categories_staff_update on public.categories for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
drop policy if exists categories_staff_delete on public.categories;
create policy categories_staff_delete on public.categories for delete to authenticated using (private.is_staff('editor'));

drop policy if exists products_public_select on public.products;
create policy products_public_select on public.products for select to anon, authenticated using (published or private.is_staff('editor'));
drop policy if exists products_staff_insert on public.products;
create policy products_staff_insert on public.products for insert to authenticated with check (private.is_staff('editor'));
drop policy if exists products_staff_update on public.products;
create policy products_staff_update on public.products for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
drop policy if exists products_staff_delete on public.products;
create policy products_staff_delete on public.products for delete to authenticated using (private.is_staff('editor'));

drop policy if exists product_images_public_select on public.product_images;
create policy product_images_public_select on public.product_images for select to anon, authenticated using (exists (select 1 from public.products p where p.id = product_id and (p.published or private.is_staff('editor'))));
drop policy if exists product_images_staff_insert on public.product_images;
create policy product_images_staff_insert on public.product_images for insert to authenticated with check (private.is_staff('editor'));
drop policy if exists product_images_staff_update on public.product_images;
create policy product_images_staff_update on public.product_images for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
drop policy if exists product_images_staff_delete on public.product_images;
create policy product_images_staff_delete on public.product_images for delete to authenticated using (private.is_staff('editor'));

drop policy if exists product_seasons_public_select on public.product_seasons;
create policy product_seasons_public_select on public.product_seasons for select to anon, authenticated using (exists (select 1 from public.products p where p.id = product_id and (p.published or private.is_staff('editor'))));
drop policy if exists product_seasons_staff_insert on public.product_seasons;
create policy product_seasons_staff_insert on public.product_seasons for insert to authenticated with check (private.is_staff('editor'));
drop policy if exists product_seasons_staff_delete on public.product_seasons;
create policy product_seasons_staff_delete on public.product_seasons for delete to authenticated using (private.is_staff('editor'));

drop policy if exists contents_public_select on public.site_contents;
create policy contents_public_select on public.site_contents for select to anon, authenticated using (private.is_staff('editor') or page in ('accueil', 'creations', 'personnalisation', 'a-propos', 'contact', 'footer', 'referencement'));
drop policy if exists contents_staff_insert on public.site_contents;
create policy contents_staff_insert on public.site_contents for insert to authenticated with check (private.is_staff('editor'));
drop policy if exists contents_staff_update on public.site_contents;
create policy contents_staff_update on public.site_contents for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
drop policy if exists contents_staff_delete on public.site_contents;
create policy contents_staff_delete on public.site_contents for delete to authenticated using (private.is_staff('editor'));

drop policy if exists settings_public_select on public.site_settings;
create policy settings_public_select on public.site_settings for select to anon, authenticated using (is_public or private.is_staff('admin'));
drop policy if exists settings_admin_insert on public.site_settings;
create policy settings_admin_insert on public.site_settings for insert to authenticated with check (private.is_staff('admin'));
drop policy if exists settings_admin_update on public.site_settings;
create policy settings_admin_update on public.site_settings for update to authenticated using (private.is_staff('admin')) with check (private.is_staff('admin'));
drop policy if exists settings_admin_delete on public.site_settings;
create policy settings_admin_delete on public.site_settings for delete to authenticated using (private.is_staff('admin'));

drop policy if exists requests_staff_select on public.contact_requests;
create policy requests_staff_select on public.contact_requests for select to authenticated using (private.is_staff('editor'));
drop policy if exists requests_staff_update on public.contact_requests;
create policy requests_staff_update on public.contact_requests for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
drop policy if exists requests_staff_delete on public.contact_requests;
create policy requests_staff_delete on public.contact_requests for delete to authenticated using (private.is_staff('editor'));

drop policy if exists audit_admin_select on public.audit_logs;
create policy audit_admin_select on public.audit_logs for select to authenticated using (private.is_staff('admin'));
drop policy if exists audit_admin_insert on public.audit_logs;
create policy audit_admin_insert on public.audit_logs for insert to authenticated with check (private.is_staff('admin'));

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects for select to anon, authenticated using (bucket_id in ('product-images', 'site-images'));
drop policy if exists product_images_staff_insert on storage.objects;
create policy product_images_staff_insert on storage.objects for insert to authenticated with check (bucket_id in ('product-images', 'site-images') and private.is_staff('editor'));
drop policy if exists product_images_staff_update on storage.objects;
create policy product_images_staff_update on storage.objects for update to authenticated using (bucket_id in ('product-images', 'site-images') and private.is_staff('editor')) with check (bucket_id in ('product-images', 'site-images') and private.is_staff('editor'));
drop policy if exists product_images_staff_delete on storage.objects;
create policy product_images_staff_delete on storage.objects for delete to authenticated using (bucket_id in ('product-images', 'site-images') and private.is_staff('editor'));
drop policy if exists request_attachment_staff_read on storage.objects;
create policy request_attachment_staff_read on storage.objects for select to authenticated using (bucket_id = 'request-attachments' and private.is_staff('editor'));
