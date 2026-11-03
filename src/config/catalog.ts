import type { Category, MaterialInfo, SeasonInfo } from '@/types';

export const categories: Category[] = [
  {
    slug: 'naissance-enfance',
    name: 'Naissance et enfance',
    description:
      "Pour accueillir un nouveau-né, fêter un anniversaire ou garder une trace tendre de l'enfance.",
    emoji: '🌱',
  },
  {
    slug: 'famille',
    name: 'Famille',
    description:
      'Des compositions qui rassemblent les visages et les cœurs de ceux qu’on aime.',
    emoji: '🏡',
  },
  {
    slug: 'amitie',
    name: 'Amitié',
    description:
      "Pour dire à une amie qu'elle compte, aujourd'hui et pour longtemps.",
    emoji: '🤝',
  },
  {
    slug: 'amour-mariage',
    name: 'Amour et mariage',
    description:
      'Pour les fiançailles, les noces et toutes les déclarations du cœur.',
    emoji: '💞',
  },
  {
    slug: 'decorations-saisonnières',
    name: 'Décorations saisonnières',
    description:
      'L’atelier suit le calendrier de la nature : printemps, été, automne, hiver et fêtes.',
    emoji: '🍂',
  },
  {
    slug: 'cadeaux-personnalises',
    name: 'Cadeaux personnalisés',
    description:
      'Un prénom, une date, un message : offrez une création qui n’appartient qu’à son destinataire.',
    emoji: '🎁',
  },
];

export const seasons: SeasonInfo[] = [
  {
    slug: 'printemps',
    name: 'Printemps',
    description:
      'Des couleurs douces et des naissances à célébrer. L’atelier s’éveille avec les bourgeons.',
    image: '/saison-printemps.webp',
  },
  {
    slug: 'ete',
    name: 'Été',
    description:
      'Lumière, mariages et retrouvailles. Des compositions solaires et chaleureuses.',
    image: '/saison-ete.webp',
  },
  {
    slug: 'automne',
    name: 'Automne',
    description:
      'Teintes cuivrées et ambiances feutrées. Le temps des retrouvailles en famille.',
    image: '/716510643_2113537999227984_4704869155250699751_n.jpg',
  },
  {
    slug: 'hiver',
    name: 'Hiver et fêtes',
    description:
      'Noël, Nouvelle Année et douceurs d’hiver. L’atelier se pare de blanc et d’or.',
    image: '/saison-hiver.webp',
  },
];

export const materials: MaterialInfo[] = [
  {
    slug: 'galets',
    name: 'Galets',
    description:
      'Des pierres lisses, ramassées au fil des balades, qui deviennent des visages, des corps et des souvenirs.',
    image: '/52f3caac-c97b-46e0-9436-4c54046eb942.png',
  },
  {
    slug: 'papier',
    name: 'Papier',
    description:
      'Découpé, plié, assemblé : le papier prend la forme de fleurs, de lettres et de petits mondes.',
    image: '/dd3dbe2a-9beb-4498-817b-405876b3c32a.png',
  },
  {
    slug: 'bois',
    name: 'Bois',
    description:
      'Des branches et des chutes récupérées, soigneusement poncées et assemblées à la main pour donner vie à mes créations.',
    image: '/e4dde91a-0bb8-44f2-9043-d2522ce5fbdb.png',
  },
  {
    slug: 'fil-de-fer',
    name: 'Fil de fer',
    description:
      'Tordu et façonné à la main, il dessine des mots, des contours et de délicates silhouettes.',
    image: '/209742ad-477e-4973-969b-b1338c334404_(1).png',
  },
];

export const seasonLabels: Record<string, string> = {
  printemps: 'Printemps',
  ete: 'Été',
  automne: 'Automne',
  hiver: 'Hiver et fêtes',
};

export const materialLabels: Record<string, string> = {
  galets: 'Galets',
  papier: 'Papier',
  bois: 'Bois',
  'fil-de-fer': 'Fil de fer',
};

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getSeasonBySlug(slug: string): SeasonInfo | undefined {
  return seasons.find((s) => s.slug === slug);
}
