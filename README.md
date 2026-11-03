# L’Atelier d’Isabelle

Site vitrine React + TypeScript pour une créatrice artisanale, avec catalogue et espace d’administration privé. Le site présente des décorations en galets, bois, papier et fil de fer et prépare une évolution vers le e-commerce sans installer de solution de paiement dans cette première version.

## Installer et lancer

```bash
npm install
npm run dev
```

Le site utilise Vite. La version de production se génère avec :

```bash
npm run build
```

Le dossier `dist` peut être hébergé sur Netlify, Vercel ou tout hébergement statique compatible avec une application React. La réécriture des routes vers `index.html` est nécessaire pour les routes React Router.

## Connexion Supabase

Le projet utilise le client officiel `@supabase/supabase-js`. Les variables attendues sont documentées dans `.env.example` :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

La clé `service_role` ne doit jamais être ajoutée au navigateur.

Le schéma Supabase a été appliqué avec trois migrations : création des tables et règles de sécurité, import du catalogue initial, puis isolement du contrôle des rôles. Les tables concernées sont `profiles`, `products`, `product_images`, `categories`, `seasons`, `product_seasons`, `site_contents`, `site_settings`, `contact_requests` et `audit_logs`.

## Premier compte administrateur

1. Créer un utilisateur depuis Supabase Auth avec e-mail et mot de passe. L’inscription publique n’existe pas dans l’application.
2. Dans l’éditeur SQL de Supabase, créer son profil en remplaçant les deux valeurs par l’identifiant de l’utilisateur et son adresse :

```sql
insert into public.profiles (id, email, full_name, role)
values ('ID_DE_L_UTILISATEUR', 'ADRESSE_EMAIL', 'Isabelle', 'admin');
```

Aucun e-mail ni mot de passe n’est enregistré dans le projet. Les utilisateurs suivants peuvent être ajoutés par un administrateur, avec le rôle `editor` ou `admin`.

## Utiliser l’administration

L’espace privé se trouve sur `/admin`. Il permet de se connecter, de consulter les indicateurs, d’ajouter et modifier les créations, de publier ou laisser en brouillon, de gérer les catégories et saisons, d’importer des images et de traiter les demandes reçues.

Les visiteurs ne voient jamais le menu d’administration. Les routes privées redirigent vers `/admin/login` si aucune session valide n’existe.

Les rôles sont appliqués dans Supabase, pas seulement dans l’interface :

- `admin` : catalogue, contenus, demandes, médias, réglages et profils ;
- `editor` : catalogue, contenus, demandes et médias, sans réglages sensibles ni gestion des profils.

## Images et stockage

Les trois espaces Storage sont créés automatiquement par la migration :

- `product-images` : images publiques des créations, gérées par admin/editor, 8 Mo maximum ;
- `site-images` : logo et images du site, gérées par admin/editor, 8 Mo maximum ;
- `request-attachments` : fichiers privés de demandes, lecture réservée aux admin/editor.

L’interface vérifie le format JPG, PNG ou WebP et la limite de 8 Mo avant l’import. Le Storage applique aussi la limite côté serveur. Les fichiers publics utilisent des URLs publiques ; les pièces jointes privées doivent être servies par URL signée.

## Données du catalogue

Le catalogue initial reprend les créations présentes dans la première version avec leurs noms, descriptions, catégories, saisons, prix provisoires et images. Les prix et dimensions restent à valider par Isabelle.

Les nouvelles créations sont maintenant enregistrées dans Supabase depuis l’administration. Les anciens fichiers de données restent disponibles comme référence de contenu et de migration, mais l’espace d’administration est la source de vérité pour les nouvelles modifications.

## Formulaires et demandes

Les formulaires publics écrivent dans `contact_requests` avec un honeypot, une validation côté navigateur et des contraintes RLS côté base. Les visiteurs peuvent créer une demande, mais ne peuvent ni la lire ni la modifier. L’administration permet de consulter les demandes, voir leur type et modifier leur statut.

Si un service de formulaire externe est préféré, renseigner un endpoint dans la configuration prévue ; sinon Supabase reçoit directement les demandes.

## Contenus et paramètres

Les tables `site_contents` et `site_settings` sont prêtes pour rendre les textes et coordonnées administrables. Les pages `/admin/contenus` et `/admin/parametres` sont déjà protégées et connectées à ces tables ; les écrans peuvent être enrichis avec des champs métier au fur et à mesure du remplissage des contenus réels.

## Tester la sécurité

- Ouvrir une page publique sans session : les créations publiées sont lisibles, les brouillons ne le sont pas.
- Essayer d’ouvrir `/admin` sans session : redirection vers la connexion.
- Vérifier qu’un visiteur ne peut pas sélectionner les demandes dans l’API Supabase.
- Créer un profil `editor` et vérifier qu’il ne peut pas modifier les paramètres sensibles.
- Exécuter l’advisor de sécurité Supabase après toute évolution des policies.

## Préparer l’e-commerce

La couche d’interface sépare déjà les données des créations, les fiches, les filtres et les appels à l’action. Pour évoluer :

1. Ajouter des variantes et options de personnalisation dans les données.
2. Ajouter un contexte panier avec persistance locale ou serveur.
3. Créer un checkout côté serveur avec Stripe ou une solution e-commerce ; ne jamais mettre de clé secrète dans le navigateur.
4. Gérer disponibilité, stock, livraison et commandes côté serveur.
5. Ajouter confirmation et suivi de commande.

Aucun faux panier ni faux paiement n’est simulé dans cette version.

## Hébergement actuel

- Site : https://atelier-isabelle.fr, hébergé chez Hostinger (fichiers de `dist/` dans `public_html`, avec `public/.htaccess` pour les routes React Router).
- Base de données : projet Supabase `siteweb` (`clkkasnnbiktrrncabjc`). `supabase/schema-siteweb.sql` est la structure consolidée appliquée lors de la migration depuis Bolt ; les fichiers de `supabase/migrations/` sont l'historique d'origine.
