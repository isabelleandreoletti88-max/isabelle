/*
# Seed initial catalogue

1. Purpose
- Imports the seven existing static creations into the Supabase catalogue.
- Preserves the existing names, slugs, descriptions, prices, categories, seasons and image paths.
- Marks the imported records as published so the public site does not lose its existing content.

2. Notes
- Prices and dimensions remain the provisional values already present in the application.
- The image paths reference the existing public assets and can later be replaced from the private administration.
- The statements are idempotent and do not overwrite later administrator edits.
*/

insert into public.products (name, slug, short_description, description, price, price_from, category_id, materials, dimensions, colors, personalizable, availability_status, production_time, maintenance_advice, featured, published, display_order)
select v.name, v.slug, v.short_description, v.description, v.price, v.price_from, c.id, v.materials, v.dimensions, v.colors, v.personalizable, v.availability_status, v.production_time, v.maintenance_advice, v.featured, true, v.display_order
from (values
('C’est un garçon', 'cest-un-garcon', 'Une décoration en galets pour annoncer ou célébrer l’arrivée d’un petit garçon.', 'Des galets soigneusement choisis et assemblés à la main pour former une scène tendre autour de la naissance d’un petit garçon. Chaque pierre est unique, comme chaque enfant.', 32.00, false, 'naissance-enfance', array['galets','bois']::text[], 'Cadre 15 × 15 cm — À compléter', array['Bleu doux','Beige','Blanc cassé']::text[], true, 'available', '1 à 2 semaines — À compléter', 'Épousseter délicatement à sec. Éviter l’humidité prolongée.', true, 1),
('C’est une fille', 'cest-une-fille', 'Une scène tendre en galets pour fêter la naissance d’une petite fille.', 'Galets, couleurs douces et cadre en bois : une composition pensée pour accueillir une petite fille. Le prénom peut être ajouté à la main.', 32.00, false, 'naissance-enfance', array['galets','bois']::text[], 'Cadre 15 × 15 cm — À compléter', array['Rose poudré','Beige','Blanc cassé']::text[], true, 'available', '1 à 2 semaines — À compléter', 'Épousseter délicatement à sec. Éviter l’humidité prolongée.', true, 2),
('Une meilleure amie', 'une-meilleure-amie', 'Un tableau en galets et fil de fer pour dire à une amie qu’elle compte.', 'Deux silhouettes en galets, quelques mots en fil de fer : une création qui célèbre l’amitié.', 38.00, false, 'amitie', array['galets','fil-de-fer','bois']::text[], 'Cadre 20 × 20 cm — À compléter', array['Terracotta','Vert sauge','Beige']::text[], true, 'made_to_order', '1 à 2 semaines — À compléter', '', true, 3),
('Sœurs de cœur', 'soeurs-de-coeur', 'Une création en galets pour célébrer le lien entre sœurs.', 'Deux figures de galets se tiennent côte à côte, unies par un fil de fer qui dessine un cœur.', 38.00, false, 'famille', array['galets','fil-de-fer','bois']::text[], 'Cadre 20 × 20 cm — À compléter', array['Bordeaux','Beige','Vert sauge']::text[], true, 'made_to_order', '1 à 2 semaines — À compléter', '', true, 4),
('Trésor d’amitié', 'tresor-damitie', 'Une composition en papier et fil de fer pour les grandes amitiés.', 'Des fleurs de papier délicatement découpées et montées sur des tiges de fil de fer.', 34.00, true, 'amitie', array['papier','fil-de-fer']::text[], 'Composition 15 × 25 cm — À compléter', array['Pastel','Blanc','Vert sauge']::text[], true, 'made_to_order', '2 semaines — À compléter', '', true, 5),
('La famille, là où la vie commence', 'la-famille-la-ou-la-vie-commence', 'Un cadre familial personnalisé en galets et bois.', 'Une composition familiale en galets, présentée dans un cadre en bois. Les prénoms et les couleurs peuvent être adaptés.', 45.00, true, 'famille', array['galets','bois','fil-de-fer']::text[], 'Cadre 25 × 25 cm — À compléter', array['Naturel','Bois clair','Terracotta']::text[], true, 'made_to_order', '2 à 3 semaines — À compléter', 'Épousseter délicatement à sec.', true, 6),
('Composition automnale', 'composition-automnale', 'Une décoration saisonnière en galets et feuilles d’automne.', 'Une composition aux teintes cuivrées qui évoque les feuilles tombées et les soirées douces.', 36.00, false, 'decorations-saisonnieres', array['galets','bois','papier']::text[], 'Cadre 20 × 20 cm — À compléter', array['Orange','Marron','Beige']::text[], false, 'sold', '1 semaine — À compléter', '', false, 7)
) as v(name, slug, short_description, description, price, price_from, category_slug, materials, dimensions, colors, personalizable, availability_status, production_time, maintenance_advice, featured, display_order)
join public.categories c on c.slug = v.category_slug
where not exists (select 1 from public.products p where p.slug = v.slug);

insert into public.product_images (product_id, storage_path, public_url, alt_text, display_order, is_main)
select p.id, split_part(v.image, '/', 2), v.image, v.alt_text, 0, true
from (values
('cest-un-garcon', '/creation-garcon.webp', 'Création artisanale C’est un garçon en galets'),
('cest-une-fille', '/creation-fille.webp', 'Création artisanale C’est une fille en galets'),
('une-meilleure-amie', '/creation-amitie.webp', 'Tableau artisanal Une meilleure amie'),
('soeurs-de-coeur', '/creation-soeurs.webp', 'Création artisanale Sœurs de cœur'),
('tresor-damitie', '/creation-papier-fil.webp', 'Composition artisanale en papier et fil de fer'),
('la-famille-la-ou-la-vie-commence', '/creation-famille.webp', 'Cadre familial artisanal personnalisé'),
('composition-automnale', '/creation-automne.webp', 'Décoration artisanale automnale')
) as v(slug, image, alt_text)
join public.products p on p.slug = v.slug
where not exists (select 1 from public.product_images i where i.product_id = p.id);

insert into public.product_seasons (product_id, season_id)
select p.id, s.id
from (values
('cest-un-garcon','printemps'),('cest-une-fille','printemps'),('une-meilleure-amie','ete'),('soeurs-de-coeur','automne'),('tresor-damitie','printemps'),('tresor-damitie','ete'),('la-famille-la-ou-la-vie-commence','automne'),('la-famille-la-ou-la-vie-commence','hiver'),('composition-automnale','automne')
) as v(slug, season_slug)
join public.products p on p.slug = v.slug
join public.seasons s on s.slug = v.season_slug
on conflict (product_id, season_id) do nothing;
