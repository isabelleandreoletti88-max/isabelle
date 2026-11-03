/** Adresse publique du site, utilisée pour les URL canoniques et les données structurées. */
export const SITE_URL = 'https://atelier-isabelle.fr';

/** Transforme un texte en identifiant d'URL : minuscules, sans accents, mots séparés par des tirets. */
export function slugify(value: string) {
  return value
    .replace(/[œŒ]/g, 'oe')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

/**
 * Miniature 640 px d'une photo de création. Chaque photo WebP du catalogue est
 * stockée avec sa miniature à côté (`nom.webp` et `nom-640.webp`).
 */
export function thumbUrl(url: string) {
  return url.includes('/product-images/') && url.endsWith('.webp') && !url.endsWith('-640.webp') ? url.replace(/\.webp$/, '-640.webp') : url;
}

/** Texte alternatif descriptif d'une photo de création. */
export function productImageAlt(name: string, material?: string) {
  const mat = (material || '').toLowerCase();
  const label = mat === 'galet' ? 'galets' : mat;
  return `${name.trim()} — décoration artisanale ${label ? `en ${label} ` : ''}faite main par L’Atelier d’Isabelle`;
}

/** Coupe une description à la longueur conseillée pour les moteurs de recherche, sans couper un mot. */
export function metaDescription(text: string, max = 158) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}
