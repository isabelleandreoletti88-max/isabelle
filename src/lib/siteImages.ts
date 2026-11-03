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
  logo: '/logo-atelier-isabelle-transparent.png',
  header_logo: '/logo-atelier-isabelle-header.webp',
  og_image: '/742951638_2150815128833604_2847242481161327155_n.jpg',
  home_sur_mesure_image: '/758274168_2158598844721899_8142072461107233374_n.jpg',
  home_univers_image: '/785364099_2181757785739338_4944579142739418340_n.jpg',
  personnalisation_image: '/758274168_2158598844721899_8142072461107233374_n.jpg',
  about_image: '/785364099_2181757785739338_4944579142739418340_n.jpg',
};

export const DEFAULT_SEASON_IMAGES: Record<string, string> = {
  printemps: '/saison-printemps.webp',
  ete: '/saison-ete.webp',
  automne: '/716510643_2113537999227984_4704869155250699751_n.jpg',
  hiver: '/saison-hiver.webp',
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
