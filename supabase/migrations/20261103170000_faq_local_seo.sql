/*
# Foire aux questions (référencement local et moteurs IA)

Questions fréquentes affichées sur l'accueil et balisées en données structurées (FAQPage).
Modifiables dans l'administration (« Questions fréquentes »). Les réponses de départ sont
à relire par Isabelle.
*/

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  display_order integer not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists faqs_updated_at on public.faqs;
create trigger faqs_updated_at before update on public.faqs for each row execute function public.set_updated_at();

alter table public.faqs enable row level security;
drop policy if exists faqs_public_select on public.faqs;
create policy faqs_public_select on public.faqs for select to anon, authenticated using (published);
drop policy if exists faqs_staff_select on public.faqs;
create policy faqs_staff_select on public.faqs for select to authenticated using (private.is_staff('editor'));
drop policy if exists faqs_staff_insert on public.faqs;
create policy faqs_staff_insert on public.faqs for insert to authenticated with check (private.is_staff('editor'));
drop policy if exists faqs_staff_update on public.faqs;
create policy faqs_staff_update on public.faqs for update to authenticated using (private.is_staff('editor')) with check (private.is_staff('editor'));
drop policy if exists faqs_staff_delete on public.faqs;
create policy faqs_staff_delete on public.faqs for delete to authenticated using (private.is_staff('editor'));

insert into public.faqs (question, answer, display_order)
select * from (values
  ('Où trouver les créations de L''Atelier d''Isabelle dans les Vosges ?', 'Les créations d''Isabelle sont présentées toute l''année dans deux boutiques d''artisans vosgiennes : La Boutik''art à Saint-Dié-des-Vosges et La Boutique des Artisans à Raon-l''Étape. Isabelle participe aussi à des marchés artisanaux dans les Vosges, annoncés sur la page Événements.', 1),
  ('Quelles créations propose L''Atelier d''Isabelle ?', 'Des décorations faites main en galets, papier, bois et fil de fer : cadres à poser ou à suspendre avec une phrase, créations pour une naissance, la famille, l''amitié ou l''amour, décorations saisonnières et cadeaux personnalisés.', 2),
  ('Peut-on commander une création personnalisée ?', 'Oui. Prénoms, date, message, couleurs ou composition : la plupart des créations peuvent être personnalisées. Il suffit de décrire votre idée dans le formulaire de la page Personnalisation ou de contacter Isabelle.', 3),
  ('Quel cadeau fait main offrir dans les Vosges pour une naissance, un anniversaire ou un remerciement ?', 'L''atelier propose des créations pensées pour chaque occasion : naissance, annonce aux futurs grands-parents, remerciement pour une maîtresse ou une nounou, félicitations, amitié, famille ou amour. Chaque pièce est réalisée à la main dans les Vosges et peut être personnalisée.', 4),
  ('Quel est le délai de réalisation ?', 'Le délai dépend de la création ; il est indiqué sur chaque fiche. Pour une date précise (naissance, anniversaire, fête), précisez-la dans votre demande.', 5),
  ('Quels sont les prix des créations ?', 'Les prix sont indiqués sur chaque création de la boutique. Les créations personnalisées sur mesure font l''objet d''un prix donné par Isabelle selon votre demande.', 6),
  ('Comment contacter Isabelle ?', 'Par le formulaire de la page Contact, par e-mail ou par téléphone : les coordonnées figurent en bas de chaque page du site.', 7)
) as v(question, answer, display_order)
where not exists (select 1 from public.faqs);

update public.site_settings set setting_value = to_jsonb('Livraison en France métropolitaine.'::text)
where setting_key = 'shop_shipping_note' and setting_value::text like '%main propre%';
