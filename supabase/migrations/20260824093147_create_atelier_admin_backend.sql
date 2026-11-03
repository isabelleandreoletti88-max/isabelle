/*
# Backend sécurisé et administration de L’Atelier d’Isabelle

1. Objectif
- Remplace le catalogue statique par un catalogue persistant et administrable.
- Ajoute l’authentification privée par e-mail et mot de passe.
- Permet aux visiteurs de consulter uniquement le contenu publié et d’envoyer une demande.
- Permet aux profils admin/editor de gérer le catalogue, les images, les contenus et les demandes.

2. Nouvelles tables
- profiles : rôle et identité des utilisateurs administrateurs.
- categories : catégories publiables du catalogue.
- seasons : saisons disponibles.
- products : créations, prix numériques, publication et disponibilité.
- product_images : galerie des créations.
- product_seasons : association multi-saisons.
- site_contents : textes éditables du site.
- site_settings : réglages publics ou sensibles du site.
- contact_requests : demandes issues des formulaires publics.
- audit_logs : historique des actions réservées aux administrateurs.

3. Sécurité
- RLS est activé sur chaque table.
- Les visiteurs lisent uniquement les données publiques et créent des demandes avec consentement.
- Les profils admin/editor sont vérifiés par une fonction SECURITY DEFINER à search_path fixe.
- Les demandes, profils, réglages privés et journaux ne sont jamais publics.
- Les buckets Storage product-images, site-images et request-attachments sont créés avec des limites de taille et de type.

4. Intégrité
- Les slugs sont uniques.
- Les prix utilisent numeric(10,2).
- Les références d’images et de saisons sont supprimées avec leur création.
- Les demandes conservent product_name pour l’historique même si une création est ensuite supprimée.
- Les dates updated_at sont mises à jour automatiquement.
*/

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text,
  published boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text not null default '#8F9D83',
  icon text not null default 'leaf',
  display_order integer not null default 0
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text not null default '',
  description text not null default '',
  price numeric(10,2) check (price is null or price >= 0),
  price_from boolean not null default false,
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  category_id uuid references public.categories(id) on delete set null,
  materials text[] not null default '{}',
  dimensions text not null default '',
  colors text[] not null default '{}',
  personalizable boolean not null default false,
  availability_status text not null default 'made_to_order' check (availability_status in ('available', 'made_to_order', 'sold', 'unavailable')),
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  production_time text not null default '',
  maintenance_advice text not null default '',
  featured boolean not null default false,
  published boolean not null default false,
  display_order integer not null default 0,
  seo_title text not null default '',
  seo_description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt_text text not null default '',
  display_order integer not null default 0,
  is_main boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.product_seasons (
  product_id uuid not null references public.products(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  primary key (product_id, season_id)
);

create table if not exists public.site_contents (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  section text not null,
  content_key text not null,
  content_type text not null check (content_type in ('text', 'textarea', 'richtext', 'image', 'link', 'json')),
  value jsonb not null default '""'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  unique (page, section, content_key)
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null default '""'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null default 'contact' check (request_type in ('contact', 'product', 'custom_order')),
  product_id uuid references public.products(id) on delete set null,
  product_name text,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  occasion text,
  desired_colors text,
  desired_dimensions text,
  budget text,
  desired_date date,
  inspiration_image_path text,
  consent boolean not null check (consent = true),
  status text not null default 'new' check (status in ('new', 'in_progress', 'answered', 'archived')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists products_published_idx on public.products (published, display_order);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_updated_idx on public.products (updated_at desc);
create index if not exists product_images_product_idx on public.product_images (product_id, display_order);
create index if not exists contact_requests_status_idx on public.contact_requests (status, created_at desc);
create index if not exists contact_requests_email_idx on public.contact_requests (lower(email));

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists site_contents_updated_at on public.site_contents;
create trigger site_contents_updated_at before update on public.site_contents for each row execute function public.set_updated_at();
drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
drop trigger if exists contact_requests_updated_at on public.contact_requests;
create trigger contact_requests_updated_at before update on public.contact_requests for each row execute function public.set_updated_at();

create or replace function public.is_staff(required_role text default 'editor')
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.role = 'admin' or (required_role = 'editor' and p.role = 'editor'))
  );
$$;
revoke execute on function public.is_staff(text) from anon;
grant execute on function public.is_staff(text) to authenticated;

create or replace function public.set_published_at()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.published = true and old.published = false then new.published_at = coalesce(new.published_at, now()); end if;
  if new.published = false then new.published_at = null; end if;
  return new;
end;
$$;
drop trigger if exists products_published_at on public.products;
create trigger products_published_at before update on public.products for each row execute function public.set_published_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.seasons enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_seasons enable row level security;
alter table public.site_contents enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_requests enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: un utilisateur lit son propre profil. Seul un admin peut modifier les rôles via la console sécurisée.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff('admin'));
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles for update to authenticated using (public.is_staff('admin')) with check (public.is_staff('admin'));
drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin on public.profiles for insert to authenticated with check (public.is_staff('admin'));
drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles for delete to authenticated using (public.is_staff('admin'));

