// Reçoit les paiements Stripe (checkout.session.completed) : enregistre la commande dans
// l'administration et, pour une pièce unique, la passe en « Vendue » et retire son lien de paiement.
// Appelée par Stripe : pas de jeton utilisateur, la signature Stripe est vérifiée.
import { adminClient, getConfig, stripe, stripeKey } from '../_shared/stripe.ts';

async function hmacHex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verify(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(',').map((part) => part.split('=') as [string, string]));
  const timestamp = Number(parts.t);
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > 600) return false;
  const expected = await hmacHex(secret, `${parts.t}.${payload}`);
  return header.split(',').filter((part) => part.startsWith('v1=')).some((part) => safeEqual(part.slice(3), expected));
}

type Session = {
  id: string; payment_status: string; payment_intent: string | null; payment_link: string | null; amount_total: number; currency: string;
  metadata?: Record<string, string>;
  customer_details?: { name?: string; email?: string; phone?: string; address?: Record<string, string> };
  shipping_details?: { name?: string; address?: Record<string, string> };
  shipping_cost?: { amount_total?: number };
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Méthode non autorisée', { status: 405 });
  const db = adminClient();
  const payload = await req.text();
  const mode = stripeKey().startsWith('sk_live') || stripeKey().startsWith('rk_live') ? 'live' : 'test';
  const secret = await getConfig(db, `webhook_${mode}_secret`);
  if (!secret || !(await verify(payload, req.headers.get('Stripe-Signature') || '', secret))) return new Response('Signature invalide', { status: 400 });

  const event = JSON.parse(payload) as { type: string; data: { object: Session } };
  if (event.type !== 'checkout.session.completed') return new Response('ignoré', { status: 200 });
  const session = event.data.object;
  if (session.payment_status !== 'paid') return new Response('non payé', { status: 200 });

  // Retrouve la création : identifiant copié du lien de paiement, sinon par le lien lui-même.
  let productId = session.metadata?.supabase_id || null;
  if (!productId && session.payment_link) {
    const { data } = await db.from('products').select('id').eq('stripe_payment_link_id', session.payment_link).maybeSingle();
    productId = data?.id ?? null;
  }
  const { data: product } = productId ? await db.from('products').select('id,name,availability_status,stock_quantity').eq('id', productId).maybeSingle() : { data: null };

  const { error } = await db.from('orders').insert({
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent,
    product_id: product?.id ?? null,
    product_name: product?.name ?? 'Création',
    amount_total: session.amount_total / 100,
    shipping_amount: (session.shipping_cost?.amount_total ?? 0) / 100,
    currency: session.currency,
    customer_name: session.shipping_details?.name || session.customer_details?.name || null,
    customer_email: session.customer_details?.email || null,
    customer_phone: session.customer_details?.phone || null,
    shipping_address: session.shipping_details?.address || session.customer_details?.address || null,
  });
  // Stripe peut renvoyer le même événement : la commande n'est enregistrée qu'une fois.
  if (error && error.code === '23505') return new Response('déjà enregistrée', { status: 200 });
  if (error) return new Response(`Erreur : ${error.message}`, { status: 500 });

  // Pièce disponible : stock décrémenté ; sans stock suivi, c'est une pièce unique, donc vendue.
  if (product && product.availability_status === 'available') {
    const remaining = product.stock_quantity === null ? 0 : Math.max(0, product.stock_quantity - 1);
    await db.from('products').update({ stock_quantity: product.stock_quantity === null ? null : remaining, ...(remaining === 0 ? { availability_status: 'sold' } : {}) }).eq('id', product.id);
    if (remaining === 0 && session.payment_link) await stripe('POST', `payment_links/${session.payment_link}`, { active: false }).catch(() => {});
    if (remaining === 0) await db.from('products').update({ stripe_payment_link_url: null }).eq('id', product.id);
  }

  return new Response('ok', { status: 200 });
});
