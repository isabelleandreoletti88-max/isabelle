// Reçoit les notifications de Stripe. Seule source qui fait passer une commande à « payée »
// (avec la vérification directe de checkout-status). La signature Stripe est vérifiée ;
// chaque événement n'est traité qu'une fois (table stripe_events), et la mise à jour
// « payée » elle-même est conditionnelle : un événement reçu deux fois ne crée ni doublon
// ni second e-mail.
//
// Événements traités :
//   checkout.session.completed               paiement immédiat (carte) ou paiement différé lancé
//   checkout.session.async_payment_succeeded paiement différé confirmé
//   checkout.session.async_payment_failed    paiement différé refusé
//   checkout.session.expired                 paiement abandonné (session expirée)
//   charge.refunded                          remboursement fait depuis Stripe
import { adminClient, getConfig, stripeMode } from '../_shared/stripe.ts';
import { markSessionPaid, type CheckoutSession } from '../_shared/shop.ts';

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
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const expected = await hmacHex(secret, `${parts.t}.${payload}`);
  return header.split(',').filter((part) => part.startsWith('v1=')).some((part) => safeEqual(part.slice(3), expected));
}

type Charge = { id: string; payment_intent: string | null; amount: number; amount_refunded: number; refunded: boolean };
type Event = { id: string; type: string; livemode: boolean; data: { object: CheckoutSession & Charge } };

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Méthode non autorisée', { status: 405 });
  const db = adminClient();
  const payload = await req.text();
  const secret = await getConfig(db, `webhook_${stripeMode()}_secret`);
  if (!secret || !(await verify(payload, req.headers.get('Stripe-Signature') || '', secret))) return new Response('Signature invalide', { status: 400 });

  const event = JSON.parse(payload) as Event;
  // Un événement de test ne doit jamais toucher une boutique en mode réel, et inversement.
  if (event.livemode !== (stripeMode() === 'live')) return new Response('mode différent, ignoré', { status: 200 });

  const { error: duplicate } = await db.from('stripe_events').insert({ id: event.id, type: event.type });
  if (duplicate) return new Response(duplicate.code === '23505' ? 'déjà traité' : `Erreur : ${duplicate.message}`, { status: duplicate.code === '23505' ? 200 : 500 });

  try {
    const object = event.data.object;
    const orderId = object.metadata?.order_id || object.client_reference_id || null;
    const updateOrder = (values: Record<string, unknown>) => { const query = db.from('orders').update(values); return orderId ? query.eq('id', orderId) : query.eq('stripe_session_id', object.id); };

    switch (event.type) {
      case 'checkout.session.completed':
        if (object.payment_status === 'paid' || object.payment_status === 'no_payment_required') await markSessionPaid(db, object);
        // Paiement différé : la commande attend la confirmation de la banque.
        else await updateOrder({ payment_status: 'processing', stripe_session_id: object.id, stripe_payment_intent_id: object.payment_intent }).eq('payment_status', 'pending');
        break;
      case 'checkout.session.async_payment_succeeded':
        await markSessionPaid(db, object);
        break;
      case 'checkout.session.async_payment_failed':
        await updateOrder({ payment_status: 'failed', last_error: 'Paiement différé refusé par la banque.' }).in('payment_status', ['pending', 'processing']);
        break;
      case 'checkout.session.expired':
        await updateOrder({ payment_status: 'expired' }).eq('payment_status', 'pending');
        break;
      case 'charge.refunded': {
        if (!object.payment_intent) break;
        const full = object.refunded || object.amount_refunded >= object.amount;
        const { data: order } = await db.from('orders').select('id,alerts').eq('stripe_payment_intent_id', object.payment_intent).maybeSingle();
        if (!order) break;
        if (full) await db.from('orders').update({ payment_status: 'refunded' }).eq('id', order.id);
        else await db.from('orders').update({ alerts: [...(order.alerts ?? []), `Remboursement partiel de ${(object.amount_refunded / 100).toFixed(2).replace('.', ',')} € effectué dans Stripe.`] }).eq('id', order.id);
        break;
      }
    }
    return new Response('ok', { status: 200 });
  } catch (error) {
    // Échec : l'événement est retiré pour que Stripe le renvoie plus tard.
    await db.from('stripe_events').delete().eq('id', event.id);
    return new Response(`Erreur : ${(error as Error).message}`, { status: 500 });
  }
});
