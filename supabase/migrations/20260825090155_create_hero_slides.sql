/*
# Create hero_slides table

1. New Tables
- `hero_slides` — editable slides for the homepage hero carousel.
  - `id` (uuid, primary key)
  - `chapter` (text, label like "Chapitre I")
  - `number` (text, display number like "01")
  - `image` (text, optional image URL/path)
  - `video_id` (text, optional YouTube video ID)
  - `eyebrow` (text, short label above title)
  - `title` (text, main heading)
  - `poem` (text, descriptive paragraph)
  - `quote` (text, italic quote)
  - `cta_label` (text, button label)
  - `cta_to` (text, button link path)
  - `detail_label_1`, `detail_value_1` (text, first detail pair)
  - `detail_label_2`, `detail_value_2` (text, second detail pair)
  - `palette_accent` (text, tailwind gradient classes for accent)
  - `palette_accent_soft` (text, tailwind gradient classes for soft accent)
  - `palette_text` (text, tailwind text color class)
  - `palette_number` (text, tailwind text color class for number)
  - `display_order` (integer, ordering)
  - `published` (boolean, default true)
  - `created_at`, `updated_at` (timestamps)

2. Security
- Enable RLS on `hero_slides`.
- Public SELECT for anon+authenticated (published slides only, or all for staff).
- Staff-only INSERT/UPDATE/DELETE via is_staff('editor').

3. Seed
- Insert the 6 current hardcoded chapters as initial rows.
*/

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter text NOT NULL DEFAULT '',
  number text NOT NULL DEFAULT '',
  image text,
  video_id text,
  eyebrow text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  poem text NOT NULL DEFAULT '',
  quote text NOT NULL DEFAULT '',
  cta_label text NOT NULL DEFAULT '',
  cta_to text NOT NULL DEFAULT '/',
  detail_label_1 text NOT NULL DEFAULT '',
  detail_value_1 text NOT NULL DEFAULT '',
  detail_label_2 text NOT NULL DEFAULT '',
  detail_value_2 text NOT NULL DEFAULT '',
  palette_accent text NOT NULL DEFAULT 'from-honey via-amber to-honey-light',
  palette_accent_soft text NOT NULL DEFAULT 'from-honey/20',
  palette_text text NOT NULL DEFAULT 'text-honey-dark',
  palette_number text NOT NULL DEFAULT 'text-honey/30',
  display_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hero_slides_published_idx ON public.hero_slides (published, display_order);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hero_slides_public_select ON public.hero_slides;
CREATE POLICY hero_slides_public_select ON public.hero_slides FOR SELECT
  TO anon, authenticated USING (published OR public.is_staff('editor'));

DROP POLICY IF EXISTS hero_slides_staff_insert ON public.hero_slides;
CREATE POLICY hero_slides_staff_insert ON public.hero_slides FOR INSERT
  TO authenticated WITH CHECK (public.is_staff('editor'));

DROP POLICY IF EXISTS hero_slides_staff_update ON public.hero_slides;
CREATE POLICY hero_slides_staff_update ON public.hero_slides FOR UPDATE
  TO authenticated USING (public.is_staff('editor')) WITH CHECK (public.is_staff('editor'));

DROP POLICY IF EXISTS hero_slides_staff_delete ON public.hero_slides;
CREATE POLICY hero_slides_staff_delete ON public.hero_slides FOR DELETE
  TO authenticated USING (public.is_staff('editor'));

DROP TRIGGER IF EXISTS hero_slides_updated_at ON public.hero_slides;
CREATE TRIGGER hero_slides_updated_at BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.hero_slides (chapter, number, video_id, eyebrow, title, poem, quote, cta_label, cta_to, detail_label_1, detail_value_1, detail_label_2, detail_value_2, palette_accent, palette_accent_soft, palette_text, palette_number, display_order, published) VALUES
('Chapitre I', '01', 'ip18Y5AfQ8s', 'L''atelier vivant', 'Une lumière, des mains, une histoire', 'Le temps se suspend dans l''atelier. Sous les doigts d''Isabelle, les galets deviennent regards, les fils deviennent liens.', 'Chaque pièce est un moment qu''on garde.', 'Voir la boutique', '/boutique', 'Format', 'Vidéo — 30 s', 'Ambiance', 'L''atelier en direct', 'from-honey via-amber to-honey-light', 'from-honey/20', 'text-honey-dark', 'text-honey/30', 1, true),
('Chapitre II', '02', NULL, 'Le geste', 'Là où les matières s''éveillent', 'Un galet posé, un fil qui plie, un souffle de patience — chaque création commence par un silence dans les mains d''Isabelle.', 'Je ne fabrique pas, je laisse la matière raconter.', 'Entrer dans l''atelier', '/a-propos', 'Origine', 'Vosges, France', 'Matière', 'Galets, bois, papier', 'from-terracotta via-terracotta-light to-honey', 'from-terracotta/20', 'text-terracotta', 'text-terracotta/30', 2, true),
('Chapitre III', '03', NULL, 'La naissance', 'Le premier souffle d''une histoire', 'Un prénom, quelques galets tendres, un cadre qui accueille l''enfant. Une décoration pour marquer le commencement.', 'Que chaque enfant ait son étoile posée sur le mur.', 'Créations naissance', '/collections/naissance-enfance', 'Personnalisable', 'Prénom & couleurs', 'Délai', '2 à 3 semaines', 'from-copper via-terracotta to-honey', 'from-copper/20', 'text-copper', 'text-copper/30', 3, true),
('Chapitre IV', '04', NULL, 'La famille', 'Ceux qu''on aime, assemblés en un tableau', 'Papa, maman, grand frère, petite sœur, l''animal fidèle. Un cadre qui rassemble la tribu en une seule scène.', 'La famille tient dans un cadre, si on l''imagine ensemble.', 'Créations famille', '/collections/famille', 'Composition', 'Sur mesure', 'Support', 'Bois massif', 'from-rust via-terracotta-dark to-copper', 'from-rust/20', 'text-rust', 'text-rust/30', 4, true),
('Chapitre V', '05', NULL, 'L''amitié', 'Deux silhouettes, un même fil', 'Pour dire à celle ou celui qui compte que sa place est là, entre le cœur et le mur d''en face.', 'Une amitié qui dure, ça se pose en évidence.', 'Créations amitié', '/collections/amitie', 'Occasion', 'Anniversaire, remerciement', 'Fil', 'Fer patiné à la main', 'from-sage via-sage-light to-honey', 'from-sage/20', 'text-sage-dark', 'text-sage/30', 5, true),
('Chapitre VI', '06', NULL, 'Les saisons', 'Créer au rythme de la nature', 'Printemps de renaissance, été de rencontres, automne cuivré, hiver de douceur — chaque saison a son geste et sa couleur.', 'On ne travaille pas les saisons, on les écoute.', 'Parcourir la boutique', '/boutique', 'Nouveautés', 'Chaque saison', 'Édition', 'Limitée & fait main', 'from-terracotta via-honey to-amber-light', 'from-terracotta/20', 'text-terracotta-dark', 'text-terracotta/30', 6, true)
ON CONFLICT DO NOTHING;
