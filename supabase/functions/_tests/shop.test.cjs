// Scénarios de test de la boutique (banc local + faux Stripe + vraie base). Affiche OK / ÉCHEC.
const crypto = require('node:crypto');
const fs = require('node:fs');
const env = Object.fromEntries(fs.readFileSync(__dirname + '/.env.local', 'utf8').trim().split('\n').map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const SB = 'https://clkkasnnbiktrrncabjc.supabase.co';
const H = 'http://127.0.0.1:54399/functions/v1';
const MOCK = 'http://127.0.0.1:12111';
const P_UNIQUE = '4bc65892-01d7-4252-a2cf-b60635186727';
const P_UNIQUE2 = 'c4be342d-d6d1-43b1-ba7d-55f120f481b1';
const P_MTO = '92b124a6-c14c-4844-940d-9bce6262f2a6';
const created = [];
let pass = 0, fail = 0;
const check = (label, cond, detail = '') => { if (cond) { pass++; console.log(`  OK     ${label}`); } else { fail++; console.log(`  ÉCHEC  ${label} ${detail}`); } };

async function fn(name, body, token) {
  const res = await fetch(`${H}/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json };
}
async function rest(path) {
  const res = await fetch(`${SB}/rest/v1/${path}`, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } });
  return res.json();
}
async function patch(path, body) {
  await fetch(`${SB}/rest/v1/${path}`, { method: 'PATCH', headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
const order = async (id) => (await rest(`orders?id=eq.${id}&select=*,order_items(*)`))[0];
const orderByToken = async (t) => (await rest(`orders?public_token=eq.${t}&select=*,order_items(*)`))[0];
const product = async (id) => (await rest(`products?id=eq.${id}&select=availability_status,stock_quantity,price`))[0];
const session = async (id) => (await fetch(`${MOCK}/__session?id=${id}`)).json();
const setSession = (id, p) => fetch(`${MOCK}/__set`, { method: 'POST', body: JSON.stringify({ id, patch: p }) });
const customer = { first_name: 'Test', last_name: 'Boutique', email: 'contact@atelier-isabelle.fr', phone: '06 00 00 00 00' };
const STAFF = 'local-test-staff';

async function webhook(event, { secret = env.WEBHOOK_SECRET, target = `${H}/stripe-webhook` } = {}) {
  const payload = JSON.stringify(event); const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  const res = await fetch(target, { method: 'POST', headers: { 'Stripe-Signature': `t=${t},v1=${sig}`, 'Content-Type': 'application/json' }, body: payload });
  return { status: res.status, text: await res.text() };
}
const sessionEvent = (type, s, extra = {}) => ({ id: 'evt_test_' + crypto.randomBytes(8).toString('hex'), object: 'event', type, livemode: false, data: { object: { ...s, ...extra } } });
async function checkout(body, token = STAFF) {
  const r = await fn('checkout-create', { customer, accept_terms: true, ...body }, token);
  if (r.json?.token) { const o = await orderByToken(r.json.token); if (o) created.push(o.id); }
  return r;
}
async function pay(sessionId) { // passage simulé sur la page de paiement : la session devient payée chez « Stripe »
  await fetch(`${MOCK}/pay/${sessionId}`, { redirect: 'manual' });
  return session(sessionId);
}

(async () => {
  const fee0 = (await rest('site_settings?setting_key=eq.shop_shipping_fee&select=setting_value'))[0].setting_value;
  const p1 = await product(P_UNIQUE), p2 = await product(P_MTO), p3 = await product(P_UNIQUE2);
  const [price1, price2, price3] = [Number(p1.price), Number(p2.price), Number(p3.price)];
  try {
    console.log('\n0. Sécurité d’accès');
    let r = await fn('checkout-create', { items: [{ product_id: P_MTO, quantity: 1 }], delivery: 'shipping', customer, accept_terms: true });
    check('boutique fermée : refus pour un visiteur', r.status === 403 && r.json.code === 'shop_closed', JSON.stringify(r.json));
    r = await fn('order-update', { action: 'update', order_id: '00000000-0000-0000-0000-000000000000' });
    check('administration des commandes : refus sans session', r.status === 403);
    r = await webhook(sessionEvent('checkout.session.completed', { id: 'cs_test_fake', payment_status: 'paid' }), { secret: 'whsec_mauvais' });
    check('webhook à fausse signature refusé', r.status === 400, r.text);
    r = await checkout({ items: [{ product_id: P_MTO, quantity: 1 }], delivery: 'shipping', accept_terms: false });
    check('CGV non acceptées : refus', r.status === 400);
    r = await checkout({ items: [{ product_id: P_MTO, quantity: 1, price: 0.01 }], delivery: 'shipping', customer: { ...customer, email: 'pas-un-email' } });
    check('e-mail invalide : refus', r.status === 400);

    console.log('\n1+3. Livraison à domicile, plusieurs articles (prix recalculés côté serveur)');
    r = await checkout({ items: [{ product_id: P_UNIQUE, quantity: 1, price: 0.01 }, { product_id: P_MTO, quantity: 2 }], delivery: 'shipping' });
    check('session créée', r.status === 200 && r.json.url?.startsWith(MOCK), JSON.stringify(r.json));
    const shipOrder = await orderByToken(r.json.token);
    const expected = Math.round((price1 + 2 * price2 + Number(fee0)) * 100) / 100;
    check(`total = ${price1} + 2×${price2} + ${fee0} = ${expected}`, Number(shipOrder.total_amount) === expected, shipOrder.total_amount);
    check('prix envoyé par le navigateur ignoré', Number(shipOrder.order_items.find((i) => i.product_id === P_UNIQUE).unit_price) === price1);
    let s = await session(shipOrder.stripe_session_id);
    check('Stripe : collecte d’adresse en France', s._params.shipping_address_collection?.allowed_countries?.['0'] === 'FR');
    check(`Stripe : frais de port ${fee0} € (une seule fois)`, s._params.shipping_options?.['0']?.shipping_rate_data?.fixed_amount?.amount === String(Math.round(fee0 * 100)));
    check('Stripe : total de la session = total de la commande', s.amount_total === Math.round(expected * 100), `${s.amount_total}`);
    check('Stripe : pas de TVA ajoutée (aucun taux appliqué)', !s._params.automatic_tax && !JSON.stringify(s._params).includes('tax_rates'));
    check('commande en attente, sans numéro', shipOrder.payment_status === 'pending' && !shipOrder.order_number);

    console.log('\n   Pièce unique réservée pendant le paiement');
    r = await checkout({ items: [{ product_id: P_UNIQUE, quantity: 1 }], delivery: 'shipping', customer: { ...customer, email: 'autre@test.fr' } });
    check('second client refusé pendant le paiement du premier', r.status === 409, JSON.stringify(r.json));
    r = await checkout({ items: [{ product_id: P_UNIQUE2, quantity: 2 }], delivery: 'shipping' });
    check('pièce unique en 2 exemplaires refusée', r.status === 409);

    console.log('\n7. Retour avant confirmation (page de confirmation sans paiement)');
    r = await fn('checkout-status', { session_id: shipOrder.stripe_session_id });
    check('statut « pending » : la page ne déclare rien payé', r.json.payment_status === 'pending');
    r = await fn('checkout-status', { session_id: 'cs_test_inventee1234567890' });
    check('session inventée : introuvable', r.status === 404);

    console.log('\n5. Paiement accepté (webhook signé)');
    s = await pay(shipOrder.stripe_session_id);
    const paidEvent = sessionEvent('checkout.session.completed', s);
    r = await webhook(paidEvent);
    check('webhook accepté', r.status === 200, r.text);
    let o = await order(shipOrder.id);
    check('commande payée', o.payment_status === 'paid' && Number(o.amount_paid) === expected, `${o.payment_status} ${o.amount_paid}`);
    check(`numéro attribué : ${o.order_number}`, /^CMD-\d{4}-\d{4}$/.test(o.order_number || ''));
    check('adresse de livraison enregistrée', o.shipping_address?.postal_code === '88100' && o.shipping_name === 'Client Test');
    check('identifiants Stripe conservés', o.stripe_session_id === s.id && o.stripe_payment_intent_id === s.payment_intent);
    check('statut de préparation « À préparer »', o.fulfillment_status === 'to_prepare');
    check('pièce unique passée « Vendue »', (await product(P_UNIQUE)).availability_status === 'sold');
    check('e-mails tentés (local sans SMTP : erreur notée, commande quand même payée)', (o.confirmation_email_sent_at || /SMTP/.test(o.last_error || '')));

    console.log('\n8. Webhook reçu plusieurs fois');
    const before = await order(shipOrder.id);
    r = await webhook(paidEvent);
    check('même événement : ignoré', r.status === 200 && /déjà/.test(r.text), r.text);
    r = await webhook(sessionEvent('checkout.session.completed', s));
    check('autre événement pour la même session : sans effet', r.status === 200);
    r = await webhook(sessionEvent('checkout.session.async_payment_succeeded', s));
    o = await order(shipOrder.id);
    check('numéro et montant inchangés, pas de doublon', o.order_number === before.order_number && o.amount_paid === before.amount_paid && o.alerts.length === before.alerts.length);
    check('une seule commande pour cette session', (await rest(`orders?stripe_session_id=eq.${s.id}&select=id`)).length === 1);
    r = await fn('checkout-status', { session_id: s.id });
    check('page de confirmation : payée, avec le récapitulatif', r.json.payment_status === 'paid' && r.json.items.length === 2 && r.json.order_number === o.order_number);
    check('page de confirmation : ni adresse complète ni téléphone', !JSON.stringify(r.json).includes('rue des Tests') && !JSON.stringify(r.json).includes('0600'));

    console.log('\n2. Retrait gratuit en boutique');
    r = await checkout({ items: [{ product_id: P_MTO, quantity: 1 }], delivery: 'pickup', customer: { ...customer, phone: '' } });
    check('téléphone exigé pour le retrait', r.status === 400);
    r = await checkout({ items: [{ product_id: P_MTO, quantity: 1 }], delivery: 'pickup' });
    const pickOrder = await orderByToken(r.json.token);
    s = await session(pickOrder.stripe_session_id);
    check(`total = ${price2} (0 € de port)`, Number(pickOrder.total_amount) === price2 && Number(pickOrder.shipping_amount) === 0);
    check('Stripe : aucune adresse ni frais de port demandés', !s._params.shipping_address_collection && !s._params.shipping_options);
    check('lieu de retrait enregistré dans la commande', pickOrder.pickup_location?.name === 'La Boutik\'art (TEST)');
    s = await pay(s.id);
    r = await fn('checkout-status', { session_id: s.id }); // vérification directe auprès de Stripe, sans webhook
    o = await order(pickOrder.id);
    check('confirmé par vérification directe auprès de Stripe (webhook en retard)', r.json.payment_status === 'paid' && o.payment_status === 'paid', JSON.stringify(r.json).slice(0, 120));
    check('pas d’adresse de livraison', o.shipping_address === null);

    console.log('\n6. Paiement refusé, annulé, abandonné');
    await patch(`products?id=eq.${P_UNIQUE}`, { availability_status: 'available' });
    r = await checkout({ items: [{ product_id: P_UNIQUE2, quantity: 1 }], delivery: 'shipping' });
    let t = r.json.token; let ord = await orderByToken(t);
    r = await fn('checkout-status', { action: 'cancel', token: t });
    check('retour « annuler » depuis Stripe : commande close', r.json.cancelled === true && (await order(ord.id)).payment_status === 'cancelled');
    check('session Stripe expirée', (await session(ord.stripe_session_id)).status === 'expired');
    r = await checkout({ items: [{ product_id: P_UNIQUE2, quantity: 1 }], delivery: 'shipping' });
    check('la pièce est de nouveau disponible pour un autre achat', r.status === 200);
    ord = await orderByToken(r.json.token); s = await session(ord.stripe_session_id);
    r = await webhook(sessionEvent('checkout.session.expired', s, { status: 'expired' }));
    check('session expirée (abandon) : « Abandonnée »', (await order(ord.id)).payment_status === 'expired');
    r = await checkout({ items: [{ product_id: P_UNIQUE2, quantity: 1 }], delivery: 'shipping' });
    ord = await orderByToken(r.json.token); s = await session(ord.stripe_session_id);
    await webhook(sessionEvent('checkout.session.completed', s, { status: 'complete', payment_status: 'unpaid', payment_intent: 'pi_test_async1' }));
    check('paiement différé lancé : « en cours de validation », pas payée', (await order(ord.id)).payment_status === 'processing');
    r = await checkout({ items: [{ product_id: P_UNIQUE2, quantity: 1 }], delivery: 'shipping', customer: { ...customer, email: 'autre@test.fr' } });
    check('pièce réservée tant que le paiement différé est en cours', r.status === 409);
    await webhook(sessionEvent('checkout.session.async_payment_failed', s, { status: 'complete', payment_status: 'unpaid' }));
    o = await order(ord.id);
    check('paiement différé refusé : « Paiement refusé », pas de numéro', o.payment_status === 'failed' && !o.order_number);
    check('pièce non vendue après un refus', (await product(P_UNIQUE2)).availability_status === 'available');
    r = await checkout({ items: [{ product_id: P_UNIQUE2, quantity: 1 }], delivery: 'shipping' });
    ord = await orderByToken(r.json.token);
    r = await checkout({ items: [{ product_id: P_UNIQUE2, quantity: 1 }], delivery: 'pickup', previous_token: ord.public_token });
    check('client qui revient modifier son panier : l’ancien paiement est libéré', r.status === 200 && (await order(ord.id)).payment_status === 'cancelled', JSON.stringify(r.json));

    console.log('\n4. Modification des frais de livraison');
    await patch('site_settings?setting_key=eq.shop_shipping_fee', { setting_value: '7.50' });
    r = await checkout({ items: [{ product_id: P_MTO, quantity: 3 }], delivery: 'shipping' });
    o = await orderByToken(r.json.token); s = await session(o.stripe_session_id);
    check('nouveaux frais 7,50 € appliqués une fois pour 3 articles', Number(o.shipping_amount) === 7.5 && Number(o.total_amount) === Math.round((3 * price2 + 7.5) * 100) / 100 && s._params.shipping_options['0'].shipping_rate_data.fixed_amount.amount === '750');
    await patch('site_settings?setting_key=eq.shop_shipping_fee', { setting_value: fee0 });
    await patch('site_settings?setting_key=eq.shop_home_delivery_enabled', { setting_value: 'false' });
    r = await checkout({ items: [{ product_id: P_MTO, quantity: 1 }], delivery: 'shipping' });
    check('livraison désactivée : refusée', r.status === 400);
    await patch('site_settings?setting_key=eq.shop_home_delivery_enabled', { setting_value: 'true' });

    console.log('\n10. Contrôle des montants');
    r = await checkout({ items: [{ product_id: P_MTO, quantity: 1 }], delivery: 'pickup' });
    o = await orderByToken(r.json.token); s = await pay(o.stripe_session_id);
    await webhook(sessionEvent('checkout.session.completed', s, { amount_total: 1 }));
    o = await order(o.id);
    check('montant payé anormal : commande signalée « À vérifier »', o.alerts.some((a) => /différent/.test(a)), JSON.stringify(o.alerts));

    console.log('\n9. Traitement dans l’administration');
    r = await fn('order-update', { action: 'update', order_id: shipOrder.id, fulfillment_status: 'ready_for_pickup' }, STAFF);
    check('« Prête pour retrait » refusée pour une livraison', r.status === 400);
    r = await fn('order-update', { action: 'update', order_id: shipOrder.id, fulfillment_status: 'shipped', carrier: 'Colissimo', tracking_number: '6A12345678901' }, STAFF);
    o = r.json.order;
    check('expédiée avec transporteur et suivi', r.status === 200 && o.fulfillment_status === 'shipped' && o.carrier === 'Colissimo' && o.tracking_number === '6A12345678901' && o.shipped_at, JSON.stringify(r.json).slice(0, 200));
    check('e-mail d’expédition tenté', r.json.email_sent === 'shipped' || /SMTP/.test(r.json.email_error || ''));
    r = await fn('order-update', { action: 'update', order_id: pickOrder.id, fulfillment_status: 'ready_for_pickup' }, STAFF);
    check('retrait : « Prête pour retrait »', r.json.order?.fulfillment_status === 'ready_for_pickup' && r.json.order.ready_at);
    r = await fn('order-update', { action: 'update', order_id: pickOrder.id, fulfillment_status: 'completed', admin_notes: 'Remis en main propre' }, STAFF);
    check('retrait : « Terminée » avec note interne', r.json.order?.fulfillment_status === 'completed' && r.json.order.admin_notes === 'Remis en main propre');
    r = await fn('order-update', { action: 'update', order_id: ord.id, fulfillment_status: 'shipped' }, STAFF);
    check('commande non payée : préparation refusée', r.status === 400);
    r = await webhook({ id: 'evt_test_' + crypto.randomBytes(8).toString('hex'), type: 'charge.refunded', livemode: false, data: { object: { id: 'ch_test', payment_intent: (await order(pickOrder.id)).stripe_payment_intent_id, amount: 1990, amount_refunded: 1990, refunded: true } } });
    check('remboursement fait dans Stripe : commande « Remboursée »', (await order(pickOrder.id)).payment_status === 'refunded');
    r = await webhook(sessionEvent('checkout.session.completed', s), { secret: env.WEBHOOK_SECRET, target: `${H}/stripe-webhook` });
    check('événement d’un autre mode ignoré', (await webhook({ ...sessionEvent('checkout.session.completed', s), livemode: true })).text.includes('mode'));
  } catch (error) {
    fail++; console.log('ERREUR', error);
  } finally {
    fs.writeFileSync(__dirname + '/created-orders.json', JSON.stringify(created));
    await patch('site_settings?setting_key=eq.shop_shipping_fee', { setting_value: fee0 });
    await patch('site_settings?setting_key=eq.shop_home_delivery_enabled', { setting_value: 'true' });
    await patch(`products?id=eq.${P_UNIQUE}`, { availability_status: p1.availability_status, stock_quantity: p1.stock_quantity });
    await patch(`products?id=eq.${P_UNIQUE2}`, { availability_status: p3.availability_status, stock_quantity: p3.stock_quantity });
    await patch(`products?id=eq.${P_MTO}`, { availability_status: p2.availability_status, stock_quantity: p2.stock_quantity });
    console.log(`\n${pass} OK, ${fail} ÉCHEC — ${created.length} commandes de test créées`);
  }
})();
