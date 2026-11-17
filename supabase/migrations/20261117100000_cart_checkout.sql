/*
# Panier, paiement Stripe Checkout et livraison

Remplace la vente par « lien de paiement » (une création = un lien) par un panier :
le site envoie la liste des créations et le mode de réception, la fonction serveur
`checkout-create` recalcule tout depuis le catalogue et crée la session Stripe Checkout.

1. `orders` : une commande par passage au paiement (créée « en attente », passée « payée »
   uniquement par le webhook Stripe signé). Deux statuts distincts :
   - payment_status : pending, processing (paiement différé), paid, failed, expired, cancelled, refunded
   - fulfillment_status : to_prepare, ready_for_pickup, shipped, completed, cancelled
   Le numéro de commande (CMD-2026-0001) n'est attribué qu'au paiement : pas de trou
   dans la numérotation à cause des paniers abandonnés.
2. `order_items` : les articles, avec le prix au moment de la commande.
3. `stripe_events` : identifiants des événements Stripe déjà traités (idempotence).
4. Réglages de livraison et de retrait (site_settings), modifiables dans l'administration.

La table `orders` précédente était vide : elle est recréée.
*/

drop table if exists public.orders cascade;

create sequence if not exists public.order_number_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  public_token uuid not null unique default gen_random_uuid(),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'processing', 'paid', 'failed', 'expired', 'cancelled', 'refunded')),
  fulfillment_status text not null default 'to_prepare'
    check (fulfillment_status in ('to_prepare', 'ready_for_pickup', 'shipped', 'completed', 'cancelled')),
  delivery_method text not null check (delivery_method in ('shipping', 'pickup')),
  customer_first_name text not null,
  customer_last_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_name text,
  shipping_address jsonb,
  pickup_location jsonb,
  subtotal_amount numeric(10,2) not null,
  shipping_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null,
  amount_paid numeric(10,2),
  currency text not null default 'eur',
  stripe_mode text,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  terms_accepted_at timestamptz not null,
  carrier text,
  tracking_number text,
  admin_notes text,
  alerts text[] not null default '{}',
  paid_at timestamptz,
  ready_at timestamptz,
  shipped_at timestamptz,
  confirmation_email_sent_at timestamptz,
  admin_email_sent_at timestamptz,
  ready_email_sent_at timestamptz,
  shipped_email_sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_slug text,
  image_url text,
  unit_price numeric(10,2) not null check (unit_price > 0),
  quantity integer not null check (quantity between 1 and 20),
  line_total numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

create index orders_created_idx on public.orders (created_at desc);
create index orders_payment_idx on public.orders (payment_status);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

-- Numéro de commande attribué au passage « payée ».
create or replace function public.assign_order_number()
returns trigger language plpgsql as $$
begin
  if new.payment_status = 'paid' and new.order_number is null then
    new.order_number := 'CMD-' || to_char(now() at time zone 'Europe/Paris', 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 4, '0');
  end if;
  return new;
end $$;
drop trigger if exists orders_assign_number on public.orders;
create trigger orders_assign_number before insert or update of payment_status on public.orders for each row execute function public.assign_order_number();

-- Accès : lecture et mise à jour par l'équipe ; création uniquement par les fonctions serveur.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.stripe_events enable row level security;

create policy orders_staff_select on public.orders for select to authenticated using (private.is_staff('editor'));
create policy orders_staff_update on public.orders for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
create policy order_items_staff_select on public.order_items for select to authenticated using (private.is_staff('editor'));

revoke all on public.stripe_events from anon, authenticated;
revoke insert, delete on public.orders from anon, authenticated;
revoke insert, update, delete on public.order_items from anon, authenticated;

-- Réglages de livraison (publics : affichés dans le panier).
update public.site_settings set setting_value = to_jsonb('5.90'::text) where setting_key = 'shop_shipping_fee' and setting_value = to_jsonb('6.90'::text);
insert into public.site_settings (setting_key, setting_value, is_public) values
  ('shop_home_delivery_enabled', to_jsonb('true'::text), true),
  ('shop_pickup_enabled', to_jsonb('true'::text), true),
  ('shop_pickup_name', to_jsonb(''::text), true),
  ('shop_pickup_address', to_jsonb(''::text), true),
  ('shop_pickup_instructions', to_jsonb('Vous recevrez un e-mail dès que votre commande sera prête à être retirée.'::text), true)
on conflict (setting_key) do nothing;
