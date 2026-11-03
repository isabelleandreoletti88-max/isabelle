import { siteConfig } from '@/config/site';
import type { Creation } from '@/types';
import { SITE_URL, absoluteUrl } from '@/lib/seo';

/** Villes vosgiennes où l'atelier est présent (boutiques partenaires) et alentours. */
const AREA_SERVED = ['Saint-Dié-des-Vosges', "Raon-l'Étape", 'Épinal', 'Gérardmer', 'Rambervillers', 'Baccarat', 'Remiremont', 'Lunéville'];

/** Fiche de l'atelier (Schema.org), reprise par Google pour le panneau d'entreprise et par les moteurs IA. */
export function storeJsonLd(image?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': ['Store', 'LocalBusiness'],
    '@id': `${SITE_URL}/#atelier`,
    name: siteConfig.name,
    alternateName: "Atelier d'Isabelle",
    slogan: siteConfig.signature,
    description: "Créatrice artisanale installée dans les Vosges : décorations et cadeaux faits main en galets, papier, bois et fil de fer, personnalisables (naissance, famille, amitié, amour, remerciements, décorations de saison).",
    url: SITE_URL,
    logo: absoluteUrl(siteConfig.logo),
    image: absoluteUrl(image || siteConfig.logo),
    telephone: '+33619172373',
    email: siteConfig.email.toLowerCase(),
    priceRange: '€',
    currenciesAccepted: 'EUR',
    address: { '@type': 'PostalAddress', addressLocality: 'Saint-Dié-des-Vosges', postalCode: '88100', addressRegion: 'Vosges, Grand Est', addressCountry: 'FR' },
    geo: { '@type': 'GeoCoordinates', latitude: 48.2847, longitude: 6.9493 },
    areaServed: [{ '@type': 'AdministrativeArea', name: 'Vosges' }, ...AREA_SERVED.map((name) => ({ '@type': 'City', name })), { '@type': 'Country', name: 'France' }],
    knowsAbout: ['décoration faite main', 'cadeau personnalisé', 'galets peints', 'création en papier', 'fil de fer', 'artisanat vosgien'],
    sameAs: [siteConfig.facebook, siteConfig.instagram].filter(Boolean),
    makesOffer: { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Créations décoratives personnalisées faites main dans les Vosges' } },
  };
}

/** Questions fréquentes : affichées sur l'accueil, reprises par Google et les assistants IA. */
export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })),
  };
}

/** Marchés et salons datés (page Événements). */
export function eventJsonLd(event: { title: string; location: string; description: string; image: string | null; start_date: string | null; end_date: string | null; link_url?: string | null }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${event.title} — ${siteConfig.name}`,
    description: event.description || `${siteConfig.name} expose ses créations faites main.`,
    startDate: event.start_date,
    endDate: event.end_date || event.start_date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: event.location, address: { '@type': 'PostalAddress', addressLocality: event.location, addressRegion: 'Vosges', addressCountry: 'FR' } },
    image: event.image ? [absoluteUrl(event.image)] : undefined,
    url: event.link_url || `${SITE_URL}/evenements`,
    organizer: { '@id': `${SITE_URL}/#atelier`, name: siteConfig.name, url: SITE_URL },
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
