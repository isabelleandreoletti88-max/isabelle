// Logique commune de la boutique : réglages, commandes, e-mails et confirmation de paiement.
// Utilisée par checkout-create, checkout-status, stripe-webhook et order-update.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.57.4';
import { SITE_URL } from './stripe.ts';
import { escapeHtml, sendMail, smtpUser } from './mail.ts';

// ---------------------------------------------------------------------------
// Réglages
// ---------------------------------------------------------------------------

export type ShopSettings = {
  enabled: boolean;
  homeDelivery: boolean;
  shippingCents: number;
  shippingNote: string;
  pickup: boolean;
  pickupName: string;
  pickupAddress: string;
  pickupInstructions: string;
  notificationEmail: string;
  vatFranchise: boolean;
  brandName: string;
};

const SHOP_KEYS = ['shop_enabled', 'shop_shipping_fee', 'shop_shipping_note', 'shop_home_delivery_enabled', 'shop_pickup_enabled', 'shop_pickup_name', 'shop_pickup_address', 'shop_pickup_instructions', 'notification_email', 'brand_name'];

/** Convertit « 5,90 » ou « 5.90 » en centimes ; null si la valeur n'est pas un montant valable. */
export function toCents(value: unknown): number | null {
  const n = Number(String(value ?? '').trim().replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 1000) return null;
  return Math.round(n * 100);
}

export async function loadShopSettings(db: SupabaseClient): Promise<ShopSettings> {
  const [{ data }, { data: legal }] = await Promise.all([
    db.from('site_settings').select('setting_key,setting_value').in('setting_key', SHOP_KEYS),
    db.from('legal_settings').select('setting_key,setting_value').in('setting_key', ['editor_vat_franchise']),
  ]);
  const map: Record<string, string> = Object.fromEntries((data ?? []).map((row) => [row.setting_key, String(row.setting_value ?? '')]));
  const legalMap: Record<string, string> = Object.fromEntries((legal ?? []).map((row) => [row.setting_key, String(row.setting_value ?? '')]));
  return {
    enabled: map.shop_enabled === 'true',
    homeDelivery: map.shop_home_delivery_enabled !== 'false',
    shippingCents: toCents(map.shop_shipping_fee) ?? 590,
    shippingNote: map.shop_shipping_note || '',
    pickup: map.shop_pickup_enabled !== 'false' && Boolean(map.shop_pickup_address?.trim()),
    pickupName: map.shop_pickup_name?.trim() || '',
    pickupAddress: map.shop_pickup_address?.trim() || '',
    pickupInstructions: map.shop_pickup_instructions?.trim() || '',
    notificationEmail: (map.notification_email || smtpUser()).trim(),
    vatFranchise: legalMap.editor_vat_franchise === 'true',
    brandName: map.brand_name || "L'Atelier d'Isabelle",
  };
}

// ---------------------------------------------------------------------------
// Commandes
// ---------------------------------------------------------------------------

export type OrderItem = { product_id: string | null; product_name: string; product_slug: string | null; image_url: string | null; unit_price: number; quantity: number; line_total: number };
export type Address = { line1?: string | null; line2?: string | null; postal_code?: string | null; city?: string | null; state?: string | null; country?: string | null };
export type Order = {
  id: string; order_number: string | null; public_token: string; payment_status: string; fulfillment_status: string; delivery_method: 'shipping' | 'pickup';
  customer_first_name: string; customer_last_name: string; customer_email: string; customer_phone: string | null;
  shipping_name: string | null; shipping_address: Address | null; pickup_location: { name?: string; address?: string; instructions?: string } | null;
  subtotal_amount: number; shipping_amount: number; total_amount: number; amount_paid: number | null;
  stripe_session_id: string | null; stripe_payment_intent_id: string | null; carrier: string | null; tracking_number: string | null;
  alerts: string[]; created_at: string; paid_at: string | null;
  confirmation_email_sent_at: string | null; admin_email_sent_at: string | null; ready_email_sent_at: string | null; shipped_email_sent_at: string | null;
  order_items: OrderItem[];
};

