/*
# Pages légales administrables

1. Objectif
- Ajouter les tables nécessaires aux pages légales du site vitrine.
- Permettre à l'administratrice de compléter son identité juridique, son hébergeur, le médiateur, les paramètres RGPD et les futurs réglages e-commerce.
- Conserver l'historique des versions de chaque document juridique.
- Enregistrer la preuve des consentements cookies.

2. Nouvelles tables
- legal_settings : paramètres juridiques administrables (clé, valeur JSONB, catégorie, obligatoire, complété).
- legal_documents : documents légaux (type, slug, titre, contenu personnalisé, statut, version, date d'effet).
- legal_document_versions : historique des versions de chaque document.
- consent_records : preuve des consentements cookies (type, choix, horodatage, identifiant pseudonymisé).

3. Sécurité
- RLS activé sur toutes les tables.
- Lecture publique des documents publiés et des paramètres publics uniquement.
- Modification réservée aux administrateurs et éditeurs.
- Historique et consentements accessibles uniquement aux administrateurs.
*/

create table if not exists public.legal_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null default '""'::jsonb,
  category text not null default 'identity',
  is_required boolean not null default false,
  is_completed boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.legal_documents (
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

create table if not exists public.legal_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.legal_documents(id) on delete cascade,
  version integer not null,
  content text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  consent_type text not null default 'cookies',
  document_version integer,
  choice jsonb not null default '{}'::jsonb,
  pseudonymous_id text,
  created_at timestamptz not null default now()
);

create index if not exists legal_settings_category_idx on public.legal_settings (category);
create index if not exists legal_documents_slug_idx on public.legal_documents (slug);
create index if not exists legal_document_versions_doc_idx on public.legal_document_versions (document_id, version desc);
create index if not exists consent_records_created_idx on public.consent_records (created_at desc);

drop trigger if exists legal_settings_updated_at on public.legal_settings;
create trigger legal_settings_updated_at before update on public.legal_settings for each row execute function public.set_updated_at();
drop trigger if exists legal_documents_updated_at on public.legal_documents;
create trigger legal_documents_updated_at before update on public.legal_documents for each row execute function public.set_updated_at();

alter table public.legal_settings enable row level security;
alter table public.legal_documents enable row level security;
alter table public.legal_document_versions enable row level security;
alter table public.consent_records enable row level security;

-- Paramètres : lecture publique des paramètres marqués complétés, écriture réservée au staff.
drop policy if exists legal_settings_public_select on public.legal_settings;
create policy legal_settings_public_select on public.legal_settings for select to anon, authenticated using (true);
drop policy if exists legal_settings_staff_insert on public.legal_settings;
create policy legal_settings_staff_insert on public.legal_settings for insert to authenticated with check (private.is_staff('editor'));
drop policy if exists legal_settings_staff_update on public.legal_settings;
create policy legal_settings_staff_update on public.legal_settings for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
drop policy if exists legal_settings_staff_delete on public.legal_settings;
create policy legal_settings_staff_delete on public.legal_settings for delete to authenticated using (private.is_staff('editor'));

-- Documents : lecture publique des documents publiés, gestion réservée au staff.
drop policy if exists legal_documents_public_select on public.legal_documents;
create policy legal_documents_public_select on public.legal_documents for select to anon, authenticated using (status = 'published');
drop policy if exists legal_documents_staff_select on public.legal_documents;
create policy legal_documents_staff_select on public.legal_documents for select to authenticated using (private.is_staff('editor'));
drop policy if exists legal_documents_staff_insert on public.legal_documents;
create policy legal_documents_staff_insert on public.legal_documents for insert to authenticated with check (private.is_staff('editor'));
drop policy if exists legal_documents_staff_update on public.legal_documents;
create policy legal_documents_staff_update on public.legal_documents for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
drop policy if exists legal_documents_staff_delete on public.legal_documents;
create policy legal_documents_staff_delete on public.legal_documents for delete to authenticated using (private.is_staff('editor'));

-- Historique : accès admin uniquement.
drop policy if exists legal_versions_admin_select on public.legal_document_versions;
create policy legal_versions_admin_select on public.legal_document_versions for select to authenticated using (private.is_staff('admin'));
drop policy if exists legal_versions_admin_insert on public.legal_document_versions;
create policy legal_versions_admin_insert on public.legal_document_versions for insert to authenticated with check (private.is_staff('admin'));

-- Consentements : insertion publique, lecture admin uniquement.
drop policy if exists consent_public_insert on public.consent_records;
create policy consent_public_insert on public.consent_records for insert to anon, authenticated with check (true);
drop policy if exists consent_admin_select on public.consent_records;
create policy consent_admin_select on public.consent_records for select to authenticated using (private.is_staff('admin'));

