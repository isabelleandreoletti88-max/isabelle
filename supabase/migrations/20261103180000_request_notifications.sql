/*
# E-mail à chaque nouvelle demande du site

La fonction `notify-request` envoie un e-mail à l'atelier pour chaque demande reçue par les
formulaires (contact, personnalisation). `notified_at` évite tout envoi en double.
*/
alter table public.contact_requests add column if not exists notified_at timestamptz;
alter table public.contact_requests add column if not exists notify_error text;

insert into public.site_settings (setting_key, setting_value, is_public) values
  ('notification_email', to_jsonb('contact@atelier-isabelle.fr'::text), false)
on conflict (setting_key) do nothing;