export async function loadOrder(db: SupabaseClient, column: 'id' | 'stripe_session_id' | 'public_token' | 'stripe_payment_intent_id', value: string): Promise<Order | null> {
  const { data } = await db.from('orders').select('*, order_items(*)').eq(column, value).maybeSingle();
  if (!data) return null;
  const order = data as Order;
  for (const key of ['subtotal_amount', 'shipping_amount', 'total_amount', 'amount_paid'] as const) if (order[key] !== null) (order as Record<string, unknown>)[key] = Number(order[key]);
  order.order_items = (order.order_items ?? []).map((item) => ({ ...item, unit_price: Number(item.unit_price), line_total: Number(item.line_total) }));
  return order;
}

export const euro = (value: number) => `${value.toFixed(2).replace('.', ',')} €`;
export const formatAddress = (a: Address | null) => a ? [a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(' '), a.country === 'FR' ? 'France' : a.country].filter(Boolean) as string[] : [];
const reference = (order: Order) => order.order_number || `réf. ${order.id.slice(0, 8)}`;

// ---------------------------------------------------------------------------
// E-mails
// ---------------------------------------------------------------------------

function layout(title: string, intro: string, body: string) {
  return `<div style="background:#FBF3E4;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#2D1B0E">
<div style="max-width:600px;margin:0 auto;background:#FEFBF3;border-radius:14px;padding:28px 24px">
<p style="font-family:Georgia,serif;font-size:15px;color:#9A3F1E;margin:0 0 18px">L'Atelier d'Isabelle</p>
<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;line-height:1.2;margin:0 0 10px">${title}</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 22px;color:#4a3a2e">${intro}</p>
${body}
<p style="font-size:13px;line-height:1.6;color:#7a6a5d;margin:28px 0 0">Une question ? Répondez simplement à cet e-mail.<br>L'Atelier d'Isabelle — créations faites main dans les Vosges — <a href="${SITE_URL}" style="color:#C95F3A">atelier-isabelle.fr</a></p>
</div></div>`;
}

