// Faux serveur Stripe local (tests uniquement) : sessions Checkout, expiration, page de paiement simulée.
const http = require('node:http');
const { URLSearchParams } = require('node:url');
const sessions = new Map(); const calls = [];
function nest(params) { // a[b][0][c]=v -> objet
  const out = {};
  for (const [key, value] of params) {
    const path = key.replace(/\]/g, '').split('['); let cur = out;
    path.forEach((p, i) => { if (i === path.length - 1) cur[p] = value; else cur = cur[p] ??= {}; });
  }
  return out;
}
const toList = (o) => o ? Object.keys(o).sort((a, b) => a - b).map((k) => o[k]) : [];
http.createServer((req, res) => {
  let body = ''; req.on('data', (c) => body += c); req.on('end', () => {
    const url = new URL(req.url, 'http://x'); const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
    calls.push({ method: req.method, path: url.pathname, auth: req.headers.authorization?.slice(0, 15), body: body ? nest(new URLSearchParams(body)) : null });
    if (url.pathname === '/__calls') return send(200, calls);
    if (url.pathname === '/__session') return send(200, sessions.get(url.searchParams.get('id')) || null);
    if (url.pathname === '/__set' && req.method === 'POST') { const p = JSON.parse(body); Object.assign(sessions.get(p.id), p.patch); return send(200, sessions.get(p.id)); }
    let m;
    if (req.method === 'POST' && url.pathname === '/v1/checkout/sessions') {
      const p = nest(new URLSearchParams(body));
      const items = toList(p.line_items);
      const subtotal = items.reduce((s, it) => s + Number(it.price_data.unit_amount) * Number(it.quantity), 0);
      const ship = p.shipping_options ? Number(toList(p.shipping_options)[0].shipping_rate_data.fixed_amount.amount) : 0;
      const id = 'cs_test_mock' + Math.random().toString(36).slice(2, 14) + Date.now().toString(36);
      const s = { id, object: 'checkout.session', status: 'open', payment_status: 'unpaid', payment_intent: null, amount_total: subtotal + ship, currency: 'eur', metadata: p.metadata, client_reference_id: p.client_reference_id, customer_details: { email: p.customer_email, name: null, phone: null }, shipping_details: null, shipping_cost: { amount_total: ship }, _params: p, url: `http://127.0.0.1:12111/pay/${id}` };
      sessions.set(id, s); return send(200, s);
    }
    if ((m = url.pathname.match(/^\/v1\/checkout\/sessions\/([^/]+)\/expire$/)) && req.method === 'POST') {
      const s = sessions.get(m[1]); if (!s) return send(404, { error: { message: 'No such session' } });
      if (s.status !== 'open') return send(400, { error: { message: `Only Checkout Sessions with a status in [\"open\"] can be expired. This Checkout Session has a status of \"${s.status}\".` } });
      s.status = 'expired'; return send(200, s);
    }
    if ((m = url.pathname.match(/^\/v1\/checkout\/sessions\/([^/]+)$/)) && req.method === 'GET') { const s = sessions.get(m[1]); return s ? send(200, s) : send(404, { error: { message: 'No such session' } }); }
    if ((m = url.pathname.match(/^\/pay\/([^/]+)$/))) { // page de paiement simulée : paie (ou annule avec ?cancel=1) puis redirige
      const s = sessions.get(m[1]); const p = s._params;
      if (url.searchParams.get('cancel')) { res.writeHead(302, { Location: p.cancel_url }); return res.end(); }
      Object.assign(s, { status: 'complete', payment_status: 'paid', payment_intent: 'pi_test_mock' + m[1].slice(-8), customer_details: { email: p.customer_email, name: 'Client Test', phone: '+33600000000' }, shipping_details: p.shipping_address_collection ? { name: 'Client Test', address: { line1: '1 rue des Tests', line2: null, postal_code: '88100', city: 'Saint-Dié-des-Vosges', country: 'FR', state: null } } : null });
      res.writeHead(302, { Location: p.success_url.replace('{CHECKOUT_SESSION_ID}', s.id) }); return res.end();
    }
    if (url.pathname === '/v1/account') return send(200, { settings: { dashboard: { display_name: 'Compte de test (faux)' } }, charges_enabled: true });
    send(404, { error: { message: `mock: ${req.method} ${url.pathname} non géré` } });
  });
}).listen(12111, '127.0.0.1', () => console.log('mock stripe on 12111'));
