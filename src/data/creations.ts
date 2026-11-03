import type { Creation } from '@/types';

/**
 * Catalogue des créations.
 *
 * Toutes les informations ci-dessous sont PROVISOIRES :
 * noms, prix, dimensions, disponibilités et délais sont à compléter
 * par Isabelle. Les prix indiqués ne sont pas définitifs.
 *
 * Pour ajouter une création : copier un bloc et adapter les champs.
 * Pour modifier un prix : changer la valeur de `price`.
 * Pour remplacer une image : déposer un fichier dans /public/images
 * (ou /public) et mettre à jour le chemin `mainImage` / `gallery`.
 */

export const creations: Creation[] = [
  {
    id: '1',
    slug: 'cest-un-garcon',
    name: 'C’est un garçon',
    shortDescription:
      "Une décoration en galets pour annoncer ou célébrer l'arrivée d'un petit garçon.",
    fullDescription:
      "Des galets soigneusement choisis et assemblés à la main pour former une scène tendre autour de la naissance d'un petit garçon. Chaque pierre est unique, comme chaque enfant. Un cadeau de naissance à offrir ou à s'offrir pour garder une trace douce de ce moment.",
    price: 32,
    priceFrom: false,
    category: 'naissance-enfance',
    seasons: ['printemps'],
    materials: ['galets', 'bois'],
    dimensions: 'Cadre 15 × 15 cm — À compléter',
    colors: ['Bleu doux', 'Beige', 'Blanc cassé'],
    customizable: true,
    availability: 'Disponible — À confirmer auprès d’Isabelle',
    mainImage: '/creation-garcon.webp',
    gallery: ['/creation-garcon.webp'],
    leadTime: '1 à 2 semaines — À compléter',
    careInstructions:
      'Épousseter délicatement à sec. Éviter l’humidité prolongée et la lumière directe du soleil.',
    featured: true,
    badges: ['personnalisable', 'nouveaute'],
  },
  {
    id: '2',
    slug: 'cest-une-fille',
    name: 'C’est une fille',
    shortDescription:
      "Une scène tendre en galets pour fêter la naissance d'une petite fille.",
    fullDescription:
      "Galets, couleurs douces et cadre en bois : une composition pensée pour accueillir une petite fille. Le prénom peut être ajouté à la main pour une création encore plus personnelle. Un cadeau de naissance qui se garde toute une vie.",
    price: 32,
    priceFrom: false,
    category: 'naissance-enfance',
    seasons: ['printemps'],
    materials: ['galets', 'bois'],
    dimensions: 'Cadre 15 × 15 cm — À compléter',
    colors: ['Rose poudré', 'Beige', 'Blanc cassé'],
    customizable: true,
    availability: 'Disponible — À confirmer auprès d’Isabelle',
    mainImage: '/creation-fille.webp',
    gallery: ['/creation-fille.webp'],
    leadTime: '1 à 2 semaines — À compléter',
    careInstructions:
      'Épousseter délicatement à sec. Éviter l’humidité prolongée et la lumière directe du soleil.',
    featured: true,
    badges: ['personnalisable', 'nouveaute'],
  },
  {
    id: '3',
    slug: 'une-meilleure-amie',
    name: 'Une meilleure amie',
    shortDescription:
      "Un tableau en galets et fil de fer pour dire à une amie qu'elle compte.",
    fullDescription:
      "Deux silhouettes en galets, quelques mots en fil de fer : une création qui célèbre l'amitié. Offrez-la pour un anniversaire, une retrouvaille, ou simplement pour dire merci. Le texte et les couleurs peuvent être adaptés.",
    price: 38,
    priceFrom: false,
    category: 'amitie',
    seasons: ['ete'],
    materials: ['galets', 'fil-de-fer', 'bois'],
    dimensions: 'Cadre 20 × 20 cm — À compléter',
    colors: ['Terracotta', 'Vert sauge', 'Beige'],
    customizable: true,
    availability: 'Sur commande — À confirmer',
    mainImage: '/creation-amitie.webp',
    gallery: ['/creation-amitie.webp'],
    leadTime: '1 à 2 semaines — À compléter',
    featured: true,
    badges: ['personnalisable', 'piece-unique'],
  },
  {
    id: '4',
    slug: 'soeurs-de-coeur',
    name: 'Sœurs de cœur',
    shortDescription:
      'Une création en galets pour célébrer le lien entre sœurs.',
    fullDescription:
      "Deux figures de galets se tiennent côte à côte, unies par un fil de fer qui dessine un cœur. Une pièce pensée pour les sœurs, de sang ou de choix. Personnalisable : prénoms, couleurs et dimensions.",
    price: 38,
    priceFrom: false,
    category: 'famille',
    seasons: ['automne'],
    materials: ['galets', 'fil-de-fer', 'bois'],
    dimensions: 'Cadre 20 × 20 cm — À compléter',
    colors: ['Bordeaux', 'Beige', 'Vert sauge'],
    customizable: true,
    availability: 'Sur commande — À confirmer',
    mainImage: '/creation-soeurs.webp',
    gallery: ['/creation-soeurs.webp'],
    leadTime: '1 à 2 semaines — À compléter',
    featured: true,
    badges: ['personnalisable', 'piece-unique'],
  },
  {
    id: '5',
    slug: 'tresor-damitie',
    name: 'Trésor d’amitié',
    shortDescription:
      'Une composition en papier et fil de fer pour les grandes amitiés.',
    fullDescription:
      "Des fleurs de papier délicatement découpées et montées sur des tiges de fil de fer. Une création légère et poétique, à offrir pour célébrer une amitié précieuse. Couleurs et message personnalisables.",
    price: 34,
    priceFrom: true,
    category: 'amitie',
    seasons: ['printemps', 'ete'],
    materials: ['papier', 'fil-de-fer'],
    dimensions: 'Composition 15 × 25 cm — À compléter',
    colors: ['Pastel', 'Blanc', 'Vert sauge'],
    customizable: true,
    availability: 'Sur commande — À confirmer',
    mainImage: '/creation-papier-fil.webp',
    gallery: ['/creation-papier-fil.webp'],
    leadTime: '2 semaines — À compléter',
    featured: true,
    badges: ['personnalisable', 'petite-serie'],
  },
  {
    id: '6',
    slug: 'la-famille-la-ou-la-vie-commence',
    name: 'La famille, là où la vie commence',
    shortDescription:
      'Un cadre familial personnalisé en galets et bois.',
    fullDescription:
      "Une composition familiale en galets, présentée dans un cadre en bois. Les prénoms, le nombre de membres et les couleurs peuvent être adaptés à votre famille. Un cadeau pour les retrouvailles, les anniversaires et les grandes occasions.",
    price: 45,
    priceFrom: true,
    category: 'famille',
    seasons: ['automne', 'hiver'],
    materials: ['galets', 'bois', 'fil-de-fer'],
    dimensions: 'Cadre 25 × 25 cm — À compléter',
    colors: ['Naturel', 'Bois clair', 'Terracotta'],
    customizable: true,
    availability: 'Sur commande — À confirmer',
    mainImage: '/creation-famille.webp',
    gallery: ['/creation-famille.webp'],
    leadTime: '2 à 3 semaines — À compléter',
    careInstructions:
      'Épousseter délicatement à sec. Éviter l’humidité prolongée.',
    featured: true,
    badges: ['personnalisable', 'nouveaute'],
  },
  {
    id: '7',
    slug: 'composition-automnale',
    name: 'Composition automnale',
    shortDescription:
      'Une décoration saisonnière en galets et feuilles d’automne.',
    fullDescription:
      "L'atelier suit les saisons. Cette composition aux teintes cuivrées évoque les feuilles tombées et les soirées douces. Une pièce unique, idéale pour réchauffer un intérieur à l'arrivée de l'automne.",
    price: 36,
    priceFrom: false,
    category: 'decorations-saisonnières',
    seasons: ['automne'],
    materials: ['galets', 'bois', 'papier'],
    dimensions: 'Cadre 20 × 20 cm — À compléter',
    colors: ['Orange', 'Marron', 'Beige'],
    customizable: false,
    availability: 'Pièce unique — À confirmer',
    mainImage: '/creation-automne.webp',
    gallery: ['/creation-automne.webp'],
    leadTime: '1 semaine — À compléter',
    featured: false,
    badges: ['piece-unique'],
  },
];

export function getCreationBySlug(slug: string): Creation | undefined {
  return creations.find((c) => c.slug === slug);
}

export function getFeaturedCreations(): Creation[] {
  return creations.filter((c) => c.featured);
}

export function getRelatedCreations(creation: Creation, limit = 3): Creation[] {
  return creations
    .filter((c) => c.id !== creation.id && c.category === creation.category)
    .slice(0, limit);
}
