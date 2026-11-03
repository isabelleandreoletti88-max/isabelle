import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/seo';

export type ProductInput = {
  id?: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price: number | null;
  price_from: boolean;
  compare_at_price: number | null;
  category_id: string | null;
  materials: string[];
  dimensions: string;
  colors: string[];
  personalizable: boolean;
  availability_status: 'available' | 'made_to_order' | 'sold' | 'unavailable';
  stock_quantity: number | null;
  production_time: string;
  maintenance_advice: string;
  featured: boolean;
  published: boolean;
  display_order: number;
  seo_title: string;
  seo_description: string;
  /** Vendue en ligne : produit, prix et lien de paiement Stripe créés automatiquement. */
  sell_online: boolean;
};

export async function saveProduct(input: ProductInput) {
  const { id, ...rest } = input;
  // Adresse propre (minuscules, sans accents ni apostrophes), générée depuis le nom si le champ est vide.
  const payload = { ...rest, name: rest.name.trim(), slug: slugify(rest.slug || rest.name) };
  const result = id ?await supabase.from('products').update(payload).eq('id', id).select().maybeSingle() : await supabase.from('products').insert(payload).select().maybeSingle();
  if (result.error || !result.data) throw new Error('La création n’a pas pu être enregistrée.');
  return result.data;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error('La création n’a pas pu être supprimée.');
}

export async function updateRequest(id: string, status: string, adminNotes: string) {
  const { error } = await supabase.from('contact_requests').update({ status, admin_notes: adminNotes }).eq('id', id);
  if (error) throw new Error('La demande n’a pas pu être mise à jour.');
}

export async function updateRequestStatus(id: string, status: string, adminNotes: string) {
  return updateRequest(id, status, adminNotes);
}

export async function deleteSiteContent(id: string) {
  const { error } = await supabase.from('site_contents').delete().eq('id', id);
  if (error) throw new Error('Le contenu n’a pas pu être supprimé.');
}

export type MediaItem = { bucket: 'site-images' | 'product-images'; path: string; url: string; name: string; size?: number; updatedAt?: string };

export async function fetchMedia() {
  const media: MediaItem[] = [];
  for (const bucket of ['site-images', 'product-images'] as const) {
    const folders = [''];
    while (folders.length) {
      const folder = folders.shift() || '';
      const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw new Error('Impossible de charger la médiathèque.');
      for (const file of data ?? []) {
        const path = folder ? `${folder}/${file.name}` : file.name;
        if (!file.id) {
          folders.push(path);
          continue;
        }
        const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
        media.push({ bucket, path, url: publicUrl.publicUrl, name: file.name, size: file.metadata?.size, updatedAt: file.updated_at });
      }
    }
  }
  return media;
}

export async function deleteMedia(item: MediaItem) {
  if (item.bucket === 'product-images') {
    const { data, error: referenceError } = await supabase.from('product_images').select('id').eq('storage_path', item.path).limit(1);
    if (referenceError) throw new Error('Le média n’a pas pu être vérifié.');
    if (data?.length) throw new Error('Cette image est utilisée par une création.');
  }
  const { error } = await supabase.storage.from(item.bucket).remove([item.path]);
  if (error) throw new Error('Le média n’a pas pu être supprimé.');
}

export async function fetchRequests() {
  const { data, error } = await supabase.from('contact_requests').select('*, products(name)').order('created_at', { ascending: false });
  if (error) throw new Error('Impossible de charger les demandes.');
  return data ?? [];
}

/** Redimensionne une image dans le navigateur et la convertit en WebP (photos de téléphone : ~2 Mo → ~150 Ko). */
async function toWebp(file: File, maxWidth: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.8));
  if (!blob || blob.type !== 'image/webp') throw new Error('Conversion WebP indisponible.');
  return blob;
}

/**
 * Importe une image au format WebP, nommée d'après `baseName` (nom de la création…) pour le référencement.
 * Les photos de créations reçoivent aussi une miniature `-640.webp` utilisée dans les listes.
 */
