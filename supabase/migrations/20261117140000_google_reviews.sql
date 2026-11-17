/*
# Avis Google

1. Réglages publics : lien « Donner mon avis », identifiant de la fiche Google,
   affichage de la section, note minimale des avis affichés.
2. Cache des avis (google_reviews_cache) : rempli par la fonction `google-reviews`
   (au plus une fois toutes les 12 heures), lisible uniquement par les fonctions serveur.
*/

insert into public.site_settings (setting_key, setting_value, is_public) values
  ('google_review_url', to_jsonb('https://g.page/r/CdNCcWkeO6TOEBM/review'::text), true),
  ('google_place_id', to_jsonb('ChIJt3NkyLznk0cR00JxaR47pM4'::text), true),
  ('reviews_enabled', to_jsonb('true'::text), true),
  ('reviews_min_rating', to_jsonb('4'::text), true)
on conflict (setting_key) do nothing;

create table if not exists public.google_reviews_cache (
  place_id text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.google_reviews_cache enable row level security;
revoke all on public.google_reviews_cache from anon, authenticated;
