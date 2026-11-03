import { Link } from 'react-router-dom';
import { Scale, Shield, Cookie, FileText, MessageSquare, ShoppingBag, Truck, RotateCcw, FileCheck } from 'lucide-react';
import { LegalPage, LegalTable, LegalAlert, LegalEmpty } from '@/components/LegalPage';
import { useLegalSettings } from '@/lib/legalService';
import { useSiteSettings } from '@/lib/siteData';
import { formatPrice } from '@/lib/seo';

type S = Record<string, string>;
function val(settings: S, key: string): string { return settings[key] || ''; }
function has(settings: S, key: string): boolean { return Boolean(settings[key]); }
function fmtDate(iso: string): string { if (!iso) return ''; try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return iso; } }

export function LegalHubPage() {
  const { settings, loading } = useLegalSettings();
  const groups = [
    { label: 'Informations générales', items: [
      { to: '/mentions-legales', label: 'Mentions légales', icon: Scale, desc: 'Éditeur, hébergeur, propriété intellectuelle.' },
      { to: '/conditions-utilisation', label: 'Conditions d\'utilisation', icon: FileText, desc: 'Règles d\'usage du site.' },
      { to: '/informations-commerciales', label: 'Informations commerciales', icon: ShoppingBag, desc: 'Créations, prix et demandes.' },
    ]},
    { label: 'Données et confidentialité', items: [
      { to: '/politique-confidentialite', label: 'Politique de confidentialité', icon: Shield, desc: 'RGPD, données collectées, vos droits.' },
      { to: '/cookies', label: 'Politique des cookies', icon: Cookie, desc: 'Traceurs et consentement.' },
      { to: '/gestion-des-cookies', label: 'Gérer mes cookies', icon: Cookie, desc: 'Modifier vos choix à tout moment.' },
    ]},
    { label: 'Réclamations et médiation', items: [
      { to: '/mediation-consommation', label: 'Médiation de la consommation', icon: MessageSquare, desc: 'Procédure et coordonnées du médiateur.' },
    ]},
  ];
  const ecommerceDocs = [
    { to: '/conditions-generales-de-vente', label: 'Conditions générales de vente', icon: FileText, desc: 'Règles applicables aux ventes en ligne.' },
    { to: '/livraison', label: 'Politique de livraison', icon: Truck, desc: 'Zones, délais et frais.' },
    { to: '/retours-remboursements', label: 'Retours et remboursements', icon: RotateCcw, desc: 'Procédure et droit de rétractation.' },
    { to: '/droit-de-retractation', label: 'Droit de rétractation', icon: FileCheck, desc: 'Exceptions et conditions.' },
    { to: '/formulaire-retractation', label: 'Formulaire de rétractation', icon: FileCheck, desc: 'Formulaire type à imprimer.' },
  ];
  return (
    <>
      <LegalPage title="Informations légales" breadcrumb="Informations légales" description="Retrouvez ici tous les documents légaux et d'information du site L'Atelier d'Isabelle." sections={[]} />
      <main className="pb-20">
        <div className="container-page max-w-5xl -mt-8">
          {loading && <p className="text-sm text-wood-deep/60">Chargement des informations légales…</p>}
          <div className="space-y-12">
            {groups.map((group) => (
              <div key={group.label}>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-terracotta mb-4">{group.label}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((item) => (
                    <Link key={item.to} to={item.to} className="group rounded-soft border border-wood-deep/10 bg-off-white p-5 hover:border-terracotta/40 hover:shadow-soft transition-all">
                      <item.icon className="h-6 w-6 text-terracotta mb-3" />
                      <p className="font-medium group-hover:text-terracotta transition-colors">{item.label}</p>
                      <p className="text-sm text-wood-deep/60 mt-1">{item.desc}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-terracotta mb-4">Vente en ligne</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ecommerceDocs.map((item) => (
                  <Link key={item.to} to={item.to} className="group rounded-soft border border-wood-deep/10 bg-off-white p-5 hover:border-terracotta/40 hover:shadow-soft transition-all">
                    <item.icon className="h-6 w-6 text-terracotta mb-3" />
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-wood-deep/60 mt-1">{item.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export function LegalNoticePage() {
  const { settings } = useLegalSettings();
  const s = settings;
  const hasVat = has(s, 'editor_vat_number');
  const hasRcs = has(s, 'editor_rcs');
  const hasCapital = has(s, 'editor_capital');
  const sections = [
    { id: 'editeur', title: 'Éditeur du site', children: (
      <div className="space-y-3">
        <p><strong>Nom commercial :</strong> {val(s, 'editor_trade_name')}</p>
        {has(s, 'editor_full_name') ? <p><strong>Exploitante :</strong> {val(s, 'editor_full_name')}</p> : <LegalAlert><LegalEmpty label="Information obligatoire à compléter" /></LegalAlert>}
        {has(s, 'editor_legal_form') && <p><strong>Forme juridique :</strong> {val(s, 'editor_legal_form')}</p>}
        {has(s, 'editor_address') ? <p><strong>Adresse :</strong> {val(s, 'editor_address')}</p> : <LegalAlert><LegalEmpty label="Adresse obligatoire à compléter" /></LegalAlert>}
        {has(s, 'editor_email') ? <p><strong>E-mail :</strong> {val(s, 'editor_email')}</p> : <LegalAlert><LegalEmpty label="E-mail obligatoire à compléter" /></LegalAlert>}
        {has(s, 'editor_phone') && <p><strong>Téléphone :</strong> {val(s, 'editor_phone')}</p>}
        {has(s, 'editor_siren') && <p><strong>SIREN :</strong> {val(s, 'editor_siren')}</p>}
        {has(s, 'editor_siret') && <p><strong>SIRET :</strong> {val(s, 'editor_siret')}</p>}
        {hasRcs && <p><strong>Immatriculation :</strong> RCS {val(s, 'editor_rcs')} {val(s, 'editor_rcs_city')}</p>}
        {hasCapital && <p><strong>Capital social :</strong> {val(s, 'editor_capital')}</p>}
        {hasVat && <p><strong>TVA intracommunautaire :</strong> {val(s, 'editor_vat_number')}</p>}
        {val(s, 'editor_vat_franchise') === 'true' && <p><strong>TVA :</strong> Franchise en base de TVA (article 293 B du CGI)</p>}
        <p><strong>Activité :</strong> {val(s, 'editor_activity')}</p>
        {has(s, 'editor_publication_director') ? <p><strong>Directrice de publication :</strong> {val(s, 'editor_publication_director')}</p> : <LegalAlert><LegalEmpty label="Directeur de publication à compléter" /></LegalAlert>}
      </div>
    )},
    { id: 'hebergeur', title: 'Hébergement', children: has(s, 'host_name') ? (
      <div className="space-y-3">
        <p><strong>Hébergeur :</strong> {val(s, 'host_name')}</p>
        {has(s, 'host_company') && <p><strong>Dénomination :</strong> {val(s, 'host_company')}</p>}
        {has(s, 'host_address') && <p><strong>Adresse :</strong> {val(s, 'host_address')}</p>}
        {has(s, 'host_phone') && <p><strong>Téléphone :</strong> {val(s, 'host_phone')}</p>}
        {has(s, 'host_website') && <p><strong>Site :</strong> <a href={val(s, 'host_website')} target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">{val(s, 'host_website')}</a></p>}
      </div>
    ) : <LegalAlert><LegalEmpty label="Informations d'hébergement obligatoires à compléter" /></LegalAlert> },
    { id: 'propriete', title: 'Propriété intellectuelle', children: (
      <div className="space-y-3">
        <p>Sous réserve des droits appartenant à des tiers, l'ensemble des contenus présents sur ce site (textes, logo, photographies, créations, éléments graphiques) est la propriété de {val(s, 'editor_trade_name')}.</p>
        <p>Toute reproduction, représentation ou exploitation commerciale de ces éléments sans autorisation préalable écrite est interdite.</p>
        <p>Les photographies des créations sont présentées à titre indicatif. Le caractère artisanal des pièces peut entraîner de légères différences non substantielles par rapport aux photographies.</p>
      </div>
    )},
    { id: 'responsabilite', title: 'Responsabilité', children: (
      <div className="space-y-3">
        <p>L'éditeur s'efforce de fournir des informations exactes et à jour. Toutefois, les informations présentées sur ce site ne sauraient engager la responsabilité de l'éditeur au-delà des obligations légales applicables.</p>
        <p>Les liens vers des sites externes sont fournis à titre indicatif. L'éditeur n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.</p>
      </div>
    )},
    { id: 'droit', title: 'Droit applicable', children: <p>Le présent site et les conditions qui s'y rapportent sont soumis au droit français. Les tribunaux français sont compétents pour tout litige s'y rapportant.</p> },
  ];
  return <LegalPage title="Mentions légales" breadcrumb="Mentions légales" sections={sections} updatedAt={fmtDate(val(settings, 'privacy_update_date'))} />;
}

export function PrivacyPolicyPage() {
  const { settings: s } = useLegalSettings();
  const sections = [
    { id: 'responsable', title: 'Responsable du traitement', children: (
      <div className="space-y-3">
        <p>Le responsable du traitement des données est {val(s, 'editor_trade_name')}.</p>
        {has(s, 'dpo_address') && <p><strong>Adresse postale :</strong> {val(s, 'dpo_address')}</p>}
        {has(s, 'dpo_email') ? <p><strong>E-mail d'exercice des droits :</strong> {val(s, 'dpo_email')}</p> : <LegalAlert><LegalEmpty label="E-mail d'exercice des droits à compléter" /></LegalAlert>}
        {has(s, 'dpo_dpo') && <p><strong>Délégué à la protection des données :</strong> {val(s, 'dpo_dpo')}</p>}
      </div>
    )},
    { id: 'donnees', title: 'Données collectées et finalités', children: (
      <div className="space-y-6">
        <p>Les données ci-dessous sont collectées selon les circonstances décrites.</p>
        <LegalTable headers={['Traitement', 'Données', 'Finalité', 'Base juridique', 'Durée']} rows={[
          [<strong>Formulaire de contact</strong>, 'Nom, prénom, e-mail, téléphone (facultatif), message', 'Répondre à votre demande', 'Exécution de mesures précontractuelles / intérêt légitime', val(s, 'data_retention_contact') || <LegalEmpty label="À compléter" />],
          [<strong>Demande sur une création</strong>, 'Nom, prénom, e-mail, message, création concernée', 'Vérifier la disponibilité et répondre', 'Exécution de mesures précontractuelles', val(s, 'data_retention_contact') || <LegalEmpty label="À compléter" />],
          [<strong>Demande de personnalisation</strong>, 'Nom, prénom, e-mail, téléphone (facultatif), description du projet, couleurs, dimensions, budget, date souhaitée', 'Étudier le projet et établir un devis', 'Exécution de mesures précontractuelles', val(s, 'data_retention_contact') || <LegalEmpty label="À compléter" />],
          [<strong>Image d'inspiration</strong>, 'Fichier image joint', 'Évaluer la demande de personnalisation', 'Consentement', val(s, 'data_retention_contact') || <LegalEmpty label="À compléter" />],
          [<strong>Compte client (à venir)</strong>, 'Nom, e-mail, mot de passe', 'Gérer le compte lors de la vente en ligne', 'Exécution du contrat', val(s, 'data_retention_accounts') || <LegalEmpty label="À venir" />],
          [<strong>Commande (à venir)</strong>, 'Coordonnées de livraison, détails de la commande', 'Traiter et expédier la commande', 'Exécution du contrat', val(s, 'data_retention_orders') || <LegalEmpty label="À venir" />],
          [<strong>Statistiques de fréquentation</strong>, 'Données techniques anonymisées', "Mesurer l'audience du site", 'Intérêt légitime', '13 mois maximum'],
        ]} />
      </div>
    )},
    { id: 'destinataires', title: 'Destinataires des données', children: (
      <div className="space-y-3">
        <p>Les données collectées via les formulaires sont destinées à {val(s, 'editor_trade_name')} et à ses prestataires techniques intervenant dans la gestion du site et des demandes.</p>
        {has(s, 'data_processors') ? <p><strong>Prestataires techniques :</strong> {val(s, 'data_processors')}</p> : <LegalAlert><LegalEmpty label="Prestataires techniques à renseigner" /></LegalAlert>}
        <p>Les données ne sont pas vendues ni cédées à des tiers à des fins commerciales.</p>
      </div>
    )},
    { id: 'hebergement-donnees', title: 'Hébergement et transferts', children: (
      <div className="space-y-3">
        {has(s, 'data_hosting_location') ? <p><strong>Lieu d'hébergement :</strong> {val(s, 'data_hosting_location')}</p> : <LegalAlert><LegalEmpty label="Lieu d'hébergement à renseigner" /></LegalAlert>}
        {has(s, 'data_eeu_transfers') && <p><strong>Transferts hors EEE :</strong> {val(s, 'data_eeu_transfers')}</p>}
      </div>
    )},
    { id: 'securite', title: 'Sécurité', children: <p>Les données sont stockées sur des services techniques adaptés. Des mesures de sécurité sont mises en œuvre pour limiter les risques d'accès non autorisé.</p> },
    { id: 'droits', title: 'Vos droits', children: (
      <div className="space-y-3">
        <p>Conformément au Règlement général sur la protection des données et à la loi Informatique et Libertés, vous disposez des droits suivants :</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Droit d'accès à vos données</li>
          <li>Droit de rectification</li>
          <li>Droit d'effacement</li>
          <li>Droit à la limitation du traitement</li>
          <li>Droit d'opposition</li>
          <li>Droit à la portabilité, lorsqu'il s'applique</li>
          <li>Droit de retirer votre consentement lorsque le traitement repose sur le consentement</li>
        </ul>
        <p>Pour exercer vos droits, écrivez à l'adresse indiquée dans la section « Responsable du traitement ».</p>
        <p>Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).</p>
      </div>
    )},
    { id: 'mise-a-jour', title: 'Mise à jour', children: <p>Cette politique a été mise à jour le {fmtDate(val(s, 'privacy_update_date')) || <LegalEmpty label="Date à compléter" />}.</p> },
  ];
  return <LegalPage title="Politique de confidentialité" breadcrumb="Confidentialité" sections={sections} updatedAt={fmtDate(val(s, 'privacy_update_date'))} />;
}

export function CookiesPolicyPage() {
  const { settings: s } = useLegalSettings();
  const sections = [
    { id: 'principe', title: 'Principe', children: (
      <p>Ce site utilise des traceurs (cookies et stockage local) uniquement lorsque cela est nécessaire à son fonctionnement. Aucun traceur publicitaire ou de mesure d'audience n'est déposé sans votre consentement.</p>
    )},
    { id: 'traceurs', title: 'Traceurs utilisés', children: (
      <div className="space-y-4">
        <LegalTable headers={['Nom', 'Fournisseur', 'Finalité', 'Durée', 'Catégorie']} rows={[
          ["Session d'authentification", 'Supabase', "Permettre la connexion à l'espace d'administration", 'Session', 'Strictement nécessaire'],
          ['Préférences de cookies', 'L\'Atelier d\'Isabelle', 'Mémoriser vos choix de consentement', '6 mois', 'Strictement nécessaire'],
        ]} />
        {has(s, 'cookies_audience_tools') && <p><strong>Outils d'audience :</strong> {val(s, 'cookies_audience_tools')}</p>}
        {has(s, 'cookies_third_party') && <p><strong>Contenus tiers :</strong> {val(s, 'cookies_third_party')}</p>}
        {!has(s, 'cookies_audience_tools') && !has(s, 'cookies_third_party') && <p>Aucun traceur de mesure d'audience, de publicité ou de contenu tiers n'est utilisé actuellement.</p>}
      </div>
    )},
    { id: 'consentement', title: 'Consentement', children: (
      <div className="space-y-3">
        <p>Les traceurs strictement nécessaires ne nécessitent pas de consentement. Les traceurs facultatifs, s'ils sont ajoutés à l'avenir, ne seront déposés qu'après votre consentement.</p>
        <p>Vous pouvez modifier vos choix à tout moment depuis la page <Link to="/gestion-des-cookies" className="text-terracotta hover:underline">Gérer mes cookies</Link>.</p>
      </div>
    )},
    { id: 'mise-a-jour', title: 'Mise à jour', children: <p>Cette politique a été mise à jour le {fmtDate(val(s, 'cookies_update_date')) || <LegalEmpty label="Date à compléter" />}.</p> },
  ];
  return <LegalPage title="Politique relative aux cookies" breadcrumb="Cookies" sections={sections} updatedAt={fmtDate(val(s, 'cookies_update_date'))} />;
}

export function CookieManagementPage() {
  const sections = [
    { id: 'gerer', title: 'Gérer mes cookies', children: (
      <div className="space-y-4">
        <p>Vous pouvez à tout moment modifier vos préférences concernant les traceurs facultatifs.</p>
        <LegalAlert>
          <p>Actuellement, ce site ne dépose que des traceurs strictement nécessaires à son fonctionnement. Aucun traceur facultatif n'est actif.</p>
        </LegalAlert>
        <p>Les traceurs strictement nécessaires (session d'administration, préférences de cookies) ne peuvent pas être désactivés, car ils sont indispensables au bon fonctionnement du site.</p>
      </div>
    )},
  ];
  return <LegalPage title="Gestion des cookies" breadcrumb="Gestion des cookies" sections={sections} />;
}

export function TermsOfUsePage() {
  const { settings: s } = useLegalSettings();
  const sections = [
    { id: 'objet', title: 'Objet du site', children: <p>Le site {val(s, 'editor_trade_name')} a pour objet la présentation des créations artisanales de l'atelier, la prise de contact et la demande de renseignements ou de créations personnalisées.</p> },
    { id: 'acces', title: 'Accès et disponibilité', children: <p>L'éditeur s'efforce de maintenir le site accessible. L'accès peut toutefois être interrompu pour des raisons de maintenance ou de force majeure.</p> },
    { id: 'utilisation', title: 'Utilisation', children: (
      <div className="space-y-3">
        <p>L'utilisateur s'engage à utiliser le site de manière licite et à ne pas porter atteinte aux droits de l'éditeur ou de tiers.</p>
        <p>Les informations présentées sur le site le sont à titre indicatif et n'engagent pas l'éditeur au-delà des obligations légales applicables.</p>
      </div>
    )},
    { id: 'propriete', title: 'Propriété intellectuelle', children: <p>Les textes, le logo, les photographies et les créations présentés sur ce site sont protégés. Leur reproduction ou exploitation commerciale sans autorisation préalable est interdite.</p> },
    { id: 'liens', title: 'Liens externes', children: <p>Le site peut contenir des liens vers des sites externes. L'éditeur n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.</p> },
    { id: 'responsabilite', title: 'Responsabilité', children: <p>L'éditeur ne peut être tenu responsable des dommages directs ou indirects résultant de l'utilisation du site, dans les limites de la loi applicable.</p> },
    { id: 'signalement', title: 'Signaler un problème', children: <p>Pour signaler un problème ou demander la modification d'un contenu, vous pouvez contacter l'éditeur via les coordonnées indiquées dans les <Link to="/mentions-legales" className="text-terracotta hover:underline">mentions légales</Link>.</p> },
    { id: 'donnees', title: 'Protection des données', children: <p>Le traitement des données personnelles est décrit dans la <Link to="/politique-confidentialite" className="text-terracotta hover:underline">politique de confidentialité</Link>.</p> },
    { id: 'droit', title: 'Droit applicable', children: <p>Les présentes conditions sont soumises au droit français.</p> },
  ];
  return <LegalPage title="Conditions d'utilisation du site" breadcrumb="Conditions d'utilisation" sections={sections} />;
}

export function MediationPage() {
  const { settings: s } = useLegalSettings();
  const hasMediator = has(s, 'mediator_name');
  const sections = [
    { id: 'prealable', title: 'Réclamation préalable', children: <p>En cas de litige, il est recommandé de contacter d'abord {val(s, 'editor_trade_name')} via les coordonnées indiquées dans les <Link to="/mentions-legales" className="text-terracotta hover:underline">mentions légales</Link> afin de rechercher une solution amiable.</p> },
    { id: 'mediation', title: 'Médiation de la consommation', children: hasMediator ? (
      <div className="space-y-3">
        <p>Si le litige n'a pas pu être résolu directement, vous pouvez recourir gratuitement à un médiateur de la consommation compétent.</p>
        <p><strong>Médiateur :</strong> {val(s, 'mediator_name')}</p>
        {has(s, 'mediator_address') && <p><strong>Adresse :</strong> {val(s, 'mediator_address')}</p>}
        {has(s, 'mediator_website') && <p><strong>Site :</strong> <a href={val(s, 'mediator_website')} target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">{val(s, 'mediator_website')}</a></p>}
        {has(s, 'mediator_process') && <p><strong>Modalités de saisine :</strong> {val(s, 'mediator_process')}</p>}
      </div>
    ) : <LegalAlert><LegalEmpty label="Médiateur à compléter. Aucun médiateur ne sera affiché publiquement tant que cette information n'aura pas été renseignée." /></LegalAlert> },
    { id: 'conditions', title: 'Conditions de recevabilité', children: (
      <div className="space-y-3">
        <p>La médiation de la consommation est une démarche gratuite. Pour être recevable, la demande doit notamment :</p>
        <ul className="list-disc list-inside space-y-1">
          <li>avoir fait l'objet d'une réclamation préalable écrite auprès de {val(s, 'editor_trade_name')}</li>
          <li>ne pas avoir été portée devant un juge</li>
          <li>ne pas porter sur un litige relevant d'un autre médiateur</li>
        </ul>
      </div>
    )},
    { id: 'juridictions', title: 'Juridictions compétentes', children: <p>Vous conservez la possibilité de saisir les juridictions compétentes conformément au droit applicable.</p> },
  ];
  return <LegalPage title="Médiation de la consommation" breadcrumb="Médiation" sections={sections} />;
}

export function CommercialInfoPage() {
  const sections = [
    { id: 'presentation', title: 'Présentation des créations', children: <p>Les créations présentées sur ce site le sont à titre informatif. Le caractère artisanal des pièces peut entraîner de légères différences non substantielles par rapport aux photographies.</p> },
    { id: 'prix', title: 'Prix', children: <p>Le prix affiché est indiqué en euros. Lorsqu'une création est personnalisable, le prix peut être précédé de la mention « À partir de », indiquant un tarif minimum susceptible de varier selon les options choisies.</p> },
    { id: 'disponibilite', title: 'Disponibilité', children: <p>La disponibilité d'une création doit être confirmée auprès de l'atelier. Certaines pièces sont disponibles immédiatement, d'autres sont fabriquées sur commande.</p> },
    { id: 'demande', title: 'Demandes et formulaires', children: <p>L'envoi d'un formulaire ne constitue pas automatiquement une commande. Il permet d'ouvrir un échange avec l'atelier pour vérifier la disponibilité, la faisabilité et le tarif.</p> },
    { id: 'personnalisation', title: 'Créations personnalisées', children: <p>Une création personnalisée fait l'objet d'un échange préalable et, si nécessaire, d'un devis. La commande n'est définitive qu'après acceptation des conditions applicables et confirmation par l'atelier.</p> },
    { id: 'variations', title: 'Caractère artisanal', children: <p>Les variations liées au fait main ne permettent pas de livrer un produit différent de celui convenu. L'atelier veille à ce que chaque création corresponde à la description convenue.</p> },
  ];
  return <LegalPage title="Informations commerciales" breadcrumb="Informations commerciales" sections={sections} />;
}

/* ------------------------------------------------------------------------- */
/* Vente en ligne : CGV, livraison, retours, rétractation, formulaire type.     */
/* Les informations propres à l'atelier (SIRET, adresse, médiateur…) viennent    */
/* de l'administration (Pages légales) ; frais de port et e-mail des Paramètres. */
/* ------------------------------------------------------------------------- */

const lnk = 'text-terracotta hover:underline';

/** Informations communes aux pages de vente. */
function useSaleInfo() {
  const { settings: s } = useLegalSettings();
  const site = useSiteSettings();
  const fee = Number(String(site.shop_shipping_fee || '').replace(',', '.'));
  return {
    s,
    name: val(s, 'editor_trade_name') || "L'Atelier d'Isabelle",
    person: val(s, 'editor_full_name'),
    address: val(s, 'editor_address'),
    siret: val(s, 'editor_siret'),
    email: (val(s, 'editor_email') || site.email || 'contact@atelier-isabelle.fr').toLowerCase(),
    phone: val(s, 'editor_phone') || site.phone,
    vatFranchise: val(s, 'editor_vat_franchise') === 'true',
    vatNumber: val(s, 'editor_vat_number'),
    shippingFee: fee > 0 ? formatPrice(fee) : '',
    shippingNote: site.shop_shipping_note,
    returnAddress: val(s, 'ecommerce_return_address') || val(s, 'editor_address'),
  };
}

function Missing({ label }: { label: string }) {
  return <LegalAlert><LegalEmpty label={label} /></LegalAlert>;
}

function SellerBlock() {
  const i = useSaleInfo();
  return (
    <div className="space-y-1">
      <p><strong>{i.name}</strong>{i.person ? ` — ${i.person}, entrepreneur individuel` : ''}</p>
      {i.address ? <p>{i.address}</p> : <Missing label="Adresse postale de l'atelier à compléter (Admin → Pages légales)" />}
      {i.siret ? <p>SIRET : {i.siret}</p> : <Missing label="Numéro SIRET à compléter (Admin → Pages légales)" />}
      <p>E-mail : <a className={lnk} href={`mailto:${i.email}`}>{i.email}</a>{i.phone ? <> — Téléphone : <a className={lnk} href={`tel:${i.phone.replace(/\s/g, '')}`}>{i.phone}</a></> : null}</p>
      <p>{i.vatFranchise ? 'TVA non applicable, article 293 B du Code général des impôts.' : i.vatNumber ? `N° de TVA intracommunautaire : ${i.vatNumber}` : 'TVA non applicable, article 293 B du Code général des impôts (franchise en base), sauf mention contraire.'}</p>
    </div>
  );
}

function MediatorBlock() {
  const { s } = useSaleInfo();
  return (
    <div className="space-y-3">
      <p>En cas de litige, vous pouvez d'abord écrire à l'atelier : nous cherchons toujours une solution amiable. À défaut de solution dans un délai raisonnable, et conformément aux articles L611-1 et suivants du Code de la consommation, vous pouvez recourir gratuitement au médiateur de la consommation suivant, au plus tard un an après votre réclamation écrite :</p>
      {has(s, 'mediator_name') ? (
        <p><strong>{val(s, 'mediator_name')}</strong>{has(s, 'mediator_address') ? ` — ${val(s, 'mediator_address')}` : ''}{has(s, 'mediator_website') ? <> — <a className={lnk} href={val(s, 'mediator_website')} target="_blank" rel="noreferrer">{val(s, 'mediator_website')}</a></> : null}</p>
      ) : <Missing label="Médiateur de la consommation à compléter (Admin → Pages légales)" />}
    </div>
  );
}

export function CgvPage() {
  const i = useSaleInfo();
  const sections = [
    { id: 'vendeur', title: '1. Vendeur', children: <SellerBlock /> },
    { id: 'objet', title: '2. Objet et acceptation', children: (
      <div className="space-y-3">
        <p>Les présentes conditions générales de vente (CGV) régissent les ventes de créations conclues en ligne sur le site atelier-isabelle.fr entre {i.name} et toute personne physique agissant en qualité de consommateur (« le client »).</p>
        <p>Le paiement d'une commande vaut acceptation pleine et entière des CGV en vigueur au jour de la commande. Elles sont accessibles à tout moment sur le site et peuvent être imprimées ou enregistrées. Les ventes réalisées sur les marchés et dans les boutiques partenaires relèvent des conditions de ces lieux de vente.</p>
      </div>
    )},
    { id: 'produits', title: '3. Les créations', children: (
      <div className="space-y-3">
        <p>Chaque création est imaginée et fabriquée à la main dans les Vosges. Ses caractéristiques essentielles (matières, dimensions, couleurs, prix) sont présentées sur sa fiche. Le caractère artisanal entraîne de légères variations (teinte d'un galet, veinage du bois, tracé du fil) qui font la singularité de chaque pièce et ne constituent pas un défaut de conformité.</p>
        <p>Les pièces proposées à l'achat en ligne sont le plus souvent uniques : la vente est conclue dans la limite des stocks disponibles. Si, malgré nos précautions, une création n'était plus disponible après votre paiement, vous en seriez informé sans délai et intégralement remboursé sous 14 jours au plus tard, sauf si vous préférez une création équivalente.</p>
        <p>Les créations personnalisées (prénom, date, message, couleurs ou composition à votre demande) ne sont pas vendues directement en ligne : elles font l'objet d'un échange et d'un devis préalables via la page <Link to="/personnalisation" className={lnk}>Personnalisation</Link>.</p>
      </div>
    )},
    { id: 'prix', title: '4. Prix', children: (
      <div className="space-y-3">
        <p>Les prix sont indiqués en euros, toutes taxes comprises. {i.vatFranchise || !i.vatNumber ? 'L’atelier bénéficie de la franchise en base de TVA (TVA non applicable, article 293 B du CGI).' : ''}</p>
        <p>Les frais de livraison s'ajoutent au prix de la création{i.shippingFee ? ` (${i.shippingFee} par commande en France métropolitaine)` : ''} ; leur montant est affiché sur la fiche de la création et récapitulé avant le paiement. L'atelier peut modifier ses prix à tout moment ; la création est facturée au prix affiché lors de la validation de la commande.</p>
      </div>
    )},
    { id: 'commande', title: '5. Commande', children: (
      <div className="space-y-3">
        <p>Pour commander, le client clique sur « Acheter cette création » sur la fiche de la création. Il est dirigé vers une page de paiement sécurisée où il indique ses coordonnées et son adresse de livraison, vérifie le récapitulatif (création, prix, frais de livraison, total) et peut corriger ses informations avant de valider.</p>
        <p>Le contrat est conclu au moment où le paiement est accepté. Un e-mail de confirmation récapitulant la commande est alors envoyé au client. L'atelier conserve une trace de la commande et la tient à disposition du client sur simple demande.</p>
      </div>
    )},
    { id: 'paiement', title: '6. Paiement', children: (
      <div className="space-y-3">
        <p>{has(i.s, 'ecommerce_payment_methods') ? val(i.s, 'ecommerce_payment_methods') : 'Le paiement s’effectue par carte bancaire (CB, Visa, Mastercard…) ou par les moyens proposés sur la page de paiement, au moment de la commande.'}</p>
        <p>Le paiement est traité par Stripe, prestataire de paiement agréé. Les données bancaires sont chiffrées et ne transitent jamais par le site ni par l'atelier, qui n'y a pas accès.</p>
      </div>
    )},
    { id: 'livraison', title: '7. Livraison', children: (
      <p>Les créations sont livrées à l'adresse indiquée lors de la commande, en France métropolitaine. Les délais, frais et conditions sont précisés dans la <Link to="/livraison" className={lnk}>politique de livraison</Link>. Sauf délai indiqué, la livraison intervient au plus tard 30 jours après la commande. Les risques de perte ou d'endommagement vous sont transférés lorsque vous (ou la personne désignée par vous) prenez physiquement possession de la création.</p>
    )},
    { id: 'retractation', title: '8. Droit de rétractation', children: (
      <p>Vous disposez de 14 jours à compter de la réception de la création pour vous rétracter, sans avoir à vous justifier. Les modalités, les exceptions et le formulaire type figurent sur les pages <Link to="/droit-de-retractation" className={lnk}>Droit de rétractation</Link>, <Link to="/retours-remboursements" className={lnk}>Retours et remboursements</Link> et <Link to="/formulaire-retractation" className={lnk}>Formulaire de rétractation</Link>.</p>
    )},
    { id: 'garanties', title: '9. Garanties légales', children: (
      <div className="space-y-3">
        <p>Toutes les créations bénéficient, indépendamment du droit de rétractation :</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>de la garantie légale de conformité</strong> (articles L217-3 et suivants du Code de la consommation) : vous disposez de 2 ans à compter de la livraison pour la mettre en œuvre. Vous pouvez demander la réparation ou le remplacement de la création ; si cela est impossible, vous obtenez une réduction du prix ou le remboursement contre restitution. Les défauts apparus dans les 2 ans sont présumés exister au moment de la livraison.</li>
          <li><strong>de la garantie des vices cachés</strong> (articles 1641 à 1649 du Code civil) : vous disposez de 2 ans à compter de la découverte du vice pour demander la réduction du prix ou l'annulation de la vente.</li>
        </ul>
        <p>Pour toute réclamation, écrivez à <a className={lnk} href={`mailto:${i.email}`}>{i.email}</a> en joignant si possible une photo.</p>
      </div>
    )},
    { id: 'responsabilite', title: '10. Utilisation des créations', children: <p>Les créations sont des objets de décoration. Elles ne sont pas des jouets et contiennent parfois de petites pièces ou du fil de fer : tenez-les hors de portée des jeunes enfants. Les galets et le papier craignent l'humidité prolongée : préférez un usage intérieur, sauf indication contraire sur la fiche.</p> },
    { id: 'propriete', title: '11. Propriété intellectuelle', children: <p>Les créations, leurs modèles, les photographies et textes du site restent la propriété de {i.name}. L'achat d'une création n'emporte aucune cession de droits permettant sa reproduction.</p> },
    { id: 'donnees', title: '12. Données personnelles', children: <p>Les données nécessaires à la commande (nom, adresse, e-mail, téléphone) sont utilisées uniquement pour la traiter, la livrer et respecter nos obligations comptables. Elles ne sont jamais revendues. Vos droits sont détaillés dans la <Link to="/politique-confidentialite" className={lnk}>politique de confidentialité</Link>.</p> },
    { id: 'mediation', title: '13. Réclamations et médiation', children: <MediatorBlock /> },
    { id: 'droit', title: '14. Droit applicable', children: <p>Les présentes CGV sont soumises au droit français. À défaut de solution amiable, le litige est porté devant la juridiction compétente selon les règles de droit commun ; le consommateur peut saisir, à son choix, la juridiction du lieu où il demeurait au moment de la conclusion du contrat ou de la survenance du fait dommageable.</p> },
  ];
  return <LegalPage title="Conditions générales de vente" breadcrumb="CGV" description="Conditions générales de vente des créations faites main de L'Atelier d'Isabelle (Vosges) : commande, paiement sécurisé, livraison, rétractation et garanties." sections={sections} updatedAt={fmtDate(val(i.s, 'ecommerce_cgv_date')) || '3 novembre 2026'} printable />;
}

export function ShippingPage() {
  const i = useSaleInfo();
  const sections = [
    { id: 'zones', title: 'Zones de livraison', children: <p>{has(i.s, 'ecommerce_delivery_zones') ? val(i.s, 'ecommerce_delivery_zones') : 'Les commandes en ligne sont livrées en France métropolitaine (Corse incluse). Pour un envoi vers les DOM-TOM ou l’étranger, écrivez-nous avant de commander : nous vous proposerons une solution.'}</p> },
    { id: 'frais', title: 'Frais de livraison', children: (
      <div className="space-y-3">
        <p>{has(i.s, 'ecommerce_shipping_fees') ? val(i.s, 'ecommerce_shipping_fees') : i.shippingFee ? `Les frais de livraison s’élèvent à ${i.shippingFee} par commande.` : 'Les frais de livraison sont indiqués sur la fiche de chaque création.'} Ils sont affichés sur la fiche de la création et dans le récapitulatif avant paiement.</p>
        {i.shippingNote && <p>{i.shippingNote}</p>}
      </div>
    )},
    { id: 'transport', title: 'Mode d’envoi', children: <p>{has(i.s, 'ecommerce_carriers') ? val(i.s, 'ecommerce_carriers') : 'Les créations sont expédiées par La Poste (Colissimo) ou un transporteur équivalent, avec suivi. Le numéro de suivi vous est communiqué par e-mail lors de l’expédition.'}</p> },
    { id: 'emballage', title: 'Emballage', children: <p>Chaque création est soigneusement protégée et emballée à la main à l'atelier, pour voyager sans risque et pouvoir être offerte directement.</p> },
    { id: 'delais', title: 'Délais', children: (
      <div className="space-y-3">
        <p><strong>Préparation :</strong> {has(i.s, 'ecommerce_prep_time') ? val(i.s, 'ecommerce_prep_time') : 'les créations disponibles sont expédiées sous 2 à 5 jours ouvrés après le paiement. Les créations « fabriquées à la commande » nécessitent un délai de réalisation indiqué sur leur fiche ou communiqué par e-mail.'}</p>
        <p><strong>Acheminement :</strong> {has(i.s, 'ecommerce_delivery_time') ? val(i.s, 'ecommerce_delivery_time') : 'comptez en général 2 à 4 jours ouvrés en France métropolitaine.'}</p>
        <p>En tout état de cause, la livraison intervient au plus tard 30 jours après la commande. À défaut, vous pouvez nous mettre en demeure de livrer dans un délai supplémentaire raisonnable, puis résoudre la vente et être remboursé (articles L216-1 et suivants du Code de la consommation).</p>
      </div>
    )},
    { id: 'reception', title: 'Réception, colis abîmé ou perdu', children: (
      <div className="space-y-3">
        <p>À la réception, vérifiez l'état du colis. S'il est endommagé, vous pouvez émettre des réserves auprès du transporteur et nous envoyer des photos du colis et de la création à <a className={lnk} href={`mailto:${i.email}`}>{i.email}</a>.</p>
        <p>Une création abîmée pendant le transport ou un colis perdu est à la charge de l'atelier : nous vous proposons une réparation, une création équivalente ou le remboursement intégral, frais de livraison compris.</p>
      </div>
    )},
  ];
  return <LegalPage title="Politique de livraison" breadcrumb="Livraison" description="Livraison des créations faites main de L'Atelier d'Isabelle depuis les Vosges : zones, frais, délais d'expédition et suivi." sections={sections} />;
}

export function ReturnsPage() {
  const i = useSaleInfo();
  const sections = [
    { id: 'principe', title: 'Une création ne vous convient pas ?', children: <p>Vous disposez de 14 jours à compter de sa réception pour nous la retourner, sans avoir à vous justifier (voir le <Link to="/droit-de-retractation" className={lnk}>droit de rétractation</Link>). Écrivez-nous d'abord : nous trouverons souvent une solution ensemble.</p> },
    { id: 'procedure', title: 'Procédure de retour', children: (
      <ol className="list-decimal pl-5 space-y-2">
        <li>Informez l'atelier de votre décision dans les 14 jours suivant la réception, par e-mail à <a className={lnk} href={`mailto:${i.email}`}>{i.email}</a> ou au moyen du <Link to="/formulaire-retractation" className={lnk}>formulaire de rétractation</Link>.</li>
        <li>Renvoyez la création, bien protégée et si possible dans son emballage d'origine, au plus tard 14 jours après nous avoir informés.</li>
        <li>Conservez la preuve de dépôt et, idéalement, le numéro de suivi.</li>
      </ol>
    )},
    { id: 'adresse', title: 'Adresse de retour', children: i.returnAddress ? <p>{i.name} — {i.returnAddress}</p> : <Missing label="Adresse de retour à compléter (Admin → Pages légales)" /> },
    { id: 'frais', title: 'Frais de retour', children: <p>{has(i.s, 'ecommerce_return_fees') ? val(i.s, 'ecommerce_return_fees') : 'Les frais de renvoi en cas de rétractation sont à votre charge. Ils sont pris en charge par l’atelier si la création est défectueuse, abîmée ou non conforme.'}</p> },
    { id: 'remboursement', title: 'Remboursement', children: (
      <div className="space-y-3">
        <p>Nous vous remboursons la totalité des sommes versées, y compris les frais de livraison initiaux (sur la base du tarif standard), au plus tard 14 jours après avoir été informés de votre rétractation. Nous pouvons différer le remboursement jusqu'à la réception de la création ou de la preuve de son expédition.</p>
        <p>Le remboursement est effectué avec le même moyen de paiement que celui utilisé pour la commande, sans frais pour vous. Une dépréciation de la création résultant de manipulations autres que celles nécessaires pour en apprécier la nature et les caractéristiques peut être déduite.</p>
      </div>
    )},
    { id: 'defaut', title: 'Création défectueuse ou non conforme', children: <p>Indépendamment du délai de rétractation, vous bénéficiez de la garantie légale de conformité (2 ans à compter de la livraison) et de la garantie des vices cachés. Contactez-nous avec une photo : réparation, remplacement ou remboursement, les frais de retour sont alors à la charge de l'atelier. Détails dans les <Link to="/conditions-generales-de-vente#garanties" className={lnk}>CGV</Link>.</p> },
  ];
  return <LegalPage title="Retours et remboursements" breadcrumb="Retours" description="Retourner une création de L'Atelier d'Isabelle : délai de 14 jours, procédure, frais et remboursement." sections={sections} />;
}

export function WithdrawalPage() {
  const i = useSaleInfo();
  const sections = [
    { id: 'principe', title: 'Votre droit', children: <p>Conformément aux articles L221-18 et suivants du Code de la consommation, vous avez le droit de vous rétracter d'un achat effectué en ligne sans donner de motif, dans un délai de <strong>14 jours</strong> à compter du jour où vous-même, ou un tiers désigné par vous (autre que le transporteur), prenez physiquement possession de la création. Lorsque le délai expire un samedi, un dimanche ou un jour férié, il est prolongé jusqu'au premier jour ouvrable suivant.</p> },
    { id: 'exercer', title: 'Comment l’exercer', children: (
      <div className="space-y-3">
        <p>Informez {i.name} de votre décision par une déclaration dénuée d'ambiguïté, avant l'expiration du délai :</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>par e-mail à <a className={lnk} href={`mailto:${i.email}`}>{i.email}</a> ;</li>
          <li>ou par courrier{i.returnAddress ? ` à ${i.name}, ${i.returnAddress}` : ''}, en utilisant si vous le souhaitez le <Link to="/formulaire-retractation" className={lnk}>formulaire type de rétractation</Link> (facultatif).</li>
        </ul>
        <p>Nous accusons réception de votre rétractation par e-mail sans délai.</p>
      </div>
    )},
    { id: 'effets', title: 'Effets de la rétractation', children: (
      <div className="space-y-3">
        <p>Vous renvoyez la création sans retard excessif et au plus tard 14 jours après nous avoir informés de votre décision. Les frais directs de renvoi sont à votre charge.</p>
        <p>Nous vous remboursons tous les paiements reçus, frais de livraison standard compris, au plus tard 14 jours à compter du jour où nous sommes informés de votre décision, avec le même moyen de paiement. Nous pouvons différer le remboursement jusqu'à la récupération de la création ou jusqu'à ce que vous ayez fourni une preuve de son expédition. Votre responsabilité n'est engagée qu'à l'égard de la dépréciation de la création résultant de manipulations autres que celles nécessaires pour établir sa nature, ses caractéristiques et son bon fonctionnement.</p>
      </div>
    )},
    { id: 'exceptions', title: 'Exceptions', children: (
      <div className="space-y-3">
        <p>Conformément à l'article L221-28, 3° du Code de la consommation, le droit de rétractation ne peut pas être exercé pour les biens <strong>confectionnés selon les spécifications du consommateur ou nettement personnalisés</strong> (prénom, date, message ou composition choisis par vous).</p>
        <p>Le caractère « fait main » d'une création ne suffit pas à écarter ce droit : les créations présentées en ligne et achetées telles quelles bénéficient pleinement du délai de 14 jours. Pour une création personnalisée, l'absence de droit de rétractation vous est rappelée et acceptée expressément avant la commande.</p>
      </div>
    )},
  ];
  return <LegalPage title="Droit de rétractation" breadcrumb="Rétractation" description="Droit de rétractation de 14 jours pour les créations achetées en ligne à L'Atelier d'Isabelle : modalités, remboursement et exceptions." sections={sections} />;
}

export function WithdrawalFormPage() {
  const i = useSaleInfo();
  const line = (label: string) => <div><p className="text-sm text-wood-deep/60">{label}</p><div className="border-b border-wood-deep/30 pb-1">&nbsp;</div></div>;
  const sections = [
    { id: 'formulaire', title: 'Formulaire type de rétractation', children: (
      <div className="space-y-6">
        <LegalAlert>
          <p>Veuillez compléter et renvoyer ce formulaire uniquement si vous souhaitez vous rétracter du contrat. Vous pouvez aussi simplement nous écrire à <a className={lnk} href={`mailto:${i.email}`}>{i.email}</a> en reprenant ces informations.</p>
        </LegalAlert>
        <div className="rounded-soft border border-wood-deep/20 p-6 space-y-4">
          <p><strong>À l'attention de :</strong> {i.name}{i.returnAddress ? `, ${i.returnAddress}` : ''} — {i.email}</p>
          <p>Je vous notifie par la présente ma rétractation du contrat portant sur la vente de la création ci-dessous :</p>
          <div className="grid sm:grid-cols-2 gap-4">{line('Création concernée')}{line('Numéro de commande (facultatif)')}</div>
          <div className="grid sm:grid-cols-2 gap-4">{line('Commandée le')}{line('Reçue le')}</div>
          <div className="grid sm:grid-cols-2 gap-4">{line('Nom et prénom')}{line('E-mail')}</div>
          {line('Adresse')}
          <div className="grid sm:grid-cols-2 gap-4">{line('Date')}{line('Signature (uniquement en cas d’envoi papier)')}</div>
        </div>
      </div>
    )},
  ];
  return <LegalPage title="Formulaire de rétractation" breadcrumb="Formulaire de rétractation" description="Formulaire type de rétractation (article R221-1 du Code de la consommation) à imprimer ou recopier par e-mail." sections={sections} printable />;
}
