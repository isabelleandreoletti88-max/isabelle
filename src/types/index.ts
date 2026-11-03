export type Season = 'printemps' | 'ete' | 'automne' | 'hiver';

export type CategorySlug =
  | 'naissance-enfance'
  | 'famille'
  | 'amitie'
  | 'amour-mariage'
  | 'decorations-saisonnières'
  | 'cadeaux-personnalises';

export type Material = 'galets' | 'papier' | 'bois' | 'fil-de-fer';

export type Badge = 'personnalisable' | 'piece-unique' | 'nouveaute' | 'petite-serie';

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  emoji: string;
}

export interface Creation {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  /** Prix indicatif provisoire — à compléter par Isabelle. */
  price: number | null;
  /** Vrai si le prix affiché doit être précédé de « À partir de ». */
  priceFrom: boolean;
  category: CategorySlug;
  seasons: Season[];
  materials: Material[];
  dimensions: string;
  colors: string[];
  customizable: boolean;
  /** Disponibilité affichée telle quelle. À compléter par Isabelle. */
  availability: string;
  mainImage: string;
  /** Texte alternatif de la photo principale. */
  mainImageAlt: string;
  gallery: string[];
  /** Nom lisible de la catégorie (ex. « Belles pensées »). */
  categoryName: string;
  /** Ancienne adresse, conservée pour rediriger les anciens liens. */
  previousSlug: string | null;
  /** Titre et description personnalisés pour les moteurs de recherche (vides = générés). */
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
  /** Délai indicatif de réalisation. */
  leadTime: string;
  /** Conseils d'entretien, optionnels. */
  careInstructions?: string;
  /** Mise en avant sur la page d'accueil. */
  featured: boolean;
  /** Badges affichés sur la carte. */
  badges: Badge[];
}

export interface SeasonInfo {
  slug: Season;
  name: string;
  description: string;
  image: string;
}

export interface MaterialInfo {
  slug: Material;
  name: string;
  description: string;
  image: string;
}

export interface NavItem {
  label: string;
  path: string;
}
