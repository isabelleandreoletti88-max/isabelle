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

export async function fetchSiteContents() {
  const { data, error } = await supabase.from('site_contents').select('*').order('page').order('section').order('content_key');
  if (error) throw new Error('Impossible de charger les contenus.');
  return data ?? [];
}

export async function saveSiteContent(input: { id?: string; page: string; section: string; content_key: string; content_type: string; value: string }) {
  const payload = {
    page: input.page.trim(),
    section: input.section.trim(),
    content_key: input.content_key.trim(),
    content_type: input.content_type,
    value: input.content_type === 'json' ? JSON.parse(input.value || '{}') : input.value,
  };
  const result = input.id
    ? await supabase.from('site_contents').update(payload).eq('id', input.id).select().maybeSingle()
    : await supabase.from('site_contents').upsert(payload, { onConflict: 'page,section,content_key' }).select().maybeSingle();
  if (result.error || !result.data) throw new Error('Le contenu n’a pas pu être enregistré.');
  return result.data;
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