-- Tables publiques.
drop policy if exists categories_public_select on public.categories;
create policy categories_public_select on public.categories for select to anon, authenticated using (published or public.is_staff('editor'));
drop policy if exists categories_staff_insert on public.categories;
create policy categories_staff_insert on public.categories for insert to authenticated with check (public.is_staff('editor'));
drop policy if exists categories_staff_update on public.categories;
create policy categories_staff_update on public.categories for update to authenticated using (public.is_staff('editor')) with check (public.is_staff('editor'));
drop policy if exists categories_staff_delete on public.categories;
create policy categories_staff_delete on public.categories for delete to authenticated using (public.is_staff('editor'));

drop policy if exists seasons_public_select on public.seasons;
create policy seasons_public_select on public.seasons for select to anon, authenticated using (true);
drop policy if exists seasons_staff_insert on public.seasons;
create policy seasons_staff_insert on public.seasons for insert to authenticated with check (public.is_staff('editor'));
drop policy if exists seasons_staff_update on public.seasons;
create policy seasons_staff_update on public.seasons for update to authenticated using (public.is_staff('editor')) with check (public.is_staff('editor'));
drop policy if exists seasons_staff_delete on public.seasons;
create policy seasons_staff_delete on public.seasons for delete to authenticated using (public.is_staff('editor'));

drop policy if exists products_public_select on public.products;
create policy products_public_select on public.products for select to anon, authenticated using (published or public.is_staff('editor'));
drop policy if exists products_staff_insert on public.products;
create policy products_staff_insert on public.products for insert to authenticated with check (public.is_staff('editor'));
drop policy if exists products_staff_update on public.products;
create policy products_staff_update on public.products for update to authenticated using (public.is_staff('editor')) with check (public.is_staff('editor'));
drop policy if exists products_staff_delete on public.products;
create policy products_staff_delete on public.products for delete to authenticated using (public.is_staff('editor'));

drop policy if exists product_images_public_select on public.product_images;
create policy product_images_public_select on public.product_images for select to anon, authenticated using (exists (select 1 from public.products p where p.id = product_id and (p.published or public.is_staff('editor'))));
drop policy if exists product_images_staff_insert on public.product_images;
create policy product_images_staff_insert on public.product_images for insert to authenticated with check (public.is_staff('editor'));
drop policy if exists product_images_staff_update on public.product_images;
create policy product_images_staff_update on public.product_images for update to authenticated using (public.is_staff('editor')) with check (public.is_staff('editor'));
drop policy if exists product_images_staff_delete on public.product_images;
create policy product_images_staff_delete on public.product_images for delete to authenticated using (public.is_staff('editor'));

drop policy if exists product_seasons_public_select on public.product_seasons;
create policy product_seasons_public_select on public.product_seasons for select to anon, authenticated using (exists (select 1 from public.products p where p.id = product_id and (p.published or public.is_staff('editor'))));
drop policy if exists product_seasons_staff_insert on public.product_seasons;
create policy product_seasons_staff_insert on public.product_seasons for insert to authenticated with check (public.is_staff('editor'));
drop policy if exists product_seasons_staff_delete on public.product_seasons;
create policy product_seasons_staff_delete on public.product_seasons for delete to authenticated using (public.is_staff('editor'));

-- Contenus et réglages.
drop policy if exists contents_public_select on public.site_contents;
create policy contents_public_select on public.site_contents for select to anon, authenticated using (public.is_staff('editor') or page in ('accueil', 'creations', 'personnalisation', 'a-propos', 'contact', 'footer', 'referencement'));
drop policy if exists contents_staff_insert on public.site_contents;
create policy contents_staff_insert on public.site_contents for insert to authenticated with check (public.is_staff('editor'));
drop policy if exists contents_staff_update on public.site_contents;
create policy contents_staff_update on public.site_contents for update to authenticated using (public.is_staff('editor')) with check (public.is_staff('editor'));
drop policy if exists contents_staff_delete on public.site_contents;
create policy contents_staff_delete on public.site_contents for delete to authenticated using (public.is_staff('editor'));

drop policy if exists settings_public_select on public.site_settings;
create policy settings_public_select on public.site_settings for select to anon, authenticated using (is_public or public.is_staff('admin'));
drop policy if exists settings_admin_insert on public.site_settings;
create policy settings_admin_insert on public.site_settings for insert to authenticated with check (public.is_staff('admin'));
drop policy if exists settings_admin_update on public.site_settings;
create policy settings_admin_update on public.site_settings for update to authenticated using (public.is_staff('admin')) with check (public.is_staff('admin'));
drop policy if exists settings_admin_delete on public.site_settings;
create policy settings_admin_delete on public.site_settings for delete to authenticated using (public.is_staff('admin'));

