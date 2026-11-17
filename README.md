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

## Boutique en ligne (panier et paiement Stripe)

### Fonctionnement

1. Isabelle coche **« Vendre en ligne »** sur une création (Admin → Créations) et, pour une pièce en plusieurs exemplaires, indique la quantité disponible (vide = pièce unique).
2. Le visiteur ajoute des créations au **panier** (`/panier`), choisit **Livraison à domicile** (frais fixes par commande) ou **Retrait gratuit en boutique**, donne ses coordonnées et accepte les CGV.
3. La fonction serveur `checkout-create` **recalcule tout** depuis le catalogue (prix, disponibilité, frais de port, total), enregistre la commande « en attente » et crée la session **Stripe Checkout** (paiement unique en euros ; adresse de livraison demandée par Stripe uniquement pour la livraison à domicile).
4. Seul le **webhook Stripe signé** (`stripe-webhook`) — ou une vérification directe auprès de Stripe par `checkout-status` — fait passer la commande à « payée ». Le numéro (CMD-AAAA-0001), le passage en « Vendue » des pièces uniques, l'e-mail au client et la notification à Isabelle sont faits à ce moment-là, une seule fois.
5. Isabelle traite la commande dans **Admin → Commandes** : « À préparer » → « Prête pour retrait » ou « Expédiée » (avec transporteur et suivi facultatifs ; e-mail au client) → « Terminée ».

Deux statuts distincts : **paiement** (en attente, en cours de validation, payée, refusée, abandonnée, remboursée) et **préparation** (à préparer, prête pour retrait, expédiée, terminée, annulée).

Tant que la boutique est **fermée** (Admin → Paramètres → Boutique en ligne), rien n'apparaît pour le public. Une personne connectée à l'administration voit la boutique en aperçu et peut la tester, **uniquement avec une clé Stripe de test** (vérifié côté serveur).

### Fichiers

| Rôle | Fichiers |
|---|---|
| Base de données | `supabase/migrations/20261117100000_cart_checkout.sql` (tables `orders`, `order_items`, `stripe_events`, réglages de livraison) |
| Fonctions serveur | `supabase/functions/checkout-create`, `checkout-status`, `stripe-webhook`, `order-update`, `stripe-sync` (état de Stripe et création automatique du webhook) ; logique commune dans `_shared/shop.ts`, `_shared/mail.ts`, `_shared/stripe.ts` |
| Site | `src/lib/cart.tsx` (panier), `src/components/BuyBox.tsx` (ajout au panier), `src/pages/CartPage.tsx` (panier et confirmation), `src/components/Header.tsx` (icône panier) |
| Administration | `src/adminPages.tsx` : `AdminOrders`, `AdminDelivery`, `ShopSettings`, `ShopPanel` |
| Tests | `supabase/functions/_tests/` (faux serveur Stripe, banc d'essai, 57 vérifications) |

### Secrets (Supabase → Edge Functions → Secrets)

| Nom | Contenu |
|---|---|
| `STRIPE_SECRET_KEY` | Clé secrète du compte Stripe **d'Isabelle** : `sk_test_…` pour les essais, `sk_live_…` seulement après validation |
| `SMTP_PASSWORD` | Mot de passe de contact@atelier-isabelle.fr (déjà en place) |
| `SMTP_USER`, `SMTP_HOST`, `SMTP_PORT` | Facultatifs (par défaut contact@atelier-isabelle.fr, smtp.hostinger.com, 465) |

Aucune clé Stripe n'est jamais dans le code du site ni dans le navigateur. `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement aux fonctions. `STRIPE_API_BASE` ne sert qu'aux tests automatisés et ne doit pas être défini en production.

### Webhook Stripe

Rien à faire à la main : en ouvrant **Admin → Paramètres**, la fonction `stripe-sync` crée le point de réception
`https://clkkasnnbiktrrncabjc.supabase.co/functions/v1/stripe-webhook` dans Stripe (événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`) et conserve son secret de signature dans `private.stripe_config`. Un point distinct est créé pour le mode test et pour le mode réel.

### Paiement de test

1. Mettre une clé `sk_test_…` dans `STRIPE_SECRET_KEY`, ouvrir Admin → Paramètres (le bandeau indique « Mode test »).
2. Renseigner Admin → Paramètres de livraison (adresse de retrait), cocher « Vendre en ligne » sur une création.
3. Connecté à l'administration, ouvrir la création sur le site, l'ajouter au panier et payer avec la carte `4242 4242 4242 4242`, date future, CVC quelconque (refus : `4000 0000 0000 0002` ; authentification 3D Secure : `4000 0025 0000 3155`).
4. Vérifier la commande dans Admin → Commandes et les e-mails reçus.

### Tests automatisés

`supabase/functions/_tests/` contient un faux serveur Stripe (`mock-stripe.cjs`), un banc d'essai Deno qui exécute les fonctions du dépôt (`harness.ts`) et les scénarios (`shop.test.cjs`). Ils écrivent dans la base réelle et doivent être lancés uniquement boutique fermée, avec les identifiants de créations de test du script ; ils remettent les créations en l'état, mais les commandes de test sont à supprimer ensuite.

## Hébergement actuel

- Site : https://atelier-isabelle.fr, hébergé chez Hostinger (fichiers de `dist/` dans `public_html`, avec `public/.htaccess` pour les routes React Router).
- Base de données : projet Supabase `siteweb` (`clkkasnnbiktrrncabjc`). `supabase/schema-siteweb.sql` est la structure consolidée appliquée lors de la migration depuis Bolt ; les fichiers de `supabase/migrations/` sont l'historique d'origine.

## Ce qui se modifie depuis l'administration (/admin)

| Section | Contenu |
|---|---|
| Demandes | Messages reçus par les formulaires, statut, notes, réponse par e-mail |
| Commandes | Commandes payées et non abouties, articles, client, adresse ou retrait, statut de préparation, transporteur et suivi, e-mails au client, impression de la fiche d'expédition |
| Paramètres de livraison | Livraison à domicile (oui/non, frais fixes par commande), retrait gratuit en boutique (oui/non, lieu, adresse, indications) |
| Créations | Fiche complète, galerie de plusieurs photos (ordre, photo principale, description), saisons, matières, publication, coup de cœur, titre et description Google |
| Catégories, Saisons | Collections de la boutique et saisons |
| Matières | Photo, nom et texte des matières (accueil, page L'atelier) |
| Bannière d'accueil | Diapositives du carrousel |
| Événements et boutiques | Marchés et boutiques partenaires (page Événements et page Contact), avec photo et lien |
| Images du site | Logos, image de partage, photos des sections, images des saisons |
| Textes du site | Titres et paragraphes des pages (liste dans `src/config/editableContent.ts`) |
| Pages légales, Paramètres | Informations légales ; coordonnées, réseaux, texte du pied de page |

Les photos importées sont converties en WebP et nommées d'après la création pour le référencement.

## Mise en ligne

`npm run build:seo` compile le site puis pré-génère chaque page publique (titres, descriptions,
données structurées lisibles sans JavaScript), `sitemap.xml` et `robots.txt` à partir du catalogue.
Il nécessite Playwright (`npm install --no-save playwright` puis `npx playwright install chromium`).

Le workflow GitHub `.github/workflows/deploy.yml` l'exécute à chaque modification de `main`, chaque nuit
et à la demande, puis publie le résultat sur la branche `deploy`, que Hostinger met en ligne
automatiquement. Les changements faits dans l'administration sont visibles immédiatement sur le site ;
la reconstruction de nuit met à jour les pages pré-générées et le plan du site.
