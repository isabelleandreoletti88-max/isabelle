-- Structure finale de L'Atelier d'Isabelle (état après toutes les migrations de l'export),
-- sans les données de départ en double, avec les règles RLS consolidées.
begin;

create extension if not exists pgcrypto;
create schema if not exists private;

-- Tables ---------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
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

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text not null default '#8F9D83',
  icon text not null default 'leaf',
  display_order integer not null default 0,
  image text
);

create table public.products (
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

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt_text text not null default '',
  display_order integer not null default 0,
  is_main boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.product_seasons (
  product_id uuid not null references public.products(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  primary key (product_id, season_id)
);

create table public.site_contents (
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

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null default '""'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.contact_requests (
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

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.legal_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null default '""'::jsonb,
  category text not null default 'identity',
  is_required boolean not null default false,
  is_completed boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  is_public boolean not null default false
);

create table public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null unique,
  title text not null,
  slug text not null unique,
  content text,
  status text not null default 'published' check (status in ('draft', 'published', 'disabled')),
  version integer not null default 1,
  effective_date date,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create table public.legal_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.legal_documents(id) on delete cascade,
  version integer not null,
  content text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  consent_type text not null default 'cookies',
  document_version integer,
  choice jsonb not null default '{}'::jsonb,
  pseudonymous_id text,
  created_at timestamptz not null default now()
);

create table public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  chapter text not null default '',
  number text not null default '',
  image text,
  video_id text,
  eyebrow text not null default '',
  title text not null default '',
  poem text not null default '',
  quote text not null default '',
  cta_label text not null default '',
  cta_to text not null default '/',
  detail_label_1 text not null default '',
  detail_value_1 text not null default '',
  detail_label_2 text not null default '',
  detail_value_2 text not null default '',
  palette_accent text not null default 'from-honey via-amber to-honey-light',
  palette_accent_soft text not null default 'from-honey/20',
  palette_text text not null default 'text-honey-dark',
  palette_number text not null default 'text-honey/30',
  display_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null default '',
  description text not null default '',
  image text,
  start_date date,
  end_date date,
  is_permanent boolean not null default false,
  display_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index ----------------------------------------------------------------

create index products_published_idx on public.products (published, display_order);
create index products_category_idx on public.products (category_id);
create index products_updated_idx on public.products (updated_at desc);
create index product_images_product_idx on public.product_images (product_id, display_order);
create index contact_requests_status_idx on public.contact_requests (status, created_at desc);
create index contact_requests_email_idx on public.contact_requests (lower(email));
create index legal_settings_category_idx on public.legal_settings (category);
create index legal_documents_slug_idx on public.legal_documents (slug);
create index legal_document_versions_doc_idx on public.legal_document_versions (document_id, version desc);
create index consent_records_created_idx on public.consent_records (created_at desc);
create index hero_slides_published_idx on public.hero_slides (published, display_order);

-- Fonctions et triggers ------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_published_at()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.published = true and old.published = false then new.published_at = coalesce(new.published_at, now()); end if;
  if new.published = false then new.published_at = null; end if;
  return new;
end;
$$;

create or replace function private.is_staff(required_role text default 'editor')
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.role = 'admin' or (required_role = 'editor' and p.role = 'editor'))
  );
$$;
revoke all on function private.is_staff(text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_staff(text) to authenticated;

-- Conservée pour compatibilité avec le code du site (appels éventuels en RPC).
create or replace function public.is_staff(required_role text default 'editor')
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.role = 'admin' or (required_role = 'editor' and p.role = 'editor'))
  );
$$;
revoke all on function public.is_staff(text) from public;
grant execute on function public.is_staff(text) to anon, authenticated;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger products_published_at before update on public.products for each row execute function public.set_published_at();
create trigger site_contents_updated_at before update on public.site_contents for each row execute function public.set_updated_at();
create trigger site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
create trigger contact_requests_updated_at before update on public.contact_requests for each row execute function public.set_updated_at();
create trigger legal_settings_updated_at before update on public.legal_settings for each row execute function public.set_updated_at();
create trigger legal_documents_updated_at before update on public.legal_documents for each row execute function public.set_updated_at();
create trigger hero_slides_updated_at before update on public.hero_slides for each row execute function public.set_updated_at();
create trigger events_updated_at before update on public.events for each row execute function public.set_updated_at();

