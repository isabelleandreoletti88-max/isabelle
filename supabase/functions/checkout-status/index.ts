// Page de confirmation et retour au panier.
//   { session_id }          état de la commande liée à cette session Stripe (résumé sans données sensibles).
//                           Si le webhook n'est pas encore arrivé, l'état est vérifié directement auprès
//                           de Stripe avec la clé secrète : la page elle-même ne peut rien déclarer « payé ».
//   { token, action: 'cancel' }   le client est revenu du paiement sans payer : la session Stripe est
//                           close et la pièce redevient disponible pour les autres visiteurs.
import { StripeError, adminClient, corsHeaders, json, stripe, stripeKey } from '../_shared/stripe.ts';
import { loadOrder, markSessionPaid, publicSummary, type CheckoutSession } from '../_shared/shop.ts';

const UUID = /^[0-9a-f-]{36}$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);
  const db = adminClient();
  let body: { session_id?: string; token?: string; action?: string } = {};
  try { body = await req.json(); } catch { return json({ error: 'Demande illisible.' }, 400); }

  if (body.action === 'cancel') {
    if (!UUID.test(String(body.token))) return json({ error: 'Référence invalide.' }, 400);
    const order = await loadOrder(db, 'public_token', body.token!);
    if (!order || order.payment_status !== 'pending') return json({ cancelled: false, payment_status: order?.payment_status ?? null });
    if (order.stripe_session_id && stripeKey()) {
      try { await stripe('POST', `checkout/sessions/${order.stripe_session_id}/expire`); }
      catch (error) {
        // Session déjà payée (paiement à l'instant) : on ne touche à rien, le webhook la confirmera.
        if (!(error instanceof StripeError) || /complete/i.test(error.message)) return json({ cancelled: false, payment_status: 'pending' });
      }
    }
    await db.from('orders').update({ payment_status: 'cancelled' }).eq('id', order.id).eq('payment_status', 'pending');
    return json({ cancelled: true });
  }

  const sessionId = String(body.session_id || '');
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId)) return json({ error: 'Référence de paiement invalide.' }, 400);
  let order = await loadOrder(db, 'stripe_session_id', sessionId);
  if (!order) return json({ error: 'Commande introuvable.' }, 404);

  if (['pending', 'processing'].includes(order.payment_status) && stripeKey()) {
    try {
      const session = await stripe<CheckoutSession>('GET', `checkout/sessions/${sessionId}`);
      if (session.payment_status === 'paid') order = (await markSessionPaid(db, session)).order ?? order;
      else if (session.status === 'complete' && order.payment_status === 'pending') {
        await db.from('orders').update({ payment_status: 'processing' }).eq('id', order.id).eq('payment_status', 'pending');
        order = { ...order, payment_status: 'processing' };
      }
    } catch { /* Stripe injoignable : la page réessaiera, le webhook fera foi. */ }
  }
  return json(publicSummary(order));
});
