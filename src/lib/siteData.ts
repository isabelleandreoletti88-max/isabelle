import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { siteConfig } from '@/config/site';
import { materials as defaultMaterials } from '@/config/catalog';
import { editableTexts } from '@/config/editableContent';
import type { MaterialInfo } from '@/types';

/**
 * Données du site modifiables depuis l'administration : coordonnées, textes, matières.
 * Chaque requête n'est faite qu'une fois par visite, puis partagée entre les composants.
 */
function cached<T>(load: () => Promise<T>) {
  let promise: Promise<T> | null = null;
  return {
    get: () => (promise ??= load().catch((error) => { promise = null; throw error; })),
    clear: () => { promise = null; },
  };
}

function useCached<T>(source: { get: () => Promise<T> }, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    let active = true;
    source.get().then((data) => { if (active) setValue(data); }).catch(() => {});
    return () => { active = false; };
  }, [source]);
  return value;
}

// --- Coordonnées et réglages publics (table site_settings) ---

export type SiteSettings = {
  brand_name: string;
  slogan: string;
  email: string;
  phone: string;
  city: string;
  region: string;
  hours: string;
  facebook: string;
  instagram: string;
  footer_text: string;
  shop_enabled: string;
  shop_shipping_fee: string;
  shop_shipping_note: string;
};

export const settingsDefaults: SiteSettings = {
  brand_name: siteConfig.name,
  slogan: siteConfig.signature,
  email: siteConfig.email,
  phone: siteConfig.phone,
  city: siteConfig.city,
  region: siteConfig.region,
  hours: siteConfig.hours,
  facebook: siteConfig.facebook,
  instagram: siteConfig.instagram,
  footer_text: 'Créations décoratives faites main, au rythme des saisons.',
  shop_enabled: 'false',
  shop_shipping_fee: '',
  shop_shipping_note: '',
};

export const settingsSource = cached(async () => {
  const { data, error } = await supabase.from('site_settings').select('setting_key,setting_value').in('setting_key', Object.keys(settingsDefaults));
  if (error) throw error;
  const settings = { ...settingsDefaults };
  for (const row of data ?? []) {
    const value = row.setting_value;
    // Une valeur vide garde la valeur par défaut, sauf pour Instagram (facultatif).
    if (typeof value === 'string' && (value.trim() || row.setting_key === 'instagram')) settings[row.setting_key as keyof SiteSettings] = value.trim();
  }
  return settings;
});

export function useSiteSettings() {
  return useCached(settingsSource, settingsDefaults);
}

// --- Textes des pages (table site_contents) ---

export const contentsSource = cached(async () => {
  const { data, error } = await supabase.from('site_contents').select('page,section,content_key,value');
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data ?? []) if (typeof row.value === 'string' && row.value.trim()) map[`${row.page}.${row.section}.${row.content_key}`] = row.value;
  return map;
});

/** Renvoie une fonction `text(clé)` : le texte saisi dans l'administration, sinon le texte par défaut. */
export function useSiteTexts() {
  const map = useCached(contentsSource, {} as Record<string, string>);
  return (key: string) => map[key] ?? editableTexts[key]?.default ?? '';
}

// --- Matières (table materials) ---

export const materialsSource = cached(async () => {
  const { data, error } = await supabase.from('materials').select('slug,name,description,image').eq('published', true).order('display_order');
  if (error) throw error;
  return (data ?? []).map((row) => ({ slug: row.slug, name: row.name, description: row.description, image: row.image || '' })) as MaterialInfo[];
});

export function useMaterials() {
  return useCached(materialsSource, defaultMaterials);
}

// --- Questions fréquentes (table faqs) ---

export type Faq = { id: string; question: string; answer: string };

export const faqsSource = cached(async () => {
  const { data, error } = await supabase.from('faqs').select('id,question,answer').eq('published', true).order('display_order');
  if (error) throw error;
  return (data ?? []) as Faq[];
});

export function useFaqs() {
  return useCached(faqsSource, [] as Faq[]);
}
