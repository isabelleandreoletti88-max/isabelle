import { supabase } from '@/lib/supabase';

export async function fetchPublicProducts() {
  const { data, error } = await supabase.from('products').select('*, categories(name,slug), product_images(id,storage_path,public_url,alt_text,display_order,is_main), product_seasons(seasons(name,slug))').eq('published', true).order('display_order');
  if (error) throw new Error('Impossible de charger les créations.');
  return data ?? [];
}

export async function fetchAdminProducts() {
  const { data, error } = await supabase.from('products').select('*, categories(name,slug), product_images(id,storage_path,public_url,alt_text,display_order,is_main), product_seasons(seasons(name,slug))').order('updated_at', { ascending: false });
  if (error) throw new Error('Impossible de charger les créations.');
  return data ?? [];
}

export async function fetchAdminStats() {
  const [{ count: total }, { count: published }, { count: drafts }, { count: unavailable }, { count: requests }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('published', false),
    supabase.from('products').select('*', { count: 'exact', head: true }).in('availability_status', ['sold', 'unavailable']),
    supabase.from('contact_requests').select('*', { count: 'exact', head: true }).eq('status', 'new'),
  ]);
  return { total: total ?? 0, published: published ?? 0, drafts: drafts ?? 0, unavailable: unavailable ?? 0, requests: requests ?? 0 };
}

export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('display_order');
  if (error) throw new Error('Impossible de charger les catégories.');
  return data ?? [];
}

export async function fetchSeasons() {
  const { data, error } = await supabase.from('seasons').select('*').order('display_order');
  if (error) throw new Error('Impossible de charger les saisons.');
  return data ?? [];
}

function slugify(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function saveCategory(input: { id?: string; name: string; slug?: string; description?: string; display_order?: number; published?: boolean }) {
  const payload = { name: input.name, slug: input.slug || slugify(input.name), description: input.description ?? '', display_order: input.display_order ?? 0, published: input.published ?? true };
  const result = input.id ? await supabase.from('categories').update(payload).eq('id', input.id).select().maybeSingle() : await supabase.from('categories').insert(payload).select().maybeSingle();
  if (result.error || !result.data) throw new Error('La catégorie n’a pas pu être enregistrée.');
  return result.data;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error('La catégorie n’a pas pu être supprimée.');
}

export async function saveSeason(input: { id?: string; name: string; slug?: string; color?: string; icon?: string; display_order?: number }) {
  const payload = { name: input.name, slug: input.slug || slugify(input.name), color: input.color || '#8F9D83', icon: input.icon || 'leaf', display_order: input.display_order ?? 0 };
  const result = input.id ? await supabase.from('seasons').update(payload).eq('id', input.id).select().maybeSingle() : await supabase.from('seasons').insert(payload).select().maybeSingle();
  if (result.error || !result.data) throw new Error('La saison n’a pas pu être enregistrée.');
  return result.data;
}

export async function deleteSeason(id: string) {
  const { error } = await supabase.from('seasons').delete().eq('id', id);
  if (error) throw new Error('La saison n’a pas pu être supprimée.');
}

export type HeroSlideRow = {
  id: string;
  chapter: string;
  number: string;
  image: string | null;
  video_id: string | null;
  eyebrow: string;
  title: string;
  poem: string;
  quote: string;
  cta_label: string;
  cta_to: string;
  detail_label_1: string;
  detail_value_1: string;
  detail_label_2: string;
  detail_value_2: string;
  palette_accent: string;
  palette_accent_soft: string;
  palette_text: string;
  palette_number: string;
  display_order: number;
  published: boolean;
};

export async function fetchHeroSlides(): Promise<HeroSlideRow[]> {
  const { data, error } = await supabase.from('hero_slides').select('*').order('display_order');
  if (error) throw new Error('Impossible de charger les slides.');
  return (data ?? []) as HeroSlideRow[];
}

export async function saveHeroSlide(input: Partial<HeroSlideRow> & { id?: string }) {
  const payload = {
    chapter: input.chapter ?? '',
    number: input.number ?? '',
    image: input.image ?? null,
    video_id: input.video_id ?? null,
    eyebrow: input.eyebrow ?? '',
    title: input.title ?? '',
    poem: input.poem ?? '',
    quote: input.quote ?? '',
    cta_label: input.cta_label ?? '',
    cta_to: input.cta_to ?? '/',
    detail_label_1: input.detail_label_1 ?? '',
    detail_value_1: input.detail_value_1 ?? '',
    detail_label_2: input.detail_label_2 ?? '',
    detail_value_2: input.detail_value_2 ?? '',
    palette_accent: input.palette_accent ?? 'from-honey via-amber to-honey-light',
    palette_accent_soft: input.palette_accent_soft ?? 'from-honey/20',
    palette_text: input.palette_text ?? 'text-honey-dark',
    palette_number: input.palette_number ?? 'text-honey/30',
    display_order: input.display_order ?? 0,
    published: input.published ?? true,
  };
  const result = input.id
    ? await supabase.from('hero_slides').update(payload).eq('id', input.id).select().maybeSingle()
    : await supabase.from('hero_slides').insert(payload).select().maybeSingle();
  if (result.error || !result.data) throw new Error('Le slide n’a pas pu être enregistré.');
  return result.data as HeroSlideRow;
}

export async function deleteHeroSlide(id: string) {
  const { error } = await supabase.from('hero_slides').delete().eq('id', id);
  if (error) throw new Error('Le slide n’a pas pu être supprimé.');
}

export type EventRow = {
  id: string;
  title: string;
  location: string;
  description: string;
  image: string | null;
  start_date: string | null;
  end_date: string | null;
  is_permanent: boolean;
  display_order: number;
  published: boolean;
};

export async function fetchPublicEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase.from('events').select('*').eq('published', true).order('is_permanent', { ascending: false }).order('display_order');
  if (error) throw new Error('Impossible de charger les événements.');
  return (data ?? []) as EventRow[];
}

export async function fetchAdminEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase.from('events').select('*').order('is_permanent', { ascending: false }).order('display_order');
  if (error) throw new Error('Impossible de charger les événements.');
  return (data ?? []) as EventRow[];
}

export async function saveEvent(input: Partial<EventRow> & { id?: string }) {
  const payload = {
    title: input.title ?? '',
    location: input.location ?? '',
    description: input.description ?? '',
    image: input.image ?? null,
    start_date: input.start_date ?? null,
    end_date: input.end_date ?? null,
    is_permanent: input.is_permanent ?? false,
    display_order: input.display_order ?? 0,
    published: input.published ?? true,
  };
  const result = input.id
    ? await supabase.from('events').update(payload).eq('id', input.id).select().maybeSingle()
    : await supabase.from('events').insert(payload).select().maybeSingle();
  if (result.error || !result.data) throw new Error('L’événement n’a pas pu être enregistré.');
  return result.data as EventRow;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw new Error('L’événement n’a pas pu être supprimé.');
}
