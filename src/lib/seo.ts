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
 * Miniature 640 px d'une photo enregistrée dans Supabase. Chaque photo WebP importée par
 * l'administration est stockée avec sa miniature à côté (`nom.webp` et `nom-640.webp`).
 */
export function thumbUrl(url: string) {
  return /\/storage\/v1\/object\/public\/(product-images|site-images)\//.test(url) && url.endsWith('.webp') && !url.endsWith('-640.webp') ? url.replace(/\.webp$/, '-640.webp') : url;
}

/** Repli sur l'image d'origine si sa miniature n'existe pas (anciennes photos). */
export function fallbackToFull(full: string) {
  return (event: { currentTarget: HTMLImageElement }) => { if (event.currentTarget.src !== full) event.currentTarget.src = full; };
}

/** Texte alternatif descriptif d'une photo de création. */
export function productImageAlt(name: string, material?: string) {
  const mat = (material || '').toLowerCase();
  const label = mat === 'galet' ? 'galets' : mat;
  return `${name.trim()} — décoration artisanale ${label ? `en ${label} ` : ''}faite main par L’Atelier d’Isabelle`;
}

/** Prix en euros à la française, toujours avec deux décimales : « 12,00 € », « 15,90 € ». */
export function formatPrice(value: number) {
  return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Coupe une description à la longueur conseillée pour les moteurs de recherche, sans couper un mot. */
export function metaDescription(text: string, max = 158) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

/**
 * Attributs d'image adaptés à la taille d'écran : miniature 640 px pour les téléphones et les
 * petits emplacements, photo complète sinon. Sans miniature connue, l'image d'origine seule.
 */
export function responsiveImage(url: string, sizes: string) {
  const thumb = thumbUrl(url);
  return thumb === url ? { src: url } : { src: url, srcSet: `${thumb.replace(/-640\.webp$/, '-320.webp')} 320w, ${thumb} 640w, ${url} 1600w`, sizes };
}
