/**
 * Textes du site modifiables depuis l'administration (page « Textes du site »).
 * Chaque texte a une valeur par défaut, affichée tant qu'Isabelle ne l'a pas changée.
 * La clé suit le format `page.section.cle` et correspond à la table `site_contents`.
 */
export type EditableText = {
  key: string;
  label: string;
  default: string;
  multiline?: boolean;
};

export type EditablePage = { page: string; label: string; texts: EditableText[] };

export const editablePages: EditablePage[] = [
  {
    page: 'accueil',
    label: 'Accueil',
    texts: [
      { key: 'accueil.coups_de_coeur.titre', label: 'Coups de cœur — titre', default: 'Les coups de cœur de l’atelier' },
      { key: 'accueil.coups_de_coeur.texte', label: 'Coups de cœur — texte', default: 'Des créations singulières, pensées pour offrir de l’émotion et garder les beaux souvenirs près de soi.', multiline: true },
      { key: 'accueil.categories.titre', label: 'Catégories — titre', default: 'Une création pour chaque moment' },
      { key: 'accueil.sur_mesure.titre', label: 'Sur mesure — titre', default: 'Une histoire, un souvenir, une création rien que pour vous' },
      { key: 'accueil.sur_mesure.texte', label: 'Sur mesure — texte', default: 'Prénom, couleurs, message, composition ou événement : échangez directement avec Isabelle pour imaginer une décoration qui vous ressemble.', multiline: true },
      { key: 'accueil.matieres.titre', label: 'Matières — titre', default: 'Des matières simples transformées avec le cœur' },
      { key: 'accueil.saisons.titre', label: 'Saisons — titre', default: 'L’atelier au fil des saisons' },
      { key: 'accueil.univers.titre', label: 'Univers — titre', default: 'Bienvenue dans l’univers d’Isabelle' },
      { key: 'accueil.univers.texte', label: 'Univers — texte', default: 'Chaque création est imaginée et réalisée à la main pour apporter de l’émotion dans les maisons et créer des cadeaux porteurs de sens. Ici, les matières simples deviennent des histoires à garder.', multiline: true },
      { key: 'accueil.vosges.titre', label: 'Atelier vosgien — titre', default: 'Un atelier artisanal au cœur des Vosges' },
      { key: 'accueil.vosges.texte', label: 'Atelier vosgien — texte', default: 'Installée dans les Vosges, Isabelle imagine et fabrique chaque création à la main, en galets, papier, bois et fil de fer. Ses pièces sont présentées toute l’année à La Boutik’art à Saint-Dié-des-Vosges et à La Boutique des Artisans à Raon-l’Étape, et sur les marchés artisanaux vosgiens. Vous cherchez une décoration ou un cadeau fait main dans les Vosges ? Écrivez-lui directement.', multiline: true },
      { key: 'accueil.faq.titre', label: 'Questions fréquentes — titre', default: 'Vos questions sur l’atelier' },
      { key: 'accueil.appel.titre', label: 'Appel final — titre', default: 'Vous avez eu un coup de cœur ?' },
      { key: 'accueil.appel.texte', label: 'Appel final — texte', default: 'Contactez Isabelle pour connaître la disponibilité d’une création ou imaginer votre modèle personnalisé.', multiline: true },
    ],
  },
  {
    page: 'boutique',
    label: 'Boutique',
    texts: [
      { key: 'boutique.entete.titre', label: 'Titre', default: 'Les créations de l’atelier' },
      { key: 'boutique.entete.texte', label: 'Introduction', default: 'Chaque pièce est réalisée à la main, en petite quantité. Trouvez celle qui vous ressemble ou offrez-la à quelqu’un que vous aimez.', multiline: true },
    ],
  },
  {
    page: 'personnalisation',
    label: 'Personnalisation',
    texts: [
      { key: 'personnalisation.entete.titre', label: 'Titre', default: 'Imaginez votre création personnalisée' },
      { key: 'personnalisation.entete.texte', label: 'Introduction', default: 'Prénom, couleurs, message, composition ou événement : racontez votre envie à Isabelle, même si elle n’est encore qu’une esquisse.', multiline: true },
    ],
  },
  {
    page: 'a-propos',
    label: 'L’atelier',
    texts: [
      { key: 'a-propos.entete.titre', label: 'Titre', default: 'Derrière chaque création, il y a Isabelle' },
      { key: 'a-propos.entete.texte', label: 'Premier paragraphe', default: 'Des matières simples, des gestes patients et l’envie de faire naître de l’émotion : c’est le cœur de l’atelier.', multiline: true },
      { key: 'a-propos.entete.texte2', label: 'Second paragraphe', default: 'Chaque décoration est imaginée et réalisée à la main, avec le plaisir de créer des objets qui trouvent une place particulière dans les maisons et dans les histoires de famille.', multiline: true },
    ],
  },
  {
    page: 'evenements',
    label: 'Événements',
    texts: [
      { key: 'evenements.entete.titre', label: 'Titre', default: 'Retrouvez l’atelier près de chez vous' },
      { key: 'evenements.entete.texte', label: 'Introduction', default: 'Isabelle expose ses créations dans des boutiques partenaires et participe à des marchés de créateurs. Venez découvrir les pièces en vrai et échanger directement.', multiline: true },
    ],
  },
  {
    page: 'contact',
    label: 'Contact',
    texts: [
      { key: 'contact.entete.titre', label: 'Titre', default: 'Une création vous plaît ou vous avez une idée particulière ?' },
      { key: 'contact.entete.texte', label: 'Introduction', default: 'Écrivez-moi, je vous répondrai avec plaisir.', multiline: true },
      { key: 'contact.echange.texte', label: 'Encadré « Échangeons simplement »', default: 'Pour une disponibilité, une question ou un projet personnalisé, le plus simple est de m’écrire. Je prendrai le temps de vous répondre.', multiline: true },
    ],
  },
];

export const editableTexts: Record<string, EditableText> = Object.fromEntries(
  editablePages.flatMap((page) => page.texts.map((text) => [text.key, text]))
);
