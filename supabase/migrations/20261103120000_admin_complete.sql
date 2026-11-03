/*
# Administration complète

1. Matières (galets, papier, bois, fil de fer)
- Nouvelle table `materials` : nom, description et image modifiables depuis l'administration
  (auparavant écrits dans le code du site).

2. Textes du site
- `site_contents` sert désormais aux textes modifiables des pages publiques : la lecture
  publique couvre toutes les pages du site.

3. Boutiques partenaires
- Les deux boutiques affichées sur la page Contact deviennent des événements permanents
  (`events.is_permanent`), modifiables avec leur photo dans « Événements ».
- Ajout d'un lien facultatif (`events.link_url`).

4. Événements
- Les droits d'écriture sont déjà réservés à l'équipe (corrigé lors de la migration) ;
  on ajoute la lecture des brouillons pour l'équipe.
*/

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  image text,
  display_order integer not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists materials_updated_at on public.materials;
create trigger materials_updated_at before update on public.materials for each row execute function public.set_updated_at();

alter table public.materials enable row level security;
drop policy if exists materials_public_select on public.materials;
create policy materials_public_select on public.materials for select to anon, authenticated using (published);
drop policy if exists materials_staff_select on public.materials;
create policy materials_staff_select on public.materials for select to authenticated using (private.is_staff('editor'));
drop policy if exists materials_staff_insert on public.materials;
create policy materials_staff_insert on public.materials for insert to authenticated with check (private.is_staff('editor'));
drop policy if exists materials_staff_update on public.materials;
create policy materials_staff_update on public.materials for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
drop policy if exists materials_staff_delete on public.materials;
create policy materials_staff_delete on public.materials for delete to authenticated using (private.is_staff('editor'));

insert into public.materials (slug, name, description, image, display_order) values
('galets', 'Galets', 'Des pierres lisses, ramassées au fil des balades, qui deviennent des visages, des corps et des souvenirs.', 'https://clkkasnnbiktrrncabjc.supabase.co/storage/v1/object/public/site-images/matieres/matiere-galets-peints-a-la-main.webp', 1),
('papier', 'Papier', 'Découpé, plié, assemblé : le papier prend la forme de fleurs, de lettres et de petits mondes.', 'https://clkkasnnbiktrrncabjc.supabase.co/storage/v1/object/public/site-images/matieres/matiere-papier-decoupe-plie.webp', 2),
('bois', 'Bois', 'Des branches et des chutes récupérées, soigneusement poncées et assemblées à la main pour donner vie à mes créations.', 'https://clkkasnnbiktrrncabjc.supabase.co/storage/v1/object/public/site-images/matieres/matiere-bois-recupere.webp', 3),
('fil-de-fer', 'Fil de fer', 'Tordu et façonné à la main, il dessine des mots, des contours et de délicates silhouettes.', 'https://clkkasnnbiktrrncabjc.supabase.co/storage/v1/object/public/site-images/matieres/matiere-fil-de-fer-faconne.webp', 4)
on conflict (slug) do nothing;

drop policy if exists contents_public_select on public.site_contents;
create policy contents_public_select on public.site_contents for select to anon, authenticated using (true);

alter table public.events add column if not exists link_url text;

drop policy if exists staff_select_events on public.events;
create policy staff_select_events on public.events for select to authenticated using (private.is_staff('editor'));

insert into public.events (title, location, description, image, is_permanent, display_order, published)
select * from (values
  ('La Boutik''art', 'Saint-Dié-des-Vosges', 'Retrouvez les créations d''Isabelle en permanence dans cette boutique d''artisans.', 'https://clkkasnnbiktrrncabjc.supabase.co/storage/v1/object/public/site-images/evenements/boutique-la-boutikart-saint-die-des-vosges.webp', true, 1, true),
  ('La Boutique des Artisans', 'Raon-l''Étape', 'Une seconde adresse où découvrir les créations de l''atelier tout au long de l''année.', 'https://clkkasnnbiktrrncabjc.supabase.co/storage/v1/object/public/site-images/evenements/boutique-des-artisans-raon-l-etape.webp', true, 2, true)
) as v(title, location, description, image, is_permanent, display_order, published)
where not exists (select 1 from public.events e where e.is_permanent and e.title = v.title);
