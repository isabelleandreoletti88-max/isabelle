import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchSeasons } from '@/lib/catalogService';

export type SiteImageKey =
  | 'logo'
  | 'header_logo'
  | 'og_image'
  | 'home_sur_mesure_image'
  | 'home_univers_image'
  | 'personnalisation_image'
  | 'about_image';

const DEFAULTS: Record<SiteImageKey, string> = {
  logo: '/logo-atelier-isabelle.png',
  header_logo: '/logo-atelier-isabelle-header.webp',
  og_image: '/atelier-isabelle-creations-artisanales.webp',
  home_sur_mesure_image: '/creation-personnalisee-sur-mesure.webp',
  home_univers_image: '/univers-atelier-isabelle.webp',
  personnalisation_image: '/creation-personnalisee-sur-mesure.webp',
  about_image: '/univers-atelier-isabelle.webp',
};

export const DEFAULT_SEASON_IMAGES: Record<string, string> = {
  printemps: '/decoration-printemps-faite-main.webp',
  ete: '/decoration-ete-faite-main.webp',
  automne: '/decoration-automne-galets.webp',
  hiver: '/decoration-hiver-faite-main.webp',
};

function parseSettingValue(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (raw === null || raw === undefined) return '';
  return String(raw);
}

export async function fetchSiteImages(): Promise<Partial<Record<SiteImageKey, string>>> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('setting_key,setting_value')
    .in('setting_key', Object.keys(DEFAULTS));
  if (error) return {};
  const result: Partial<Record<SiteImageKey, string>> = {};
  for (const row of data ?? []) {
    const key = row.setting_key as SiteImageKey;
    const value = parseSettingValue(row.setting_value);
    if (value) result[key] = value;
  }
  return result;
}

export async function saveSiteImage(key: SiteImageKey, value: string) {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ setting_key: key, setting_value: value, is_public: true }, { onConflict: 'setting_key' });
  if (error) throw new Error('L’image n’a pas pu être enregistrée.');
}

export function useSiteImages() {
  const [images, setImages] = useState<Record<SiteImageKey, string>>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetchSiteImages()
      .then((fetched) => {
        if (!active) return;
        setImages({ ...DEFAULTS, ...fetched } as Record<SiteImageKey, string>);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { images, loading };
}

export function useSeasonImages() {
  const [seasonImages, setSeasonImages] = useState<Record<string, string>>(DEFAULT_SEASON_IMAGES);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetchSeasons()
      .then((rows) => {
        if (!active) return;
        const mapped: Record<string, string> = { ...DEFAULT_SEASON_IMAGES };
        for (const row of rows as { slug: string; image: string | null }[]) {
          if (row.image) mapped[row.slug] = row.image;
        }
        setSeasonImages(mapped);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { seasonImages, loading };
}
