-- Mode fête : animation décorative (neige, cœurs, feuilles, Noël) réglée dans Admin → Paramètres.
insert into public.site_settings (setting_key, setting_value, is_public) values
  ('festive_effect', to_jsonb('none'::text), true),   -- none | auto | snow | hearts | autumn | christmas
  ('festive_scope', to_jsonb('home'::text), true),    -- home | all
  ('festive_density', to_jsonb('normal'::text), true) -- light | normal | strong
on conflict (setting_key) do nothing;
