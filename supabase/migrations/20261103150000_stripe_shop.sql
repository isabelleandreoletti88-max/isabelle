/*
# Boutique en ligne (Stripe), pilotée depuis l'administration

Isabelle ne va jamais sur Stripe : la fonction `stripe-sync` crée et met à jour le produit,
le prix et le lien de paiement Stripe à chaque enregistrement d'une création ; la fonction
`stripe-webhook` enregistre les commandes payées.

1. Créations : vente en ligne (`sell_online`) et identifiants Stripe synchronisés.
2. Commandes (`orders`) : visibles uniquement par l'équipe.
3. Configuration Stripe privée (`private.stripe_config`) : secret du webhook et tarif
   de livraison, lisibles uniquement par les fonctions serveur (service_role).
*/

alter table public.products
  add column if not exists sell_online boolean not null default false,
  add column if not exists stripe_product_id text,
  add column if not exists stripe_price_id text,
  add column if not exists stripe_payment_link_id text,
  add column if not exists stripe_payment_link_url text,
  add column if not exists stripe_synced_at timestamptz,
  add column if not exists stripe_sync_error text;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null default 1,
  amount_total numeric(10,2) not null,
  shipping_amount numeric(10,2) not null default 0,
  currency text not null default 'eur',
  customer_name text,
  customer_email text,
  customer_phone text,
  shipping_address jsonb,
  status text not null default 'paid' check (status in ('paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
drop policy if exists orders_staff_select on public.orders;
create policy orders_staff_select on public.orders for select to authenticated using (private.is_staff('editor'));
drop policy if exists orders_staff_update on public.orders;
create policy orders_staff_update on public.orders for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));

create table if not exists private.stripe_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
revoke all on private.stripe_config from public, anon, authenticated;
grant usage on schema private to service_role;
grant all on private.stripe_config to service_role;

-- Réglages publics de la boutique (modifiables dans Paramètres).
insert into public.site_settings (setting_key, setting_value, is_public) values
  ('shop_enabled', to_jsonb('false'::text), true),
  ('shop_shipping_fee', to_jsonb('6.90'::text), true),
  ('shop_shipping_note', to_jsonb('Livraison en France métropolitaine.'::text), true)
on conflict (setting_key) do nothing;

-- Lecture par les fonctions serveur de la configuration privée (exécutable uniquement par service_role).
create or replace function public.stripe_config_get(config_key text)
returns text language sql stable security definer set search_path = private as $$
  select value from private.stripe_config where key = config_key;
$$;
create or replace function public.stripe_config_set(config_key text, config_value text)
returns void language sql security definer set search_path = private as $$
  insert into private.stripe_config (key, value, updated_at) values (config_key, config_value, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
$$;
revoke all on function public.stripe_config_get(text) from public, anon, authenticated;
revoke all on function public.stripe_config_set(text, text) from public, anon, authenticated;
grant execute on function public.stripe_config_get(text) to service_role;
grant execute on function public.stripe_config_set(text, text) to service_role;
drop function if exists private.get_stripe_config(text);
drop function if exists private.set_stripe_config(text, text);
