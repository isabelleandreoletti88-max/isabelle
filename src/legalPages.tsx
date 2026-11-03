import { Link } from 'react-router-dom';
import { Scale, Shield, Cookie, FileText, MessageSquare, ShoppingBag, Truck, RotateCcw, FileCheck } from 'lucide-react';
import { LegalPage, LegalTable, LegalAlert, LegalEmpty } from '@/components/LegalPage';
import { useLegalSettings } from '@/lib/legalService';

type S = Record<string, string>;
function val(settings: S, key: string): string { return settings[key] || ''; }
function has(settings: S, key: string): boolean { return Boolean(settings[key]); }
function fmtDate(iso: string): string { if (!iso) return ''; try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return iso; } }

export function LegalHubPage() {
  const { settings, loading } = useLegalSettings();
  const ecommerceEnabled = val(settings, 'ecommerce_enabled') === 'true';
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
              <h2 className="text-sm font-semibold uppercase tracking-wider text-terracotta mb-4">Vente en ligne {ecommerceEnabled ? '' : '(à venir)'}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ecommerceDocs.map((item) => (
                  <Link key={item.to} to={item.to} className={`group rounded-soft border p-5 transition-all ${ecommerceEnabled ? 'border-wood-deep/10 bg-off-white hover:border-terracotta/40 hover:shadow-soft' : 'border-wood-deep/5 bg-beige/20 opacity-60'}`}>
                    <item.icon className="h-6 w-6 text-terracotta mb-3" />
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-wood-deep/60 mt-1">{item.desc}</p>
                  </Link>
                ))}
              </div>
              {!ecommerceEnabled && <p className="mt-4 text-sm text-wood-deep/50">Ces documents sont en préparation. Ils seront activés lors de l'ouverture de la vente en ligne.</p>}
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

export function CgvPage() {
  const { settings: s } = useLegalSettings();
  const enabled = val(s, 'ecommerce_enabled') === 'true';
  if (!enabled) {
    return <LegalPage title="Conditions générales de vente" breadcrumb="CGV" description="Ce document est en préparation. Il sera activé lors de l'ouverture de la vente en ligne." sections={[{ id: 'preparation', title: 'Document en préparation', children: <p>Les conditions générales de vente seront applicables aux commandes passées en ligne. En attendant, les échanges avec l'atelier restent régis par les <Link to="/informations-commerciales" className="text-terracotta hover:underline">informations commerciales</Link>.</p> }]} />;
  }
  const sections = [
    { id: 'vendeur', title: 'Identité du vendeur', children: <p>{val(s, 'editor_trade_name')} — {val(s, 'editor_address')}</p> },
    { id: 'objet', title: 'Objet et champ d\'application', children: <p>Les présentes conditions s'appliquent à la vente en ligne des créations proposées sur le site.</p> },
    { id: 'prix', title: 'Prix', children: <p>Les prix sont indiqués en euros, TVA comprise le cas échéant. Le régime de TVA applicable est celui de l'éditeur.</p> },
    { id: 'commande', title: 'Commande', children: <p>La commande est validée après acceptation des présentes conditions et confirmation par l'atelier.</p> },
    { id: 'paiement', title: 'Paiement', children: has(s, 'ecommerce_payment_methods') ? <p>{val(s, 'ecommerce_payment_methods')}</p> : <LegalAlert><LegalEmpty label="Moyens de paiement à compléter" /></LegalAlert> },
    { id: 'livraison', title: 'Livraison', children: <p>Voir la <Link to="/livraison" className="text-terracotta hover:underline">politique de livraison</Link>.</p> },
    { id: 'retractation', title: 'Droit de rétractation', children: <p>Voir le <Link to="/droit-de-retractation" className="text-terracotta hover:underline">droit de rétractation</Link> et le <Link to="/formulaire-retractation" className="text-terracotta hover:underline">formulaire type</Link>.</p> },
    { id: 'garanties', title: 'Garanties légales', children: <p>Les créations bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés.</p> },
    { id: 'mediation', title: 'Médiation', children: <p>Voir la page <Link to="/mediation-consommation" className="text-terracotta hover:underline">Médiation de la consommation</Link>.</p> },
    { id: 'droit', title: 'Droit applicable', children: <p>Les présentes conditions sont soumises au droit français.</p> },
  ];
  return <LegalPage title="Conditions générales de vente" breadcrumb="CGV" sections={sections} updatedAt={fmtDate(val(s, 'ecommerce_cgv_date'))} />;
}

export function ShippingPage() {
  const { settings: s } = useLegalSettings();
  const enabled = val(s, 'ecommerce_enabled') === 'true';
  if (!enabled) {
    return <LegalPage title="Politique de livraison" breadcrumb="Livraison" description="Cette page sera activée lors de l'ouverture de la vente en ligne." sections={[{ id: 'preparation', title: 'Document en préparation', children: <p>Les informations de livraison seront présentées ici.</p> }]} />;
  }
  const sections = [
    { id: 'zones', title: 'Zones desservies', children: has(s, 'ecommerce_delivery_zones') ? <p>{val(s, 'ecommerce_delivery_zones')}</p> : <LegalAlert><LegalEmpty label="Zones de livraison à compléter" /></LegalAlert> },
    { id: 'modes', title: 'Modes de livraison', children: has(s, 'ecommerce_carriers') ? <p>{val(s, 'ecommerce_carriers')}</p> : <LegalAlert><LegalEmpty label="Transporteurs à compléter" /></LegalAlert> },
    { id: 'frais', title: 'Frais de livraison', children: has(s, 'ecommerce_shipping_fees') ? <p>{val(s, 'ecommerce_shipping_fees')}</p> : <LegalAlert><LegalEmpty label="Frais de livraison à compléter" /></LegalAlert> },
    { id: 'delais', title: 'Délais', children: (
      <div className="space-y-3">
        {has(s, 'ecommerce_prep_time') && <p><strong>Préparation :</strong> {val(s, 'ecommerce_prep_time')}</p>}
        {has(s, 'ecommerce_delivery_time') && <p><strong>Livraison :</strong> {val(s, 'ecommerce_delivery_time')}</p>}
      </div>
    )},
    { id: 'reception', title: 'Réception et incidents', children: <p>En cas de colis endommagé ou perdu, contactez l'atelier dans les meilleurs délais.</p> },
  ];
  return <LegalPage title="Politique de livraison" breadcrumb="Livraison" sections={sections} />;
}

export function ReturnsPage() {
  const { settings: s } = useLegalSettings();
  const enabled = val(s, 'ecommerce_enabled') === 'true';
  if (!enabled) {
    return <LegalPage title="Retours et remboursements" breadcrumb="Retours" description="Cette page sera activée lors de l'ouverture de la vente en ligne." sections={[{ id: 'preparation', title: 'Document en préparation', children: <p>La politique de retours sera présentée ici.</p> }]} />;
  }
  const sections = [
    { id: 'procedure', title: 'Procédure de retour', children: <p>Consultez le <Link to="/droit-de-retractation" className="text-terracotta hover:underline">droit de rétractation</Link> pour exercer votre droit.</p> },
    { id: 'adresse', title: 'Adresse de retour', children: has(s, 'ecommerce_return_address') ? <p>{val(s, 'ecommerce_return_address')}</p> : <LegalAlert><LegalEmpty label="Adresse de retour à compléter" /></LegalAlert> },
    { id: 'frais', title: 'Frais de retour', children: has(s, 'ecommerce_return_fees') ? <p>{val(s, 'ecommerce_return_fees')}</p> : <LegalAlert><LegalEmpty label="Frais de retour à compléter" /></LegalAlert> },
    { id: 'remboursement', title: 'Remboursement', children: <p>Le remboursement intervient dans les conditions légales applicables.</p> },
    { id: 'garanties', title: 'Garanties légales', children: <p>Les créations bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés. Ces garanties ne peuvent être réduites par l'atelier.</p> },
  ];
  return <LegalPage title="Retours et remboursements" breadcrumb="Retours" sections={sections} />;
}

export function WithdrawalPage() {
  const { settings: s } = useLegalSettings();
  const enabled = val(s, 'ecommerce_enabled') === 'true';
  if (!enabled) {
    return <LegalPage title="Droit de rétractation" breadcrumb="Rétractation" description="Cette page sera activée lors de l'ouverture de la vente en ligne." sections={[{ id: 'preparation', title: 'Document en préparation', children: <p>Les informations sur le droit de rétractation seront présentées ici.</p> }]} />;
  }
  const sections = [
    { id: 'principe', title: 'Principe', children: <p>Conformément à l'article L221-18 du Code de la consommation, vous disposez d'un délai de rétractation.</p> },
    { id: 'standard', title: 'Créations standards', children: <p>Pour les créations standards ou non nettement personnalisées, le droit de rétractation s'applique dans les conditions légales.</p> },
    { id: 'personnalisees', title: 'Créations personnalisées', children: (
      <div className="space-y-3">
        <p>Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation peut ne pas s'appliquer aux biens confectionnés selon les spécifications du consommateur ou nettement personnalisés.</p>
        <p>La simple mention « fait main » ne suffit pas à supprimer le droit de rétractation. L'exception ne s'applique qu'aux créations réellement confectionnées selon vos spécifications ou nettement personnalisées.</p>
        <p>Lors de la validation d'une commande personnalisée, il vous sera demandé de reconnaître expressément que le droit de rétractation ne s'applique pas à cette création précise.</p>
      </div>
    )},
    { id: 'formulaire', title: 'Formulaire', children: <p>Un <Link to="/formulaire-retractation" className="text-terracotta hover:underline">formulaire type de rétractation</Link> est disponible.</p> },
  ];
  return <LegalPage title="Droit de rétractation" breadcrumb="Rétractation" sections={sections} />;
}

export function WithdrawalFormPage() {
  const { settings: s } = useLegalSettings();
  const enabled = val(s, 'ecommerce_enabled') === 'true';
  if (!enabled) {
    return <LegalPage title="Formulaire de rétractation" breadcrumb="Formulaire de rétractation" description="Ce formulaire sera activé lors de l'ouverture de la vente en ligne." sections={[{ id: 'preparation', title: 'Document en préparation', children: <p>Le formulaire type de rétractation sera disponible ici.</p> }]} />;
  }
  const sections = [
    { id: 'formulaire', title: 'Formulaire type de rétractation', children: (
      <div className="space-y-6">
        <LegalAlert>
          <p>Imprimez ce formulaire, complétez-le et adressez-le à {val(s, 'editor_trade_name')}{has(s, 'ecommerce_return_address') ? ` — ${val(s, 'ecommerce_return_address')}` : ''}.</p>
        </LegalAlert>
        <div className="rounded-soft border border-wood-deep/20 p-6 space-y-4">
          <p><strong>Destinataire :</strong> {val(s, 'editor_trade_name')}{has(s, 'editor_address') ? `, ${val(s, 'editor_address')}` : ''}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><p className="text-sm text-wood-deep/60">Nom du consommateur</p><div className="border-b border-wood-deep/30 pb-1">&nbsp;</div></div>
            <div><p className="text-sm text-wood-deep/60">Prénom</p><div className="border-b border-wood-deep/30 pb-1">&nbsp;</div></div>
          </div>
          <div><p className="text-sm text-wood-deep/60">Adresse</p><div className="border-b border-wood-deep/30 pb-1">&nbsp;</div></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><p className="text-sm text-wood-deep/60">Numéro de commande</p><div className="border-b border-wood-deep/30 pb-1">&nbsp;</div></div>
            <div><p className="text-sm text-wood-deep/60">Produit concerné</p><div className="border-b border-wood-deep/30 pb-1">&nbsp;</div></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><p className="text-sm text-wood-deep/60">Date de commande</p><div className="border-b border-wood-deep/30 pb-1">&nbsp;</div></div>
            <div><p className="text-sm text-wood-deep/60">Date de réception</p><div className="border-b border-wood-deep/30 pb-1">&nbsp;</div></div>
          </div>
          <p className="pt-2">Je déclare me rétracter du contrat ci-dessus.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><p className="text-sm text-wood-deep/60">Date</p><div className="border-b border-wood-deep/30 pb-1">&nbsp;</div></div>
            <div><p className="text-sm text-wood-deep/60">Signature (version papier)</p><div className="border-b border-wood-deep/30 pb-1">&nbsp;</div></div>
          </div>
        </div>
      </div>
    )},
  ];
  return <LegalPage title="Formulaire de rétractation" breadcrumb="Formulaire de rétractation" sections={sections} printable />;
}