-- Visiteurs : insertion uniquement, aucune lecture des demandes.
drop policy if exists requests_public_insert on public.contact_requests;
create policy requests_public_insert on public.contact_requests for insert to anon, authenticated with check (consent = true and length(trim(email)) between 5 and 254 and length(trim(message)) between 1 and 5000);
drop policy if exists requests_staff_select on public.contact_requests;
create policy requests_staff_select on public.contact_requests for select to authenticated using (public.is_staff('editor'));
drop policy if exists requests_staff_update on public.contact_requests;
create policy requests_staff_update on public.contact_requests for update to authenticated using (public.is_staff('editor')) with check (public.is_staff('editor'));
drop policy if exists requests_staff_delete on public.contact_requests;
create policy requests_staff_delete on public.contact_requests for delete to authenticated using (public.is_staff('editor'));

drop policy if exists audit_admin_select on public.audit_logs;
create policy audit_admin_select on public.audit_logs for select to authenticated using (public.is_staff('admin'));
drop policy if exists audit_admin_insert on public.audit_logs;
create policy audit_admin_insert on public.audit_logs for insert to authenticated with check (public.is_staff('admin'));

insert into public.categories (name, slug, description, display_order) values
('Naissance et enfance', 'naissance-enfance', 'Pour les premiers souvenirs et les grandes étapes de l’enfance.', 1),
('Famille', 'famille', 'Des créations qui rassemblent les visages et les cœurs.', 2),
('Amitié', 'amitie', 'Pour célébrer les liens précieux.', 3),
('Amour et mariage', 'amour-mariage', 'Pour les déclarations et les grandes occasions.', 4),
('Décorations saisonnières', 'decorations-saisonnieres', 'L’atelier au fil des saisons.', 5),
('Cadeaux personnalisés', 'cadeaux-personnalises', 'Une création qui n’appartient qu’à son destinataire.', 6)
on conflict (slug) do nothing;

insert into public.seasons (name, slug, color, icon, display_order) values
('Printemps', 'printemps', '#8F9D83', 'flower', 1),
('Été', 'ete', '#D5AD78', 'sun', 2),
('Automne', 'automne', '#C77C5D', 'leaf', 3),
('Hiver et fêtes', 'hiver', '#49372B', 'snowflake', 4),
('Toutes saisons', 'toutes-saisons', '#E8D7BE', 'sparkles', 5)
on conflict (slug) do nothing;

insert into public.site_settings (setting_key, setting_value, is_public) values
('brand_name', '"L''Atelier d''Isabelle"', true),
('slogan', '"Fait main au rythme des saisons"', true),
('email', '""', true),
('phone', '""', true),
('city', '""', true),
('region', '""', true),
('service_area', '""', true),
('hours', '""', true),
('facebook', '""', true),
('instagram', '""', true),
('logo', '"/logo-atelier-isabelle-transparent.png"', true),
('footer_text', '"Créations décoratives faites main, au rythme des saisons."', true),
('seo_general', '{"title":"L''Atelier d''Isabelle — Créations artisanales faites main","description":"Décorations faites main en galets, papier, bois et fil de fer."}', true)
on conflict (setting_key) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
('product-images', 'product-images', true, 8388608, array['image/jpeg','image/png','image/webp']),
('site-images', 'site-images', true, 8388608, array['image/jpeg','image/png','image/webp','image/svg+xml']),
('request-attachments', 'request-attachments', false, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Storage : lecture publique uniquement pour les deux bibliothèques publiques.
drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects for select to anon, authenticated using (bucket_id in ('product-images', 'site-images'));
drop policy if exists product_images_staff_insert on storage.objects;
create policy product_images_staff_insert on storage.objects for insert to authenticated with check (bucket_id in ('product-images', 'site-images') and public.is_staff('editor'));
drop policy if exists product_images_staff_update on storage.objects;
create policy product_images_staff_update on storage.objects for update to authenticated using (bucket_id in ('product-images', 'site-images') and public.is_staff('editor')) with check (bucket_id in ('product-images', 'site-images') and public.is_staff('editor'));
drop policy if exists product_images_staff_delete on storage.objects;
create policy product_images_staff_delete on storage.objects for delete to authenticated using (bucket_id in ('product-images', 'site-images') and public.is_staff('editor'));
drop policy if exists request_attachment_staff_read on storage.objects;
create policy request_attachment_staff_read on storage.objects for select to authenticated using (bucket_id = 'request-attachments' and public.is_staff('editor'));
drop policy if exists request_attachment_anon_insert on storage.objects;
create policy request_attachment_anon_insert on storage.objects for insert to anon, authenticated with check (bucket_id = 'request-attachments');
