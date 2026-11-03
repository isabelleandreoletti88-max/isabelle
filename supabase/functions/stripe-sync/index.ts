// Synchronise les créations avec Stripe, à la demande de l'administration du site.
// Isabelle ne va jamais sur Stripe : produit, prix, livraison et lien de paiement sont gérés ici.
//
// Actions (POST, utilisateur connecté de l'équipe) :
//   { action: 'status' }                      état de la connexion Stripe
//   { action: 'sync', product_id }            crée ou met à jour la création dans Stripe
//   { action: 'archive', product_id }         retire la création de la vente (avant suppression)
//   { action: 'sync_all' }                    resynchronise toutes les créations vendues en ligne
import { SITE_URL, StripeError, adminClient, corsHeaders, getConfig, json, setConfig, stripe, stripeKey } from '../_shared/stripe.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.57.4';

type Product = {
  id: string; name: string; slug: string; short_description: string; description: string; price: number | null;
  published: boolean; sell_online: boolean; availability_status: string;
  stripe_product_id: string | null; stripe_price_id: string | null; stripe_payment_link_id: string | null;
  product_images: { public_url: string; is_main: boolean; display_order: number }[];
};

type ShopSettings = { enabled: boolean; shippingCents: number };

async function shopSettings(db: SupabaseClient): Promise<ShopSettings> {
  const { data } = await db.from('site_settings').select('setting_key,setting_value').in('setting_key', ['shop_enabled', 'shop_shipping_fee']);
  const map = Object.fromEntries((data ?? []).map((row) => [row.setting_key, String(row.setting_value ?? '')]));
  const fee = Number(String(map.shop_shipping_fee || '0').replace(',', '.'));
  return { enabled: map.shop_enabled === 'true', shippingCents: Number.isFinite(fee) && fee > 0 ? Math.round(fee * 100) : 0 };
}

function mode() {
  return stripeKey().startsWith('sk_live') || stripeKey().startsWith('rk_live') ? 'live' : 'test';
}