-- RLS ------------------------------------------------------------------
-- Les lectures publiques n'appellent jamais private.is_staff (non exécutable par anon) ;
-- les lectures réservées à l'équipe sont des politiques séparées.

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
alter table public.legal_settings enable row level security;
alter table public.legal_documents enable row level security;
alter table public.legal_document_versions enable row level security;
alter table public.consent_records enable row level security;
alter table public.hero_slides enable row level security;
alter table public.events enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid() or private.is_staff('admin'));
create policy profiles_insert_admin on public.profiles for insert to authenticated with check (private.is_staff('admin'));
create policy profiles_update_admin on public.profiles for update to authenticated using (private.is_staff('admin')) with check (private.is_staff('admin'));
create policy profiles_delete_admin on public.profiles for delete to authenticated using (private.is_staff('admin'));

create policy categories_public_select on public.categories for select to anon, authenticated using (published);
create policy categories_staff_select on public.categories for select to authenticated using (private.is_staff('editor'));
create policy categories_staff_insert on public.categories for insert to authenticated with check (private.is_staff('editor'));
create policy categories_staff_update on public.categories for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
create policy categories_staff_delete on public.categories for delete to authenticated using (private.is_staff('editor'));

create policy seasons_public_select on public.seasons for select to anon, authenticated using (true);
create policy seasons_staff_insert on public.seasons for insert to authenticated with check (private.is_staff('editor'));
create policy seasons_staff_update on public.seasons for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
create policy seasons_staff_delete on public.seasons for delete to authenticated using (private.is_staff('editor'));

create policy products_public_select on public.products for select to anon, authenticated using (published);
create policy products_staff_select on public.products for select to authenticated using (private.is_staff('editor'));
create policy products_staff_insert on public.products for insert to authenticated with check (private.is_staff('editor'));
create policy products_staff_update on public.products for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
create policy products_staff_delete on public.products for delete to authenticated using (private.is_staff('editor'));

create policy product_images_public_select on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_images.product_id and p.published));
create policy product_images_staff_select on public.product_images for select to authenticated using (private.is_staff('editor'));
create policy product_images_staff_insert on public.product_images for insert to authenticated with check (private.is_staff('editor'));
create policy product_images_staff_update on public.product_images for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
create policy product_images_staff_delete on public.product_images for delete to authenticated using (private.is_staff('editor'));

create policy product_seasons_public_select on public.product_seasons for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_seasons.product_id and p.published));
create policy product_seasons_staff_select on public.product_seasons for select to authenticated using (private.is_staff('editor'));
create policy product_seasons_staff_insert on public.product_seasons for insert to authenticated with check (private.is_staff('editor'));
create policy product_seasons_staff_delete on public.product_seasons for delete to authenticated using (private.is_staff('editor'));

create policy contents_public_select on public.site_contents for select to anon, authenticated
  using (page in ('accueil', 'creations', 'personnalisation', 'a-propos', 'contact', 'footer', 'referencement'));
create policy contents_staff_select on public.site_contents for select to authenticated using (private.is_staff('editor'));
create policy contents_staff_insert on public.site_contents for insert to authenticated with check (private.is_staff('editor'));
create policy contents_staff_update on public.site_contents for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
create policy contents_staff_delete on public.site_contents for delete to authenticated using (private.is_staff('editor'));

create policy settings_public_select on public.site_settings for select to anon, authenticated using (is_public);
create policy settings_admin_select on public.site_settings for select to authenticated using (private.is_staff('admin'));
create policy settings_admin_insert on public.site_settings for insert to authenticated with check (private.is_staff('admin'));
create policy settings_admin_update on public.site_settings for update to authenticated using (private.is_staff('admin')) with check (private.is_staff('admin'));
create policy settings_admin_delete on public.site_settings for delete to authenticated using (private.is_staff('admin'));