function itemsTable(order: Order, settings: ShopSettings) {
  const rows = order.order_items.map((item) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eadccb">${escapeHtml(item.product_name)}${item.quantity > 1 ? ` × ${item.quantity}` : ''}</td><td style="padding:8px 0;border-bottom:1px solid #eadccb;text-align:right;white-space:nowrap">${euro(item.line_total)}</td></tr>`).join('');
  const shippingLabel = order.delivery_method === 'shipping' ? 'Livraison à domicile' : 'Retrait en boutique';
  return `<table style="width:100%;border-collapse:collapse;font-size:15px">${rows}
<tr><td style="padding:8px 0;color:#7a6a5d">Sous-total</td><td style="padding:8px 0;text-align:right">${euro(order.subtotal_amount)}</td></tr>
<tr><td style="padding:4px 0;color:#7a6a5d">${shippingLabel}</td><td style="padding:4px 0;text-align:right">${order.shipping_amount ? euro(order.shipping_amount) : 'Gratuit'}</td></tr>
<tr><td style="padding:10px 0;font-weight:bold;border-top:2px solid #2D1B0E">Total payé</td><td style="padding:10px 0;font-weight:bold;text-align:right;border-top:2px solid #2D1B0E">${euro(order.amount_paid ?? order.total_amount)}</td></tr>
</table>${settings.vatFranchise ? '<p style="font-size:12px;color:#7a6a5d;margin:6px 0 0">TVA non applicable, article 293 B du Code général des impôts.</p>' : ''}`;
}

function itemsText(order: Order) {
  return [
    ...order.order_items.map((item) => `- ${item.product_name}${item.quantity > 1 ? ` × ${item.quantity}` : ''} : ${euro(item.line_total)}`),
    `Sous-total : ${euro(order.subtotal_amount)}`,
    `${order.delivery_method === 'shipping' ? 'Livraison à domicile' : 'Retrait en boutique'} : ${order.shipping_amount ? euro(order.shipping_amount) : 'gratuit'}`,
    `Total payé : ${euro(order.amount_paid ?? order.total_amount)}`,
  ].join('\n');
}

function receptionBlock(order: Order) {
  if (order.delivery_method === 'shipping') {
    const lines = [order.shipping_name, ...formatAddress(order.shipping_address)].filter(Boolean) as string[];
    return {
      html: `<div style="background:#F6E8D0;border-radius:10px;padding:14px 16px;margin:18px 0;font-size:14px;line-height:1.6"><strong>Livraison à domicile</strong><br>${lines.map(escapeHtml).join('<br>')}<br><span style="color:#7a6a5d">Isabelle prépare et expédie votre colis elle-même. Vous recevrez un e-mail lors de l'expédition.</span></div>`,
      text: `Livraison à domicile :\n${lines.join('\n')}\nVous recevrez un e-mail lors de l'expédition.`,
    };
  }
  const place = order.pickup_location || {};
  return {
    html: `<div style="background:#F6E8D0;border-radius:10px;padding:14px 16px;margin:18px 0;font-size:14px;line-height:1.6"><strong>Retrait gratuit en boutique</strong><br>${escapeHtml(place.name || '')}${place.name ? '<br>' : ''}${escapeHtml(place.address || '').replace(/\n/g, '<br>')}${place.instructions ? `<br><span style="color:#7a6a5d">${escapeHtml(place.instructions)}</span>` : ''}<br><strong>Attendez notre e-mail « commande prête » avant de vous déplacer.</strong></div>`,
    text: `Retrait gratuit en boutique :\n${[place.name, place.address, place.instructions].filter(Boolean).join('\n')}\nAttendez notre e-mail « commande prête » avant de vous déplacer.`,
  };
}

type EmailKind = 'confirmation' | 'admin' | 'ready' | 'shipped';
const SENT_COLUMN: Record<EmailKind, keyof Order> = { confirmation: 'confirmation_email_sent_at', admin: 'admin_email_sent_at', ready: 'ready_email_sent_at', shipped: 'shipped_email_sent_at' };

function buildEmail(kind: EmailKind, order: Order, settings: ShopSettings) {
  const reception = receptionBlock(order);
  const ref = reference(order);
  if (kind === 'confirmation') {
    return {
      to: order.customer_email, replyTo: settings.notificationEmail,
      subject: `Merci pour votre commande ${ref} — L'Atelier d'Isabelle`,
      html: layout(`Merci ${escapeHtml(order.customer_first_name)} !`, `Votre paiement est confirmé. Voici le récapitulatif de votre commande <strong>${escapeHtml(ref)}</strong>.`, itemsTable(order, settings) + reception.html),
      text: `Merci ${order.customer_first_name} !\nVotre paiement est confirmé. Commande ${ref}.\n\n${itemsText(order)}\n\n${reception.text}\n\nUne question ? Répondez à cet e-mail.\nL'Atelier d'Isabelle — ${SITE_URL}`,
    };
  }
  if (kind === 'admin') {
    const contact = [`${order.customer_first_name} ${order.customer_last_name}`, order.customer_email, order.customer_phone].filter(Boolean) as string[];
    const alerts = order.alerts.length ? `<div style="background:#fde8e1;border-radius:10px;padding:12px 14px;margin:0 0 16px;font-size:14px"><strong>À vérifier :</strong><br>${order.alerts.map(escapeHtml).join('<br>')}</div>` : '';
    return {
      to: settings.notificationEmail, replyTo: order.customer_email,
      subject: `Nouvelle commande ${ref} — ${euro(order.amount_paid ?? order.total_amount)} — ${order.delivery_method === 'shipping' ? 'à expédier' : 'retrait en boutique'}`,
      html: layout('Nouvelle commande payée', `${escapeHtml(contact[0])} vient de payer sa commande <strong>${escapeHtml(ref)}</strong>.`, alerts + itemsTable(order, settings) + reception.html + `<p style="font-size:14px;line-height:1.6">${contact.map(escapeHtml).join('<br>')}</p><p><a href="${SITE_URL}/admin/commandes?commande=${order.id}" style="display:inline-block;background:#C95F3A;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:14px">Ouvrir la commande</a></p>`),
      text: `Nouvelle commande ${ref}\n${contact.join('\n')}\n\n${order.alerts.length ? `À vérifier : ${order.alerts.join(' ; ')}\n\n` : ''}${itemsText(order)}\n\n${reception.text}\n\n${SITE_URL}/admin/commandes?commande=${order.id}`,
    };
  }
  if (kind === 'ready') {
    const place = order.pickup_location || {};
    return {
      to: order.customer_email, replyTo: settings.notificationEmail,
      subject: `Votre commande ${ref} est prête — L'Atelier d'Isabelle`,
      html: layout('Votre commande est prête !', `Bonne nouvelle ${escapeHtml(order.customer_first_name)} : votre commande <strong>${escapeHtml(ref)}</strong> vous attend.`, `<div style="background:#F6E8D0;border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.6"><strong>${escapeHtml(place.name || 'Retrait en boutique')}</strong><br>${escapeHtml(place.address || '').replace(/\n/g, '<br>')}${place.instructions ? `<br><span style="color:#7a6a5d">${escapeHtml(place.instructions)}</span>` : ''}</div><p style="font-size:14px;line-height:1.6;margin-top:16px">Présentez simplement cet e-mail ou votre nom au retrait.</p>`),
      text: `Votre commande ${ref} est prête.\n${[place.name, place.address, place.instructions].filter(Boolean).join('\n')}\nPrésentez cet e-mail ou votre nom au retrait.`,
    };
  }
  const tracking = [order.carrier, order.tracking_number].filter(Boolean).join(' — numéro de suivi : ');
  return {
    to: order.customer_email, replyTo: settings.notificationEmail,
    subject: `Votre commande ${ref} est expédiée — L'Atelier d'Isabelle`,
    html: layout('Votre colis est en route !', `${escapeHtml(order.customer_first_name)}, Isabelle vient d'expédier votre commande <strong>${escapeHtml(ref)}</strong>.`, `${tracking ? `<p style="font-size:15px;line-height:1.6"><strong>Transporteur :</strong> ${escapeHtml(tracking)}</p>` : ''}${receptionBlock(order).html.replace("Vous recevrez un e-mail lors de l'expédition.", '')}`),
    text: `Votre commande ${ref} est expédiée.${tracking ? `\nTransporteur : ${tracking}` : ''}\n\n${formatAddress(order.shipping_address).join('\n')}`,
  };
}

/** Envoie un e-mail de commande et le note comme envoyé. Renvoie l'erreur éventuelle (sans lever). */
export async function sendOrderEmail(db: SupabaseClient, kind: EmailKind, order: Order, settings: ShopSettings): Promise<string | null> {
  try {
    await sendMail(buildEmail(kind, order, settings));
    await db.from('orders').update({ [SENT_COLUMN[kind]]: new Date().toISOString() }).eq('id', order.id);
    return null;
  } catch (error) {
    const message = `E-mail « ${kind} » non envoyé : ${(error as Error).message}`.slice(0, 300);
    await db.from('orders').update({ last_error: message }).eq('id', order.id);
    return message;
  }
}

// ---------------------------------------------------------------------------
// Confirmation du paiement (webhook Stripe, ou vérification directe auprès de Stripe)
// ---------------------------------------------------------------------------

export type CheckoutSession = {
  id: string; object?: string; status?: string; payment_status: string; payment_intent: string | null; amount_total: number | null; currency: string;
  metadata?: Record<string, string>; client_reference_id?: string | null;
  customer_details?: { name?: string | null; email?: string | null; phone?: string | null; address?: Address | null } | null;
  shipping_details?: { name?: string | null; address?: Address | null } | null;
  collected_information?: { shipping_details?: { name?: string | null; address?: Address | null } | null } | null;
  shipping_cost?: { amount_total?: number } | null;
};

async function findOrderForSession(db: SupabaseClient, session: CheckoutSession) {
  const id = session.metadata?.order_id || session.client_reference_id || '';
  if (/^[0-9a-f-]{36}$/i.test(id)) {
    const order = await loadOrder(db, 'id', id);
    if (order) return order;
  }
  return loadOrder(db, 'stripe_session_id', session.id);
}

/**
 * Passe la commande en « payée » à partir d'une session Stripe dont le paiement est confirmé.
 * Idempotent : la mise à jour n'a lieu que si la commande n'est pas déjà payée, et les e-mails,
 * le stock et le numéro ne sont traités qu'à ce moment-là.
 */
export async function markSessionPaid(db: SupabaseClient, session: CheckoutSession): Promise<{ order: Order | null; alreadyPaid: boolean }> {
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') return { order: null, alreadyPaid: false };
  const order = await findOrderForSession(db, session);
  if (!order) return { order: null, alreadyPaid: false };
  if (['paid', 'refunded'].includes(order.payment_status)) return { order, alreadyPaid: true };

  const shipping = session.collected_information?.shipping_details || session.shipping_details || null;
  const paidCents = session.amount_total ?? 0;
  const expectedCents = Math.round(order.total_amount * 100);
  const alerts = [...order.alerts];
  if (paidCents !== expectedCents) alerts.push(`Montant payé (${euro(paidCents / 100)}) différent du total prévu (${euro(order.total_amount)}).`);
  if (session.currency?.toLowerCase() !== 'eur') alerts.push(`Devise inattendue : ${session.currency}.`);
  if (order.delivery_method === 'shipping' && /^(97|98)/.test(shipping?.address?.postal_code || '')) alerts.push('Adresse hors France métropolitaine (code postal 97/98) : vérifier les frais de port avec le client.');

  const { data: updated } = await db.from('orders').update({
    payment_status: 'paid',
    paid_at: new Date().toISOString(),
    amount_paid: paidCents / 100,
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent,
    shipping_name: shipping?.name || null,
    shipping_address: order.delivery_method === 'shipping' ? (shipping?.address || null) : null,
    customer_phone: order.customer_phone || session.customer_details?.phone || null,
    alerts,
  }).eq('id', order.id).not('payment_status', 'in', '(paid,refunded)').select('id');
  // Une autre réception simultanée du même paiement a déjà fait le travail.
  if (!updated?.length) return { order: await loadOrder(db, 'id', order.id), alreadyPaid: true };

  // Stock : une pièce disponible sans quantité suivie est une pièce unique, donc vendue.
  for (const item of order.order_items) {
    if (!item.product_id) continue;
    const { data: product } = await db.from('products').select('id,name,availability_status,stock_quantity').eq('id', item.product_id).maybeSingle();
    if (!product) continue;
    if (product.availability_status === 'sold' || product.availability_status === 'unavailable') {
      alerts.push(`« ${item.product_name} » était déjà indiquée vendue ou indisponible : vérifier le stock avant de préparer.`);
      continue;
    }
    if (product.availability_status !== 'available') continue; // fabriquée à la commande
    if (product.stock_quantity === null) {
      if (item.quantity > 1) alerts.push(`« ${item.product_name} » commandée en ${item.quantity} exemplaires alors qu'il s'agit d'une pièce unique.`);
      await db.from('products').update({ availability_status: 'sold' }).eq('id', product.id);
    } else {
      const remaining = product.stock_quantity - item.quantity;
      if (remaining < 0) alerts.push(`Stock insuffisant pour « ${item.product_name} » (${product.stock_quantity} en stock, ${item.quantity} commandé(s)).`);
      await db.from('products').update({ stock_quantity: Math.max(0, remaining), ...(remaining <= 0 ? { availability_status: 'sold' } : {}) }).eq('id', product.id);
    }
  }
  if (alerts.length !== order.alerts.length) await db.from('orders').update({ alerts }).eq('id', order.id);

  const paid = await loadOrder(db, 'id', order.id);
  if (paid) {
    const settings = await loadShopSettings(db);
    await sendOrderEmail(db, 'confirmation', paid, settings);
    await sendOrderEmail(db, 'admin', paid, settings);
  }
  return { order: paid, alreadyPaid: false };
}

/** Résumé public d'une commande (page de confirmation) : pas d'adresse complète ni de téléphone. */
export function publicSummary(order: Order) {
  return {
    order_number: order.order_number,
    payment_status: order.payment_status,
    delivery_method: order.delivery_method,
    first_name: order.customer_first_name,
    email: order.customer_email,
    items: order.order_items.map((item) => ({ name: item.product_name, slug: item.product_slug, image: item.image_url, quantity: item.quantity, unit_price: item.unit_price, line_total: item.line_total })),
    subtotal: order.subtotal_amount,
    shipping: order.shipping_amount,
    total: order.amount_paid ?? order.total_amount,
    pickup_location: order.delivery_method === 'pickup' ? order.pickup_location : null,
    shipping_city: order.shipping_address?.city || null,
  };
}
