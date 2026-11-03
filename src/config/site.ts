import type { NavItem } from '@/types';

/**
 * Configuration centrale de l'entreprise.
 * Les coordonnées ci-dessous sont les informations officielles d'Isabelle.
 */
export const siteConfig = {
  name: "L'Atelier d'Isabelle",
  signature: 'Fait main au rythme des saisons',
  promise:
    'Pour décorer votre maison au fil des saisons – Créations artisanales personnalisables',
  phone: '06 19 17 23 73',
  email: 'Isabelle.andreoletti88@gmail.com',
  address: '',
  city: 'Saint-Dié-des-Vosges et Raon-l\'Étape',
  region: 'Vosges',
  hours: 'Rencontrez l\'atelier à La Boutik\'art (Saint-Dié-des-Vosges) et à La Boutique des Artisans (Raon-l\'Étape)',
  facebook: 'https://www.facebook.com/profile.php?id=100017154126901',
  instagram: '',
  logo: '/logo-atelier-isabelle.png',
  headerLogo: '/logo-atelier-isabelle-header.webp',
  defaultSeo: {
    title: "L'Atelier d'Isabelle — Décorations et cadeaux faits main dans les Vosges",
    description:
      "Décorations et cadeaux faits main dans les Vosges (Saint-Dié, Raon-l'Étape) : galets, papier, bois et fil de fer, personnalisables pour chaque moment de vie.",
  },
} as const;

export const mainNav: NavItem[] = [
  { label: 'Accueil', path: '/' },
  { label: 'La boutique', path: '/boutique' },
  { label: 'Créations personnalisées', path: '/personnalisation' },
  { label: "L'atelier", path: '/a-propos' },
  { label: 'Événements', path: '/evenements' },
  { label: 'Contact', path: '/contact' },
];

export const formConfig = {
  endpoint: '',
  provider: 'supabase' as 'supabase' | 'formspree' | 'netlify' | 'resend' | 'custom',
};
