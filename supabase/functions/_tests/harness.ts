// Banc d'essai local : exécute les fonctions du dépôt sur un seul port (54399), avec un faux Stripe.
// Le jeton « local-test-staff » est accepté comme session de l'administratrice (tests uniquement).
const ADMIN_ID = Deno.env.get('TEST_ADMIN_ID')!;
const realFetch = globalThis.fetch;
globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  if (url.endsWith('/auth/v1/user') && headers.get('Authorization') === 'Bearer local-test-staff') {
    return Promise.resolve(new Response(JSON.stringify({ id: ADMIN_ID, aud: 'authenticated', role: 'authenticated', email: 'admin@test', app_metadata: {}, user_metadata: {} }), { headers: { 'Content-Type': 'application/json' } }));
  }
  return realFetch(input, init);
};
const handlers: Record<string, (req: Request) => Response | Promise<Response>> = {};
let current = '';
const realServe = Deno.serve;
Object.defineProperty(Deno, 'serve', { value: (h: (req: Request) => Response) => { handlers[current] = h; return { finished: Promise.resolve(), shutdown() {} }; }, configurable: true, writable: true });
for (const name of ['checkout-create', 'checkout-status', 'stripe-webhook', 'order-update', 'stripe-sync']) { current = name; await import(`../${name}/index.ts`); }
realServe({ port: 54399, hostname: '127.0.0.1' }, (req) => {
  const name = new URL(req.url).pathname.split('/').pop() || '';
  const h = handlers[name];
  if (!h) return new Response('inconnu', { status: 404 });
  return h(req);
});
console.log('harness on 54399', Object.keys(handlers));
