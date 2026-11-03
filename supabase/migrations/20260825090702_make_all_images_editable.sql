/*
# Make all site images editable from backend

1. Schema changes
- Add `image` column to `seasons` table (text, nullable) — stores season image path/URL.
- Categories already have `image_url` column.

2. Seed site_settings with editable image keys (setting_value is jsonb, stored as JSON strings)
- `logo` — main logo (footer, admin login)
- `header_logo` — header logo
- `og_image` — default social/SEO image
- `home_sur_mesure_image` — homepage "Sur mesure" section image
- `home_univers_image` — homepage "Bienvenue dans l'univers" section image
- `personnalisation_image` — personalisation page image
- `about_image` — about page main image

3. Seed seasons with current image values

4. Security
- site_settings: public SELECT for anon+authenticated (is_public = true rows only).
- seasons: already has RLS, public SELECT already granted.
*/

ALTER TABLE public.seasons ADD COLUMN IF NOT EXISTS image text;

UPDATE public.seasons SET image = '/saison-printemps.webp' WHERE slug = 'printemps';
UPDATE public.seasons SET image = '/saison-ete.webp' WHERE slug = 'ete';
UPDATE public.seasons SET image = '/716510643_2113537999227984_4704869155250699751_n.jpg' WHERE slug = 'automne';
UPDATE public.seasons SET image = '/saison-hiver.webp' WHERE slug = 'hiver';

INSERT INTO public.site_settings (setting_key, setting_value, is_public) VALUES
('logo', to_jsonb('/logo-atelier-isabelle-transparent.png'::text), true),
('header_logo', to_jsonb('/logo-atelier-isabelle-header.webp'::text), true),
('og_image', to_jsonb('/742951638_2150815128833604_2847242481161327155_n.jpg'::text), true),
('home_sur_mesure_image', to_jsonb('/758274168_2158598844721899_8142072461107233374_n.jpg'::text), true),
('home_univers_image', to_jsonb('/785364099_2181757785739338_4944579142739418340_n.jpg'::text), true),
('personnalisation_image', to_jsonb('/758274168_2158598844721899_8142072461107233374_n.jpg'::text), true),
('about_image', to_jsonb('/785364099_2181757785739338_4944579142739418340_n.jpg'::text), true)
ON CONFLICT (setting_key) DO NOTHING;

-- Ensure public can read public site_settings
DROP POLICY IF EXISTS site_settings_public_select ON public.site_settings;
CREATE POLICY site_settings_public_select ON public.site_settings FOR SELECT
  TO anon, authenticated USING (is_public = true);
