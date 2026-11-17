-- Jours de présence d'Isabelle au lieu de retrait (JSON : [{ day, open, hours }]), réglés dans Paramètres de livraison.
insert into public.site_settings (setting_key, setting_value, is_public) values ('shop_pickup_schedule', to_jsonb(''::text), true)
on conflict (setting_key) do nothing;