export async function uploadImage(file: File, bucket: 'product-images' | 'site-images', folder = 'catalogue', baseName = '') {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error('Image invalide : JPG, PNG ou WebP de 8 Mo maximum.');
  const stem = `${folder}/${slugify(baseName) || slugify(file.name.replace(/\.[^.]+$/, '')) || 'image'}-${crypto.randomUUID().slice(0, 8)}`;
  let path: string;
  try {
    const full = await toWebp(file, 1600);
    path = `${stem}.webp`;
    const { error } = await supabase.storage.from(bucket).upload(path, full, { contentType: 'image/webp', upsert: false, cacheControl: '31536000' });
    if (error) throw error;
    if (bucket === 'product-images') {
      const thumb = await toWebp(file, 640);
      await supabase.storage.from(bucket).upload(`${stem}-640.webp`, thumb, { contentType: 'image/webp', upsert: false, cacheControl: '31536000' });
    }
  } catch {
    // Navigateur sans conversion WebP : on garde le fichier d'origine.
    path = `${stem}.${file.name.split('.').pop()?.toLowerCase() || 'jpg'}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error('L’image n’a pas pu être importée.');
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

// --- Création : ancienne adresse conservée quand l'adresse change ---

export async function recordPreviousSlug(id: string, newSlug: string) {
  const { data } = await supabase.from('products').select('slug').eq('id', id).maybeSingle();
  if (data?.slug && data.slug !== newSlug) await supabase.from('products').update({ previous_slug: data.slug }).eq('id', id);
}

// --- Galerie photos d'une création ---

export type ProductImageRow = { id: string; product_id: string; storage_path: string; public_url: string; alt_text: string; display_order: number; is_main: boolean };

export async function fetchProductImages(productId: string) {
  const { data, error } = await supabase.from('product_images').select('*').eq('product_id', productId).order('is_main', { ascending: false }).order('display_order');
  if (error) throw new Error('Impossible de charger les photos.');
  return (data ?? []) as ProductImageRow[];
}

/** Enregistre l'ordre, la photo principale et les textes alternatifs de toute la galerie. */
export type GalleryImage = Omit<ProductImageRow, 'id' | 'product_id'> & { id?: string };

export async function saveProductImages(productId: string, images: GalleryImage[], removedIds: string[]) {
  for (const id of removedIds) {
    const { error } = await supabase.from('product_images').delete().eq('id', id);
    if (error) throw new Error('Une photo n’a pas pu être supprimée.');
  }
  for (const [index, image] of images.entries()) {
    const row = { product_id: productId, storage_path: image.storage_path, public_url: image.public_url, alt_text: image.alt_text, display_order: index, is_main: index === 0 };
    const { error } = image.id ? await supabase.from('product_images').update(row).eq('id', image.id) : await supabase.from('product_images').insert(row);
    if (error) throw new Error('Une photo n’a pas pu être enregistrée.');
  }
}

// --- Saisons d'une création ---

export async function fetchProductSeasonIds(productId: string) {
  const { data, error } = await supabase.from('product_seasons').select('season_id').eq('product_id', productId);
  if (error) throw new Error('Impossible de charger les saisons de la création.');
  return (data ?? []).map((row) => row.season_id as string);
}

export async function saveProductSeasons(productId: string, seasonIds: string[]) {
  const { error } = await supabase.from('product_seasons').delete().eq('product_id', productId);
  if (error) throw new Error('Les saisons n’ont pas pu être enregistrées.');
  if (seasonIds.length) {
    const { error: insertError } = await supabase.from('product_seasons').insert(seasonIds.map((season_id) => ({ product_id: productId, season_id })));
    if (insertError) throw new Error('Les saisons n’ont pas pu être enregistrées.');
  }
}

export async function setProductFlag(id: string, flag: 'published' | 'featured', value: boolean) {
  const { error } = await supabase.from('products').update({ [flag]: value }).eq('id', id);
  if (error) throw new Error('La modification n’a pas pu être enregistrée.');
}

// --- Matières ---

export type MaterialRow = { id: string; slug: string; name: string; description: string; image: string | null; display_order: number; published: boolean };

export async function fetchAdminMaterials() {
  const { data, error } = await supabase.from('materials').select('*').order('display_order');
  if (error) throw new Error('Impossible de charger les matières.');
  return (data ?? []) as MaterialRow[];
}

export async function saveMaterial(material: Partial<MaterialRow> & { name: string }) {
  const { id, ...rest } = material;
  const payload = { ...rest, name: rest.name.trim(), slug: slugify(rest.slug || rest.name) };
  const result = id ? await supabase.from('materials').update(payload).eq('id', id).select().maybeSingle() : await supabase.from('materials').insert(payload).select().maybeSingle();
  if (result.error || !result.data) throw new Error('La matière n’a pas pu être enregistrée.');
  return result.data as MaterialRow;
}

export async function deleteMaterial(id: string) {
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw new Error('La matière n’a pas pu être supprimée.');
}

// --- Réglages (coordonnées, réseaux) ---

export async function fetchSettings(keys: string[]) {
  const { data, error } = await supabase.from('site_settings').select('setting_key,setting_value').in('setting_key', keys);
  if (error) throw new Error('Impossible de charger les paramètres.');
  return Object.fromEntries((data ?? []).map((row) => [row.setting_key, typeof row.setting_value === 'string' ? row.setting_value : ''])) as Record<string, string>;
}

export async function saveSettings(values: Record<string, string>) {
  const rows = Object.entries(values).map(([setting_key, value]) => ({ setting_key, setting_value: value.trim(), is_public: true }));
  const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'setting_key' });
  if (error) throw new Error('Les paramètres n’ont pas pu être enregistrés.');
}

// --- Textes du site ---

export async function fetchTexts() {
  const { data, error } = await supabase.from('site_contents').select('page,section,content_key,value');
  if (error) throw new Error('Impossible de charger les textes.');
  return Object.fromEntries((data ?? []).map((row) => [`${row.page}.${row.section}.${row.content_key}`, typeof row.value === 'string' ? row.value : ''])) as Record<string, string>;
}

function splitKey(key: string) {
  const [page, section, ...rest] = key.split('.');
  return { page, section, content_key: rest.join('.') };
}

export async function saveText(key: string, value: string, multiline = false) {
  const { error } = await supabase.from('site_contents').upsert({ ...splitKey(key), content_type: multiline ? 'textarea' : 'text', value }, { onConflict: 'page,section,content_key' });
  if (error) throw new Error('Le texte n’a pas pu être enregistré.');
}

/** Supprime le texte personnalisé : le site affiche de nouveau le texte d'origine. */
export async function resetText(key: string) {
  const { page, section, content_key } = splitKey(key);
  const { error } = await supabase.from('site_contents').delete().eq('page', page).eq('section', section).eq('content_key', content_key);
  if (error) throw new Error('Le texte n’a pas pu être réinitialisé.');
}

// --- Boutique en ligne (Stripe, via la fonction serveur stripe-sync) ---

export type StripeStatus = { configured: boolean; mode?: 'test' | 'live'; account?: string; charges_enabled?: boolean; shop_enabled?: boolean; error?: string };
export type StripeSyncResult = { sellable?: boolean; url?: string; skipped?: boolean; reason?: string; error?: string; synced?: number; errors?: number };

async function stripeAction<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('stripe-sync', { body });
  if (error) {
    // Message renvoyé par la fonction (ex. erreur Stripe), sinon message générique.
    const detail = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(detail?.error || 'La boutique en ligne ne répond pas pour le moment.');
  }
  return data as T;
}

export const fetchStripeStatus = () => stripeAction<StripeStatus>({ action: 'status' });
export const syncProductWithStripe = (productId: string) => stripeAction<StripeSyncResult>({ action: 'sync', product_id: productId });
export const archiveProductInStripe = (productId: string) => stripeAction<StripeSyncResult>({ action: 'archive', product_id: productId });
export const syncAllWithStripe = () => stripeAction<StripeSyncResult>({ action: 'sync_all' });

export type ProductStripeState = { sell_online: boolean; stripe_payment_link_url: string | null; stripe_synced_at: string | null; stripe_sync_error: string | null; stripe_product_id: string | null };

export async function fetchProductStripeState(productId: string) {
  const { data } = await supabase.from('products').select('sell_online,stripe_payment_link_url,stripe_synced_at,stripe_sync_error,stripe_product_id').eq('id', productId).maybeSingle();
  return data as ProductStripeState | null;
}

// --- Commandes ---

export type OrderRow = {
  id: string; product_id: string | null; product_name: string; quantity: number; amount_total: number; shipping_amount: number; currency: string;
  customer_name: string | null; customer_email: string | null; customer_phone: string | null;
  shipping_address: { line1?: string; line2?: string; postal_code?: string; city?: string; country?: string } | null;
  status: 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'; admin_notes: string | null; created_at: string;
};

export async function fetchOrders() {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) throw new Error('Impossible de charger les commandes.');
  return (data ?? []) as OrderRow[];
}

export async function updateOrder(id: string, values: Partial<Pick<OrderRow, 'status' | 'admin_notes'>>) {
  const { error } = await supabase.from('orders').update(values).eq('id', id);
  if (error) throw new Error('La commande n’a pas pu être mise à jour.');
}

// --- Questions fréquentes ---

export type FaqRow = { id: string; question: string; answer: string; display_order: number; published: boolean };

export async function fetchAdminFaqs() {
  const { data, error } = await supabase.from('faqs').select('*').order('display_order');
  if (error) throw new Error('Impossible de charger les questions.');
  return (data ?? []) as FaqRow[];
}

export async function saveFaq(faq: Partial<FaqRow> & { question: string; answer: string }) {
  const { id, ...payload } = faq;
  const result = id ? await supabase.from('faqs').update(payload).eq('id', id).select().maybeSingle() : await supabase.from('faqs').insert(payload).select().maybeSingle();
  if (result.error || !result.data) throw new Error('La question n’a pas pu être enregistrée.');
  return result.data as FaqRow;
}

export async function deleteFaq(id: string) {
  const { error } = await supabase.from('faqs').delete().eq('id', id);
  if (error) throw new Error('La question n’a pas pu être supprimée.');
}
