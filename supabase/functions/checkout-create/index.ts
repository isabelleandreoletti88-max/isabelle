// Crée la session de paiement Stripe Checkout à partir du panier du site.
// Le navigateur n'envoie que des identifiants de créations, des quantités, le mode de réception
// et les coordonnées : prix, frais de livraison et total sont recalculés ici depuis le catalogue.
// La commande est enregistrée « en attente » ; seul le webhook Stripe (ou une vérification
// directe auprès de Stripe) peut la passer « payée ».
import { SITE_URL, StripeError, adminClient, corsHeaders, isStaff, json, stripe, stripeKey, stripeMode } from '../_shared/stripe.ts';
import { loadShopSettings } from '../_shared/shop.ts';

type Body = {
  items?: { product_id?: string; quantity?: number }[];
  delivery?: string;
  customer?: { first_name?: string; last_name?: string; email?: string; phone?: string };
  accept_terms?: boolean;
  previous_token?: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const SESSION_MINUTES = 35; // Stripe impose au moins 30 minutes
const LOCKING_STATUSES = ['pending', 'processing'];

/** Adresse de retour : le site public, ou le poste de développement en mode test uniquement. */
function returnBase(req: Request) {
  const origin = req.headers.get('Origin') || '';
  if (stripeMode() === 'test' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return SITE_URL;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);
  const db = adminClient();

  let body: Body = {};
  try { body = await req.json(); } catch { return json({ error: 'Demande illisible.' }, 400); }

  const settings = await loadShopSettings(db);
  // Boutique fermée : seule l'équipe peut tester, et uniquement avec une clé Stripe de test.
  if (!settings.enabled && !(stripeMode() === 'test' && (await isStaff(db, req)))) return json({ error: 'La boutique en ligne n’est pas encore ouverte.', code: 'shop_closed' }, 403);
  if (!stripeKey()) return json({ error: 'Le paiement en ligne n’est pas encore configuré. Contactez l’atelier pour commander.', code: 'not_configured' }, 503);

  // --- Contrôle des données reçues ---
  const delivery = body.delivery === 'pickup' ? 'pickup' : body.delivery === 'shipping' ? 'shipping' : null;
  if (!delivery) return json({ error: 'Choisissez un mode de réception.' }, 400);
  if (delivery === 'shipping' && !settings.homeDelivery) return json({ error: 'La livraison à domicile n’est pas disponible pour le moment.' }, 400);
  if (delivery === 'pickup' && !settings.pickup) return json({ error: 'Le retrait en boutique n’est pas disponible pour le moment.' }, 400);
  if (body.accept_terms !== true) return json({ error: 'Merci d’accepter les conditions générales de vente.' }, 400);

  const customer = {
    first_name: clean(body.customer?.first_name, 60),
    last_name: clean(body.customer?.last_name, 60),
    email: clean(body.customer?.email, 120).toLowerCase(),
    phone: clean(body.customer?.phone, 25),
  };
  if (!customer.first_name || !customer.last_name) return json({ error: 'Indiquez votre prénom et votre nom.' }, 400);
  if (!EMAIL.test(customer.email)) return json({ error: 'Votre adresse e-mail semble incomplète.' }, 400);
  const phoneDigits = customer.phone.replace(/\D/g, '');
  if (delivery === 'pickup' && phoneDigits.length < 9) return json({ error: 'Indiquez un numéro de téléphone pour être prévenu(e) du retrait.' }, 400);
  if (customer.phone && (phoneDigits.length < 9 || phoneDigits.length > 15)) return json({ error: 'Le numéro de téléphone semble incorrect.' }, 400);

  const requested = new Map<string, number>();
  for (const item of body.items ?? []) {
    const quantity = Number(item.quantity);
    if (!UUID.test(String(item.product_id)) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return json({ error: 'Le panier contient un article invalide.' }, 400);
    requested.set(item.product_id!, (requested.get(item.product_id!) ?? 0) + quantity);
  }
  if (!requested.size || requested.size > 20) return json({ error: 'Votre panier est vide.' }, 400);

  // --- L'ancien passage au paiement de ce visiteur est annulé (il revient modifier son panier) ---
  if (body.previous_token && UUID.test(body.previous_token)) {
    const { data: previous } = await db.from('orders').select('id,stripe_session_id,payment_status').eq('public_token', body.previous_token).maybeSingle();
    if (previous?.payment_status === 'pending') {
      let released = !previous.stripe_session_id;
      if (previous.stripe_session_id) {
        try { await stripe('POST', `checkout/sessions/${previous.stripe_session_id}/expire`); released = true; }
        catch (error) { released = error instanceof StripeError && error.status === 400 && !/complete/i.test(error.message); }
      }
      if (released) await db.from('orders').update({ payment_status: 'cancelled' }).eq('id', previous.id).eq('payment_status', 'pending');
    }
  }

  // --- Prix et disponibilités depuis le catalogue ---
  const { data: products, error: productError } = await db.from('products')
    .select('id,name,slug,price,published,sell_online,availability_status,stock_quantity,product_images(public_url,is_main,display_order)')
    .in('id', [...requested.keys()]);
  if (productError) return json({ error: 'Le catalogue est momentanément indisponible. Réessayez dans un instant.' }, 503);

  // Quantités déjà réservées par des paiements en cours (pièces uniques et stocks limités).
  const since = new Date(Date.now() - (SESSION_MINUTES + 5) * 60000).toISOString();
  const { data: reservedRows } = await db.from('order_items').select('product_id,quantity,orders!inner(payment_status,created_at)')
    .in('product_id', [...requested.keys()]).in('orders.payment_status', LOCKING_STATUSES);
  const reserved = new Map<string, number>();
  for (const row of reservedRows ?? []) {
    const parent = row.orders as unknown as { payment_status: string; created_at: string };
    // Paiement en attente : réservé le temps de la session ; paiement différé (virement…) : jusqu'à son issue.
    if (parent.payment_status === 'pending' && parent.created_at < since) continue;
    reserved.set(row.product_id, (reserved.get(row.product_id) ?? 0) + row.quantity);
  }

  const problems: string[] = [];
  const lines: { product: NonNullable<typeof products>[number]; quantity: number; unitCents: number; image: string | null }[] = [];
  for (const [id, quantity] of requested) {
    const product = products?.find((p) => p.id === id);
    const price = Number(product?.price);
    if (!product || !product.published || !product.sell_online || !(price > 0)) { problems.push(`${product?.name ?? 'Une création'} n’est plus en vente en ligne.`); continue; }
    if (!['available', 'made_to_order'].includes(product.availability_status)) { problems.push(`« ${product.name} » n’est plus disponible.`); continue; }
    if (product.availability_status === 'available') {
      const stock = product.stock_quantity === null ? 1 : product.stock_quantity;
      const free = stock - (reserved.get(id) ?? 0);
      if (free <= 0) { problems.push(`« ${product.name} » est en cours de commande par un autre client. Réessayez dans une demi-heure.`); continue; }
      if (quantity > free) { problems.push(stock === 1 ? `« ${product.name} » est une pièce unique : une seule est disponible.` : `Il ne reste que ${free} « ${product.name} ».`); continue; }
    } else if (quantity > 10) { problems.push(`Pour plus de 10 « ${product.name} », contactez l’atelier.`); continue; }
    const images = [...(product.product_images ?? [])].sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.display_order - b.display_order);
    lines.push({ product, quantity, unitCents: Math.round(price * 100), image: images[0]?.public_url ?? null });
  }
  if (problems.length) return json({ error: problems.join(' '), code: 'unavailable' }, 409);

  const subtotalCents = lines.reduce((sum, line) => sum + line.unitCents * line.quantity, 0);
  const shippingCents = delivery === 'shipping' ? settings.shippingCents : 0;
  const totalCents = subtotalCents + shippingCents;

  // --- Commande en attente de paiement ---
  const { data: order, error: orderError } = await db.from('orders').insert({
    delivery_method: delivery,
    customer_first_name: customer.first_name,
    customer_last_name: customer.last_name,
    customer_email: customer.email,
    customer_phone: customer.phone || null,
    pickup_location: delivery === 'pickup' ? { name: settings.pickupName, address: settings.pickupAddress, instructions: settings.pickupInstructions } : null,
    subtotal_amount: subtotalCents / 100,
    shipping_amount: shippingCents / 100,
    total_amount: totalCents / 100,
    stripe_mode: stripeMode(),
    terms_accepted_at: new Date().toISOString(),
  }).select('id,public_token').single();
  if (orderError || !order) return json({ error: 'La commande n’a pas pu être préparée. Réessayez dans un instant.' }, 500);

  const { error: itemsError } = await db.from('order_items').insert(lines.map((line) => ({
    order_id: order.id,
    product_id: line.product.id,
    product_name: line.product.name.trim(),
    product_slug: line.product.slug,
    image_url: line.image,
    unit_price: line.unitCents / 100,
    quantity: line.quantity,
    line_total: (line.unitCents * line.quantity) / 100,
  })));
  if (itemsError) {
    await db.from('orders').delete().eq('id', order.id);
    return json({ error: 'La commande n’a pas pu être préparée. Réessayez dans un instant.' }, 500);
  }

  // --- Session Stripe Checkout ---
  const base = returnBase(req);
  const pickupText = [settings.pickupName, settings.pickupAddress.replace(/\n/g, ', ')].filter(Boolean).join(' — ');
  try {
    const session = await stripe<{ id: string; url: string }>('POST', 'checkout/sessions', {
      mode: 'payment',
      locale: 'fr',
      currency: 'eur',
      customer_email: customer.email,
      client_reference_id: order.id,
      metadata: { order_id: order.id, delivery },
      payment_intent_data: { metadata: { order_id: order.id }, description: `Commande atelier-isabelle.fr (${lines.length} article${lines.length > 1 ? 's' : ''})` },
      expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
      success_url: `${base}/commande/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/panier?retour=${order.public_token}`,
      line_items: lines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: 'eur',
          unit_amount: line.unitCents,
          product_data: { name: line.product.name.trim(), ...(line.image ? { images: [line.image] } : {}), metadata: { product_id: line.product.id } },
        },
      })),
      ...(delivery === 'shipping'
        ? {
            shipping_address_collection: { allowed_countries: ['FR'] },
            shipping_options: [{ shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: shippingCents, currency: 'eur' }, display_name: shippingCents ? 'Livraison à domicile — France métropolitaine' : 'Livraison à domicile offerte — France métropolitaine' } }],
          }
        : {}),
      custom_text: {
        submit: { message: `${delivery === 'pickup' ? `Retrait gratuit en boutique : ${pickupText}. Vous serez prévenu(e) par e-mail quand votre commande sera prête. ` : 'Livraison en France métropolitaine (Corse comprise). '}En payant, vous acceptez les conditions générales de vente de L'Atelier d'Isabelle.` },
      },
    });
    await db.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);
    return json({ url: session.url, token: order.public_token, total: totalCents / 100 });
  } catch (error) {
    await db.from('orders').update({ payment_status: 'failed', last_error: `Création du paiement : ${(error as Error).message}`.slice(0, 300) }).eq('id', order.id);
    return json({ error: 'Le paiement sécurisé n’a pas pu être ouvert. Réessayez dans un instant ou contactez l’atelier.', code: 'stripe_error' }, 502);
  }
});
