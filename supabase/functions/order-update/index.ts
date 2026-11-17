// Traitement d'une commande depuis l'administration (équipe connectée uniquement).
//   { action: 'update', order_id, fulfillment_status?, carrier?, tracking_number?, admin_notes?, notify? }
//       « Prête pour retrait » et « Expédiée » envoient l'e-mail correspondant au client
//       (une seule fois, sauf renvoi explicite), si notify n'est pas false.
//   { action: 'resend', order_id, kind: 'confirmation' | 'admin' | 'ready' | 'shipped' }
import { adminClient, corsHeaders, isStaff, json } from '../_shared/stripe.ts';
import { loadOrder, loadShopSettings, sendOrderEmail } from '../_shared/shop.ts';

const FULFILLMENT = ['to_prepare', 'ready_for_pickup', 'shipped', 'completed', 'cancelled'];
const clean = (value: unknown, max: number) => value === undefined ? undefined : String(value ?? '').trim().slice(0, max) || null;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const db = adminClient();
  if (!(await isStaff(db, req))) return json({ error: 'Accès réservé à l’administration.' }, 403);
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json({ error: 'Demande illisible.' }, 400); }

  const order = /^[0-9a-f-]{36}$/i.test(String(body.order_id)) ? await loadOrder(db, 'id', String(body.order_id)) : null;
  if (!order) return json({ error: 'Commande introuvable.' }, 404);
  const settings = await loadShopSettings(db);

  if (body.action === 'resend') {
    const kind = String(body.kind);
    if (!['confirmation', 'admin', 'ready', 'shipped'].includes(kind)) return json({ error: 'E-mail inconnu.' }, 400);
    if (!['paid', 'refunded'].includes(order.payment_status)) return json({ error: 'Cette commande n’est pas payée.' }, 400);
    const error = await sendOrderEmail(db, kind as 'confirmation', order, settings);
    return error ? json({ error }, 502) : json({ sent: true, order: await loadOrder(db, 'id', order.id) });
  }

  if (body.action !== 'update') return json({ error: 'Action inconnue.' }, 400);
  const patch: Record<string, unknown> = {};
  const status = body.fulfillment_status === undefined ? undefined : String(body.fulfillment_status);
  if (status !== undefined) {
    if (!FULFILLMENT.includes(status)) return json({ error: 'Statut inconnu.' }, 400);
    if (status !== order.fulfillment_status) {
      if (status !== 'cancelled' && order.payment_status !== 'paid') return json({ error: 'Seule une commande payée peut être préparée.' }, 400);
      if (status === 'ready_for_pickup' && order.delivery_method !== 'pickup') return json({ error: 'Cette commande est à expédier, pas à retirer en boutique.' }, 400);
      if (status === 'shipped' && order.delivery_method !== 'shipping') return json({ error: 'Cette commande est à retirer en boutique.' }, 400);
      patch.fulfillment_status = status;
      if (status === 'ready_for_pickup') patch.ready_at = new Date().toISOString();
      if (status === 'shipped') patch.shipped_at = new Date().toISOString();
    }
  }
  for (const [key, max] of [['carrier', 60], ['tracking_number', 80], ['admin_notes', 4000]] as const) {
    const value = clean(body[key], max);
    if (value !== undefined) patch[key] = value;
  }
  if (Object.keys(patch).length) {
    const { error } = await db.from('orders').update(patch).eq('id', order.id);
    if (error) return json({ error: 'La commande n’a pas pu être mise à jour.' }, 500);
  }

  let updated = await loadOrder(db, 'id', order.id);
  let emailError: string | null = null;
  let emailSent: string | null = null;
  if (updated && body.notify !== false) {
    if (patch.fulfillment_status === 'ready_for_pickup' && !updated.ready_email_sent_at) { emailError = await sendOrderEmail(db, 'ready', updated, settings); emailSent = emailError ? null : 'ready'; }
    if (patch.fulfillment_status === 'shipped' && !updated.shipped_email_sent_at) { emailError = await sendOrderEmail(db, 'shipped', updated, settings); emailSent = emailError ? null : 'shipped'; }
    if (emailSent || emailError) updated = await loadOrder(db, 'id', order.id);
  }
  return json({ order: updated, email_sent: emailSent, email_error: emailError });
});
