// Avis Google de l'atelier, pour le site (section « Avis »).
// Lit la fiche Google (Places API) avec la clé GOOGLE_PLACES_API_KEY, gardée côté serveur,
// et met le résultat en cache 12 heures (table google_reviews_cache) : quelques appels par mois.
//   { }                    avis à afficher (depuis le cache si récent)
//   { refresh: true }      relecture immédiate, réservée à l'administration
// Sans clé configurée, renvoie { configured: false } : le site n'affiche alors que l'invitation à donner un avis.
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

type GoogleReview = {
  name?: string; rating?: number; relativePublishTimeDescription?: string; publishTime?: string; googleMapsUri?: string;
  text?: { text?: string }; originalText?: { text?: string };
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
};
type GooglePlace = { displayName?: { text?: string }; rating?: number; userRatingCount?: number; googleMapsUri?: string; reviews?: GoogleReview[] };

async function isStaff(db: ReturnType<typeof createClient>, req: Request) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const { data } = await db.auth.getUser(token);
  if (!data.user) return false;
  const { data: profile } = await db.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  return profile?.role === 'admin' || profile?.role === 'editor';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  let body: { refresh?: boolean } = {};
  try { body = await req.json(); } catch { /* corps vide */ }

  const { data: setting } = await db.from('site_settings').select('setting_value').eq('setting_key', 'google_place_id').maybeSingle();
  const placeId = String(setting?.setting_value ?? '').trim();
  const key = Deno.env.get('GOOGLE_PLACES_API_KEY')?.trim();
  if (!placeId || !/^[A-Za-z0-9_-]{10,300}$/.test(placeId)) return json({ configured: false, reason: 'place_id' });
  if (!key) return json({ configured: false, reason: 'api_key' });

  const refresh = body.refresh === true && (await isStaff(db, req));
  const { data: cache } = await db.from('google_reviews_cache').select('payload,fetched_at').eq('place_id', placeId).maybeSingle();
  if (cache && !refresh && Date.now() - new Date(cache.fetched_at).getTime() < MAX_AGE_MS) return json({ configured: true, ...cache.payload, fetched_at: cache.fetched_at });

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=fr&regionCode=FR`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'displayName,rating,userRatingCount,googleMapsUri,reviews' },
    });
    const place = await res.json() as GooglePlace & { error?: { message?: string } };
    if (!res.ok) throw new Error(place.error?.message || `Google a répondu ${res.status}`);
    const payload = {
      name: place.displayName?.text || '',
      rating: place.rating ?? null,
      count: place.userRatingCount ?? 0,
      maps_uri: place.googleMapsUri || '',
      reviews: (place.reviews ?? []).map((review) => ({
        id: review.name || crypto.randomUUID(),
        rating: review.rating ?? 0,
        text: (review.originalText?.text || review.text?.text || '').trim(),
        relative_time: review.relativePublishTimeDescription || '',
        publish_time: review.publishTime || null,
        review_uri: review.googleMapsUri || '',
        author: review.authorAttribution?.displayName || 'Client Google',
        author_uri: review.authorAttribution?.uri || '',
        author_photo: review.authorAttribution?.photoUri || '',
      })),
    };
    const fetchedAt = new Date().toISOString();
    await db.from('google_reviews_cache').upsert({ place_id: placeId, payload, fetched_at: fetchedAt });
    return json({ configured: true, ...payload, fetched_at: fetchedAt });
  } catch (error) {
    // Google injoignable ou clé refusée : derniers avis connus, sinon section réduite à l'invitation.
    if (cache) return json({ configured: true, ...cache.payload, fetched_at: cache.fetched_at, stale: true, error: refresh ? (error as Error).message : undefined });
    return json({ configured: true, error: refresh ? (error as Error).message : 'unavailable', reviews: [], rating: null, count: 0 });
  }
});
