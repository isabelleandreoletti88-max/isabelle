/*
# Restrict public legal settings

1. Security change
- Adds an explicit is_public flag to legal settings.
- Public visitors can only read settings intended to appear in legal pages.
- Staff can still read and edit all settings.
- Internal audit fields and future configuration remain hidden until explicitly published.
*/

alter table public.legal_settings add column if not exists is_public boolean not null default false;

update public.legal_settings
set is_public = true
where setting_key in (
  'editor_trade_name','editor_full_name','editor_legal_form','editor_address','editor_email','editor_phone','editor_siren','editor_siret','editor_rcs','editor_rcs_city','editor_capital','editor_vat_number','editor_vat_franchise','editor_activity','editor_publication_director',
  'host_name','host_company','host_address','host_phone','host_website',
  'mediator_name','mediator_address','mediator_website','mediator_process',
  'dpo_controller','dpo_email','dpo_address','dpo_dpo','data_processors','data_hosting_location','data_eeu_transfers','data_retention_contact','data_retention_orders','data_retention_accounts','privacy_update_date',
  'ecommerce_enabled','ecommerce_payment_methods','ecommerce_delivery_zones','ecommerce_carriers','ecommerce_shipping_fees','ecommerce_prep_time','ecommerce_delivery_time','ecommerce_return_address','ecommerce_return_fees','ecommerce_complaints','ecommerce_warranty','ecommerce_cgv_date',
  'cookies_audience_tools','cookies_third_party','cookies_update_date'
);

drop policy if exists legal_settings_public_select on public.legal_settings;
create policy legal_settings_public_select on public.legal_settings for select to anon, authenticated using (is_public = true);
drop policy if exists legal_settings_staff_select on public.legal_settings;
create policy legal_settings_staff_select on public.legal_settings for select to authenticated using (private.is_staff('editor'));
drop policy if exists legal_settings_staff_update on public.legal_settings;
create policy legal_settings_staff_update on public.legal_settings for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
