/*
# Create events table

1. New Tables
- `events`
  - `id` (uuid, primary key)
  - `title` (text, not null) — nom de l'événement ou de la boutique
  - `location` (text) — lieu
  - `description` (text) — description affichée
  - `image` (text) — chemin ou URL de l'image illustrative
  - `start_date` (date) — date de début (nullable pour événements permanents)
  - `end_date` (date) — date de fin (nullable pour événements permanents)
  - `is_permanent` (boolean, default false) — vrai pour une boutique partenaire en permanence
  - `display_order` (int, default 0) — ordre d'affichage
  - `published` (boolean, default true) — visible sur le site public
  - `created_at` (timestamptz, default now)
  - `updated_at` (timestamptz, default now)

2. Security
- Enable RLS on `events`.
- Public read access (anon + authenticated) pour les événements publiés.
- Only authenticated admin users can insert/update/delete.
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  location text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image text,
  start_date date,
  end_date date,
  is_permanent boolean NOT NULL DEFAULT false,
  display_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_events" ON events;
CREATE POLICY "public_read_events" ON events FOR SELECT
  TO anon, authenticated USING (published = true);

DROP POLICY IF EXISTS "admin_insert_events" ON events;
CREATE POLICY "admin_insert_events" ON events FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_events" ON events;
CREATE POLICY "admin_update_events" ON events FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_events" ON events;
CREATE POLICY "admin_delete_events" ON events FOR DELETE
  TO authenticated USING (true);