create policy requests_public_insert on public.contact_requests for insert to anon, authenticated
  with check (consent = true and length(trim(email)) between 5 and 254 and length(trim(message)) between 1 and 5000);
create policy requests_staff_select on public.contact_requests for select to authenticated using (private.is_staff('editor'));
create policy requests_staff_update on public.contact_requests for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
create policy requests_staff_delete on public.contact_requests for delete to authenticated using (private.is_staff('editor'));

create policy audit_admin_select on public.audit_logs for select to authenticated using (private.is_staff('admin'));
create policy audit_admin_insert on public.audit_logs for insert to authenticated with check (private.is_staff('admin'));

create policy legal_settings_public_select on public.legal_settings for select to anon, authenticated using (is_public = true);
create policy legal_settings_staff_select on public.legal_settings for select to authenticated using (private.is_staff('editor'));
create policy legal_settings_staff_insert on public.legal_settings for insert to authenticated with check (private.is_staff('editor'));
create policy legal_settings_staff_update on public.legal_settings for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
create policy legal_settings_staff_delete on public.legal_settings for delete to authenticated using (private.is_staff('editor'));

create policy legal_documents_public_select on public.legal_documents for select to anon, authenticated using (status = 'published');
create policy legal_documents_staff_select on public.legal_documents for select to authenticated using (private.is_staff('editor'));
create policy legal_documents_staff_insert on public.legal_documents for insert to authenticated with check (private.is_staff('editor'));
create policy legal_documents_staff_update on public.legal_documents for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
create policy legal_documents_staff_delete on public.legal_documents for delete to authenticated using (private.is_staff('editor'));

create policy legal_versions_admin_select on public.legal_document_versions for select to authenticated using (private.is_staff('admin'));
create policy legal_versions_admin_insert on public.legal_document_versions for insert to authenticated with check (private.is_staff('admin'));

create policy consent_public_insert on public.consent_records for insert to anon, authenticated with check (true);
create policy consent_admin_select on public.consent_records for select to authenticated using (private.is_staff('admin'));

create policy hero_slides_public_select on public.hero_slides for select to anon, authenticated using (published);
create policy hero_slides_staff_select on public.hero_slides for select to authenticated using (private.is_staff('editor'));
create policy hero_slides_staff_insert on public.hero_slides for insert to authenticated with check (private.is_staff('editor'));
create policy hero_slides_staff_update on public.hero_slides for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
create policy hero_slides_staff_delete on public.hero_slides for delete to authenticated using (private.is_staff('editor'));

-- Corrigé : la source autorisait tout utilisateur connecté à modifier les événements.
create policy public_read_events on public.events for select to anon, authenticated using (published = true);
create policy staff_select_events on public.events for select to authenticated using (private.is_staff('editor'));
create policy staff_insert_events on public.events for insert to authenticated with check (private.is_staff('editor'));
create policy staff_update_events on public.events for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
create policy staff_delete_events on public.events for delete to authenticated using (private.is_staff('editor'));

-- Storage --------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
('product-images', 'product-images', true, 8388608, array['image/jpeg','image/png','image/webp']),
('site-images', 'site-images', true, 8388608, array['image/jpeg','image/png','image/webp','image/svg+xml']),
('request-attachments', 'request-attachments', false, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy product_images_public_read on storage.objects for select to anon, authenticated using (bucket_id in ('product-images', 'site-images'));
create policy product_images_staff_insert on storage.objects for insert to authenticated with check (bucket_id in ('product-images', 'site-images') and private.is_staff('editor'));
create policy product_images_staff_update on storage.objects for update to authenticated using (bucket_id in ('product-images', 'site-images') and private.is_staff('editor')) with check (bucket_id in ('product-images', 'site-images') and private.is_staff('editor'));
create policy product_images_staff_delete on storage.objects for delete to authenticated using (bucket_id in ('product-images', 'site-images') and private.is_staff('editor'));
create policy request_attachment_staff_read on storage.objects for select to authenticated using (bucket_id = 'request-attachments' and private.is_staff('editor'));
create policy request_attachment_anon_insert on storage.objects for insert to anon, authenticated with check (bucket_id = 'request-attachments');

commit;
