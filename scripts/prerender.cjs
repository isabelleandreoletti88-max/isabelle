/**
 * Pré-génère les pages publiques après `vite build` (npm run build:seo).
 *
 * Le site est une application React : sans pré-génération, le HTML envoyé est vide et
 * Facebook, WhatsApp ou une partie des moteurs de recherche ne voient ni titre, ni
 * description, ni contenu. Ce script ouvre chaque page dans un navigateur, enregistre
 * le HTML obtenu (dist/boutique.html, dist/creations/<slug>.html…) et produit
 * sitemap.xml et robots.txt à partir du catalogue Supabase.
 *
 * Une création ajoutée depuis l'administration fonctionne immédiatement (le site la
 * charge en direct) ; elle aura sa page pré-générée et sa place dans le plan du site
 * à la prochaine compilation.
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const SITE_URL = 'https://atelier-isabelle.fr';
const DIST = path.join(__dirname, '..', 'dist');
const PORT = 4179;

const STATIC_ROUTES = [
  { path: '/', priority: '1.0' },
  { path: '/boutique', priority: '0.9' },
  { path: '/personnalisation', priority: '0.8' },
  { path: '/a-propos', priority: '0.7' },
  { path: '/evenements', priority: '0.6' },
  { path: '/contact', priority: '0.7' },
  { path: '/informations-legales', priority: '0.2' },
  { path: '/mentions-legales', priority: '0.2' },
  { path: '/politique-confidentialite', priority: '0.2' },
  { path: '/cookies', priority: '0.1' },
  { path: '/gestion-des-cookies', priority: '0.1' },
  { path: '/conditions-utilisation', priority: '0.1' },
  { path: '/mediation-consommation', priority: '0.1' },
  { path: '/informations-commerciales', priority: '0.1' },
];

function readEnv() {
  const env = { ...process.env };
  const file = path.join(__dirname, '..', '.env');
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (match && !env[match[1]]) env[match[1]] = match[2];
    }
  }
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) throw new Error('VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont nécessaires (fichier .env).');
  return env;
}

async function fetchCatalog(env) {
  const get = async (query) => {
    const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${query}`, { headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` } });
    if (!res.ok) throw new Error(`Supabase ${query}: ${res.status}`);
    return res.json();
  };
  const [products, categories, faqs, settings, shops] = await Promise.all([
    get('products?select=slug,name,short_description,price,availability_status,updated_at,categories(name),product_images(public_url,alt_text,is_main)&published=eq.true&order=name'),
    get('categories?select=slug,name,description,updated_at,products(id)&published=eq.true&products.published=eq.true&order=display_order'),
    get('faqs?select=question,answer&published=eq.true&order=display_order'),
    get('site_settings?select=setting_key,setting_value&is_public=eq.true'),
    get('events?select=title,location,description,is_permanent&published=eq.true&order=display_order'),
  ]);
  return { products, categories: categories.filter((c) => c.products.length), faqs, settings: Object.fromEntries(settings.map((r) => [r.setting_key, r.setting_value])), shops };
}

/** Petit serveur statique avec repli sur l'application (comme le .htaccess en production). */
function serve(shell) {
  const types = { '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
  return http.createServer((req, res) => {
    const file = path.join(DIST, decodeURIComponent(req.url.split('?')[0]));
    if (file.startsWith(DIST) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      return fs.createReadStream(file).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(shell);
  }).listen(PORT);
}

function outputFile(route) {
  return route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, `${route.slice(1)}.html`);
}

const xml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');

(async () => {
  const env = readEnv();
  const shell = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  // Coquille vide de l'application, servie pour les adresses sans page pré-générée.
  fs.writeFileSync(path.join(DIST, 'spa.html'), shell);

  const { products, categories, faqs, settings, shops } = await fetchCatalog(env);
  const routes = [
    ...STATIC_ROUTES,
    ...categories.map((c) => ({ path: `/collections/${c.slug}`, priority: '0.8', lastmod: c.updated_at })),
    ...products.map((p) => ({ path: `/creations/${p.slug}`, priority: '0.7', lastmod: p.updated_at, image: p.product_images.find((i) => i.is_main) || p.product_images[0] })),
  ];

  const server = serve(shell);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const rendered = [];
  for (const route of routes) {
    await page.goto(`http://localhost:${PORT}${route.path}`, { waitUntil: 'networkidle' });
    // Attend la fin des chargements (créations, événements…) avant d'enregistrer la page.
    await page.waitForFunction(() => !/Chargement/.test(document.body.innerText) && document.querySelector('h1'), null, { timeout: 15000 });
    const html = await page.evaluate(() => {
      document.querySelectorAll('[data-prerender-skip]').forEach((el) => el.remove());
      return `<!doctype html>\n${document.documentElement.outerHTML}`;
    });
    const title = await page.title();
    if (route.path !== '/' && /introuvable/i.test(title)) throw new Error(`${route.path} : page introuvable lors de la pré-génération`);
    rendered.push([route.path, html]);
    process.stdout.write('.');
  }
  await browser.close();
  server.close();

  for (const [route, html] of rendered) {
    const file = outputFile(route);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
  }

  const today = new Date().toISOString().slice(0, 10);
  const urls = routes.map((r) => [
    '  <url>',
    `    <loc>${xml(SITE_URL + (r.path === '/' ? '/' : r.path))}</loc>`,
    `    <lastmod>${(r.lastmod || today).slice(0, 10)}</lastmod>`,
    `    <priority>${r.priority}</priority>`,
    r.image ? `    <image:image><image:loc>${xml(r.image.public_url)}</image:loc></image:image>` : null,
    '  </url>',
  ].filter(Boolean).join('\n'));
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`);
  // Les robots des moteurs IA (ChatGPT, Claude, Perplexity, Gemini…) sont explicitement les bienvenus.
  const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot'];
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /merci\n\n${aiBots.map((bot) => `User-agent: ${bot}\nAllow: /\nDisallow: /admin\n`).join('\n')}\nSitemap: ${SITE_URL}/sitemap.xml\n`);

  // llms.txt : résumé factuel du site pour les assistants IA (format https://llmstxt.org).
  const euro = (n) => `${Number(n).toFixed(2).replace('.', ',').replace(',00', '')} €`;
  const permanent = shops.filter((s) => s.is_permanent);
  const llms = [
    `# ${settings.brand_name || "L'Atelier d'Isabelle"}`,
    '',
    `> Créatrice artisanale installée dans les Vosges (Grand Est, France). Isabelle imagine et fabrique à la main des décorations et des cadeaux personnalisables en galets, papier, bois et fil de fer : cadres avec une phrase, créations de naissance, famille, amitié, amour, remerciements et décorations de saison.`,
    '',
    '## L’essentiel',
    `- Lieu : Vosges (${settings.city || "Saint-Dié-des-Vosges et Raon-l'Étape"}).`,
    ...permanent.map((s) => `- Créations visibles toute l’année à ${s.title}, ${s.location}.`),
    '- Créations faites main, pièces uniques ou petites séries, personnalisables (prénom, date, message, couleurs).',
    settings.email ? `- Contact : ${String(settings.email).toLowerCase()}${settings.phone ? `, ${settings.phone}` : ''} ; formulaire : ${SITE_URL}/contact` : `- Contact : ${SITE_URL}/contact`,
    `- Demande de création personnalisée : ${SITE_URL}/personnalisation`,
    `- Marchés et boutiques : ${SITE_URL}/evenements`,
    '',
    '## Collections',
    ...categories.map((c) => `- [${c.name.trim()}](${SITE_URL}/collections/${c.slug}) : ${c.description}`),
    '',
    '## Créations',
    ...products.map((p) => `- [${p.name.trim()}](${SITE_URL}/creations/${p.slug})${p.categories?.name ? ` (${p.categories.name.trim()})` : ''}${p.price ? ` — ${euro(p.price)}` : ' — prix sur demande'}${p.availability_status === 'sold' ? ' — vendue' : ''} : ${String(p.short_description || '').replace(/\s+/g, ' ').trim()}`),
    '',
    '## Questions fréquentes',
    ...faqs.flatMap((f) => [`### ${f.question}`, f.answer, '']),
  ].join('\n');
  fs.writeFileSync(path.join(DIST, 'llms.txt'), `${llms}\n`);

  console.log(`\n${rendered.length} pages pré-générées, sitemap.xml (${routes.length} adresses) et robots.txt écrits.`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