/** Le point de réception des paiements est créé automatiquement dans Stripe, une fois par mode (test / réel). */
async function ensureWebhook(db: SupabaseClient) {
  const key = `webhook_${mode()}`;
  const existing = await getConfig(db, `${key}_id`);
  if (existing) {
    try {
      const endpoint = await stripe<{ status: string }>('GET', `webhook_endpoints/${existing}`);
      if (endpoint.status === 'enabled') return;
    } catch { /* recréé ci-dessous */ }
  }
  const endpoint = await stripe<{ id: string; secret: string }>('POST', 'webhook_endpoints', {
    url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/stripe-webhook`,
    enabled_events: ['checkout.session.completed'],
    description: 'atelier-isabelle.fr — commandes',
  });
  await setConfig(db, `${key}_id`, endpoint.id);
  await setConfig(db, `${key}_secret`, endpoint.secret);
}

async function shippingRate(db: SupabaseClient, cents: number) {
  if (!cents) return null;
  const key = `shipping_rate_${mode()}_${cents}`;
  const cached = await getConfig(db, key);
  if (cached) return cached;
  const rate = await stripe<{ id: string }>('POST', 'shipping_rates', {
    display_name: 'Livraison en France métropolitaine',
    type: 'fixed_amount',
    fixed_amount: { amount: cents, currency: 'eur' },
  });
  await setConfig(db, key, rate.id);
  return rate.id;
}

async function loadProduct(db: SupabaseClient, id: string) {
  const { data, error } = await db.from('products').select('id,name,slug,short_description,description,price,published,sell_online,availability_status,stripe_product_id,stripe_price_id,stripe_payment_link_id,product_images(public_url,is_main,display_order)').eq('id', id).maybeSingle();
  if (error || !data) throw new Error('Création introuvable.');
  return data as Product;
}

async function saveState(db: SupabaseClient, id: string, values: Record<string, unknown>) {
  await db.from('products').update({ ...values, stripe_synced_at: new Date().toISOString() }).eq('id', id);
}

/** Retire une création de la vente : lien de paiement désactivé, produit Stripe archivé. */
async function unpublish(db: SupabaseClient, product: Product) {
  if (product.stripe_payment_link_id) await stripe('POST', `payment_links/${product.stripe_payment_link_id}`, { active: false }).catch(() => {});
  if (product.stripe_product_id) await stripe('POST', `products/${product.stripe_product_id}`, { active: false }).catch(() => {});
  await saveState(db, product.id, { stripe_payment_link_url: null, stripe_sync_error: null });
}

async function syncProduct(db: SupabaseClient, productId: string, settings: ShopSettings) {
  const product = await loadProduct(db, productId);
  const sellable = settings.enabled && product.sell_online && product.published && (product.price ?? 0) > 0 && ['available', 'made_to_order'].includes(product.availability_status);
  if (!sellable) {
    await unpublish(db, product);
    return { sellable: false };
  }

  const images = [...product.product_images].sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.display_order - b.display_order).slice(0, 8).map((image) => image.public_url);
  const productData = {
    name: product.name.trim(),
    description: (product.short_description || product.description || product.name).trim().slice(0, 4000),
    images,
    url: `${SITE_URL}/creations/${product.slug}`,
    active: true,
    metadata: { supabase_id: product.id },
  };

  // Produit
  let stripeProductId = product.stripe_product_id;
  if (stripeProductId) {
    try { await stripe('POST', `products/${stripeProductId}`, productData); }
    catch (error) { if (error instanceof StripeError && error.code === 'resource_missing') stripeProductId = null; else throw error; }
  }
  if (!stripeProductId) stripeProductId = (await stripe<{ id: string }>('POST', 'products', productData)).id;

  // Prix : un prix Stripe ne se modifie pas, on en crée un nouveau et on archive l'ancien.
  const amount = Math.round((product.price ?? 0) * 100);
  let priceId = product.stripe_price_id;
  if (priceId) {
    const current = await stripe<{ active: boolean; unit_amount: number; product: string }>('GET', `prices/${priceId}`).catch(() => null);
    if (!current || !current.active || current.unit_amount !== amount || current.product !== stripeProductId) priceId = null;
  }
  if (!priceId) {
    priceId = (await stripe<{ id: string }>('POST', 'prices', { product: stripeProductId, unit_amount: amount, currency: 'eur' })).id;
    await stripe('POST', `products/${stripeProductId}`, { default_price: priceId });
    if (product.stripe_price_id && product.stripe_price_id !== priceId) await stripe('POST', `prices/${product.stripe_price_id}`, { active: false }).catch(() => {});
  }

  // Lien de paiement : recréé si le prix ou la livraison change.
  const rateId = await shippingRate(db, settings.shippingCents);
  const signature = `${priceId}|${rateId ?? 'sans-livraison'}|cgv1`;
  let link: { id: string; url: string } | null = null;
  if (product.stripe_payment_link_id) {
    const current = await stripe<{ id: string; url: string; active: boolean; metadata: Record<string, string> }>('GET', `payment_links/${product.stripe_payment_link_id}`).catch(() => null);
    if (current && current.metadata?.signature === signature) {
      link = current;
      if (!current.active) await stripe('POST', `payment_links/${current.id}`, { active: true });
    }
  }
  if (!link) {
    link = await stripe<{ id: string; url: string }>('POST', 'payment_links', {
      line_items: [{ price: priceId, quantity: 1 }],
      after_completion: { type: 'redirect', redirect: { url: `${SITE_URL}/merci?creation=${encodeURIComponent(product.slug)}` } },
      shipping_address_collection: { allowed_countries: ['FR'] },
      ...(rateId ? { shipping_options: [{ shipping_rate: rateId }] } : {}),
      phone_number_collection: { enabled: true },
      billing_address_collection: 'auto',
      custom_text: { submit: { message: `En validant le paiement, vous acceptez les conditions générales de vente (${SITE_URL}/conditions-generales-de-vente). Droit de rétractation : 14 jours après réception.` } },
      metadata: { supabase_id: product.id, signature },
    });
    if (product.stripe_payment_link_id && product.stripe_payment_link_id !== link.id) await stripe('POST', `payment_links/${product.stripe_payment_link_id}`, { active: false }).catch(() => {});
  }

  await saveState(db, product.id, {
    stripe_product_id: stripeProductId,
    stripe_price_id: priceId,
    stripe_payment_link_id: link.id,
    stripe_payment_link_url: link.url,
    stripe_sync_error: null,
  });
  return { sellable: true, url: link.url };
}

async function requireStaff(db: SupabaseClient, req: Request) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const { data } = await db.auth.getUser(token);
  if (!data.user) return false;
  const { data: profile } = await db.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  return profile?.role === 'admin' || profile?.role === 'editor';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const db = adminClient();
  if (!(await requireStaff(db, req))) return json({ error: 'Accès réservé à l’administration.' }, 403);

  let body: { action?: string; product_id?: string } = {};
  try { body = await req.json(); } catch { /* corps vide */ }

  if (body.action === 'status') {
    if (!stripeKey()) return json({ configured: false });
    try {
      const account = await stripe<{ settings?: { dashboard?: { display_name?: string } }; business_profile?: { name?: string }; charges_enabled?: boolean }>('GET', 'account');
      await ensureWebhook(db);
      const settings = await shopSettings(db);
      return json({ configured: true, mode: mode(), account: account.settings?.dashboard?.display_name || account.business_profile?.name || '', charges_enabled: account.charges_enabled ?? true, shop_enabled: settings.enabled });
    } catch (error) {
      return json({ configured: true, error: (error as Error).message });
    }
  }

  const settings = await shopSettings(db);

  try {
    if (stripeKey()) await ensureWebhook(db);
    if (body.action === 'sync' && body.product_id) {
      if (!stripeKey()) return json({ skipped: true, reason: 'not_configured' });
      return json(await syncProduct(db, body.product_id, settings));
    }
    if (body.action === 'archive' && body.product_id) {
      if (!stripeKey()) return json({ skipped: true });
      await unpublish(db, await loadProduct(db, body.product_id));
      return json({ archived: true });
    }
    if (body.action === 'sync_all') {
      if (!stripeKey()) return json({ skipped: true, reason: 'not_configured' });
      const { data } = await db.from('products').select('id').or('sell_online.eq.true,stripe_product_id.not.is.null');
      const results = [];
      for (const row of data ?? []) {
        try { results.push({ id: row.id, ...(await syncProduct(db, row.id, settings)) }); }
        catch (error) {
          await saveState(db, row.id, { stripe_sync_error: (error as Error).message.slice(0, 300) });
          results.push({ id: row.id, error: (error as Error).message });
        }
      }
      return json({ synced: results.length, errors: results.filter((r) => 'error' in r).length });
    }
    return json({ error: 'Action inconnue.' }, 400);
  } catch (error) {
    if (body.product_id) await saveState(db, body.product_id, { stripe_sync_error: (error as Error).message.slice(0, 300) });
    return json({ error: (error as Error).message }, 500);
  }
});