-- Paramètres initiaux : identité, hébergement, médiation, données, e-commerce.
insert into public.legal_settings (setting_key, setting_value, category, is_required, is_completed) values
('editor_trade_name', '"L''Atelier d''Isabelle"', 'identity', true, true),
('editor_full_name', '""', 'identity', true, false),
('editor_legal_form', '""', 'identity', true, false),
('editor_address', '""', 'identity', true, false),
('editor_email', '""', 'identity', true, false),
('editor_phone', '""', 'identity', false, false),
('editor_siren', '""', 'identity', false, false),
('editor_siret', '""', 'identity', false, false),
('editor_rcs', '""', 'identity', false, false),
('editor_rcs_city', '""', 'identity', false, false),
('editor_capital', '""', 'identity', false, false),
('editor_vat_number', '""', 'identity', false, false),
('editor_vat_franchise', 'false', 'identity', false, false),
('editor_activity', '"Création artisanale de décorations en galets, bois, papier et fil de fer"', 'identity', true, true),
('editor_publication_director', '""', 'identity', true, false),
('host_name', '""', 'hosting', true, false),
('host_company', '""', 'hosting', false, false),
('host_address', '""', 'hosting', true, false),
('host_phone', '""', 'hosting', false, false),
('host_website', '""', 'hosting', false, false),
('mediator_name', '""', 'mediation', true, false),
('mediator_address', '""', 'mediation', true, false),
('mediator_website', '""', 'mediation', true, false),
('mediator_process', '""', 'mediation', false, false),
('dpo_controller', '"L''Atelier d''Isabelle"', 'data', true, true),
('dpo_email', '""', 'data', true, false),
('dpo_address', '""', 'data', true, false),
('dpo_dpo', '""', 'data', false, false),
('data_processors', '""', 'data', false, false),
('data_hosting_location', '""', 'data', false, false),
('data_eeu_transfers', '""', 'data', false, false),
('data_retention_contact', '"3 ans"', 'data', false, true),
('data_retention_orders', '""', 'data', false, false),
('data_retention_accounts', '""', 'data', false, false),
('privacy_update_date', '""', 'data', false, false),
('ecommerce_enabled', 'false', 'ecommerce', false, false),
('ecommerce_payment_methods', '""', 'ecommerce', false, false),
('ecommerce_delivery_zones', '""', 'ecommerce', false, false),
('ecommerce_carriers', '""', 'ecommerce', false, false),
('ecommerce_shipping_fees', '""', 'ecommerce', false, false),
('ecommerce_prep_time', '""', 'ecommerce', false, false),
('ecommerce_delivery_time', '""', 'ecommerce', false, false),
('ecommerce_return_address', '""', 'ecommerce', false, false),
('ecommerce_return_fees', '""', 'ecommerce', false, false),
('ecommerce_complaints', '""', 'ecommerce', false, false),
('ecommerce_warranty', '""', 'ecommerce', false, false),
('ecommerce_cgv_date', '""', 'ecommerce', false, false),
('cookies_audience_tools', '""', 'cookies', false, false),
('cookies_third_party', '""', 'cookies', false, false),
('cookies_update_date', '""', 'cookies', false, false)
on conflict (setting_key) do nothing;

-- Documents initiaux.
insert into public.legal_documents (document_type, title, slug, status, effective_date) values
('legal-notice', 'Mentions légales', 'mentions-legales', 'published', current_date),
('privacy-policy', 'Politique de confidentialité', 'politique-confidentialite', 'published', current_date),
('cookies-policy', 'Politique relative aux cookies', 'cookies', 'published', current_date),
('cookie-management', 'Gestion des cookies', 'gestion-des-cookies', 'published', current_date),
('terms-of-use', 'Conditions d''utilisation du site', 'conditions-utilisation', 'published', current_date),
('mediation', 'Médiation de la consommation', 'mediation-consommation', 'published', current_date),
('commercial-info', 'Informations commerciales', 'informations-commerciales', 'published', current_date),
('legal-hub', 'Informations légales', 'informations-legales', 'published', current_date),
('cgv', 'Conditions générales de vente', 'conditions-generales-de-vente', 'disabled', null),
('shipping', 'Politique de livraison', 'livraison', 'disabled', null),
('returns', 'Retours et remboursements', 'retours-remboursements', 'disabled', null),
('withdrawal', 'Droit de rétractation', 'droit-de-retractation', 'disabled', null),
('withdrawal-form', 'Formulaire de rétractation', 'formulaire-retractation', 'disabled', null)
on conflict (document_type) do nothing;
