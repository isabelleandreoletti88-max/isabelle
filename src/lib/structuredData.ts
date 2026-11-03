import { siteConfig } from '@/config/site';
import type { Creation } from '@/types';
import { SITE_URL, absoluteUrl } from '@/lib/seo';

/** Fiche de l'atelier (Schema.org), reprise par Google pour le panneau d'entreprise. */
export function storeJsonLd(image?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${SITE_URL}/#atelier`,
    name: siteConfig.name,
    slogan: siteConfig.signature,
    description: siteConfig.defaultSeo.description,
    url: SITE_URL,
    logo: absoluteUrl(siteConfig.logo),
    image: absoluteUrl(image || siteConfig.logo),
    telephone: '+33619172373',
    email: siteConfig.email.toLowerCase(),
    address: { '@type': 'PostalAddress', addressLocality: 'Saint-Dié-des-Vosges', addressRegion: 'Grand Est', addressCountry: 'FR' },
    areaServed: [{ '@type': 'AdministrativeArea', name: 'Vosges' }, { '@type': 'Country', name: 'France' }],
    sameAs: [siteConfig.facebook, siteConfig.instagram].filter(Boolean),
    makesOffer: { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Créations décoratives personnalisées faites main' } },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#site`,
    name: siteConfig.name,
    url: SITE_URL,
    inLanguage: 'fr-FR',
    publisher: { '@id': `${SITE_URL}/#atelier` },
    potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/boutique?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  };
}

/** Fil d'Ariane ; le dernier élément est la page courante. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Accueil', path: '/' }, ...items].map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

const availability: Record<string, string> = {
  available: 'https://schema.org/InStock',
  made_to_order: 'https://schema.org/MadeToOrder',
  sold: 'https://schema.org/SoldOut',
  unavailable: 'https://schema.org/OutOfStock',
};

export function productJsonLd(creation: Creation) {
  const url = `${SITE_URL}/creations/${creation.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#produit`,
    name: creation.name,
    description: creation.fullDescription || creation.shortDescription,
    image: creation.gallery.map(absoluteUrl),
    url,
    sku: creation.id,
    category: creation.categoryName || undefined,
    material: creation.materials.length ? creation.materials.join(', ') : undefined,
    brand: { '@type': 'Brand', name: siteConfig.name },
    manufacturer: { '@id': `${SITE_URL}/#atelier` },
    offers: creation.price !== null ? {
      '@type': 'Offer',
      url,
      price: creation.price.toFixed(2),
      priceCurrency: 'EUR',
      availability: availability[creation.availability] || 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${SITE_URL}/#atelier` },
    } : undefined,
  };
}

/** Liste des créations d'une page (boutique, collection), pour aider les moteurs à les découvrir. */
export function itemListJsonLd(name: string, creations: Creation[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: creations.length,
    itemListElement: creations.map((creation, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/creations/${creation.slug}`,
      name: creation.name,
    })),
  };
}
