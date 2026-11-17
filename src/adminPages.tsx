import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, PenLine, ArrowLeft, ArrowRight, Check, CreditCard, ImagePlus, Mail, Phone, Plus, Printer, RotateCcw, Star, Store, Trash2, Truck, X } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import { supabase } from '@/lib/supabase';
import { AdminTitle, Field, Notice, Panel } from '@/components/adminUi';
import { editablePages } from '@/config/editableContent';
import { settingsDefaults, type SiteSettings } from '@/lib/siteData';
import { productImageAlt } from '@/lib/seo';
import {
  deleteFaq, deleteMaterial, fetchAdminFaqs, fetchAdminMaterials, saveFaq, fetchOrders, fetchSettings, fetchStripeStatus, fetchTexts, resendOrderEmail, resetText, saveMaterial, saveSettings, saveText, updateOrder, uploadImage,
  type FaqRow, type FulfillmentStatus, type GalleryImage, type MaterialRow, type OrderAddress, type OrderRow, type PaymentStatus, type StripeStatus,
} from '@/lib/adminService';

// --- Paramètres : coordonnées affichées sur le site ---

const settingFields: { key: keyof SiteSettings; label: string; help?: string; multiline?: boolean }[] = [
  { key: 'brand_name', label: 'Nom de l’atelier' },
  { key: 'slogan', label: 'Signature', help: 'Affichée dans le pied de page.' },
  { key: 'footer_text', label: 'Texte du pied de page', multiline: true },
  { key: 'email', label: 'Adresse e-mail de contact' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'city', label: 'Villes', help: 'Par exemple « Saint-Dié-des-Vosges et Raon-l’Étape ».' },
  { key: 'region', label: 'Région' },
  { key: 'hours', label: 'Où rencontrer l’atelier', multiline: true },
  { key: 'facebook', label: 'Page Facebook (adresse complète)' },
  { key: 'instagram', label: 'Compte Instagram (adresse complète)', help: 'Laissez vide pour ne pas afficher Instagram.' },
];

export function AdminSettings() {
  const [values, setValues] = useState<SiteSettings>(settingsDefaults);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings(settingFields.map((field) => field.key))
      .then((saved) => setValues((current) => {
        const next = { ...current };
        for (const [key, value] of Object.entries(saved)) if (value || key === 'instagram') next[key as keyof SiteSettings] = value;
        return next;
      }))
      .catch(() => setError('Impossible de charger les paramètres.'));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError(''); setMessage('');
    try {
      // Les réglages de la boutique ont leur propre formulaire : seules les coordonnées sont enregistrées ici.
      await saveSettings(Object.fromEntries(settingFields.map(({ key }) => [key, values[key]])));
      setMessage('Les paramètres ont bien été enregistrés. Ils apparaissent sur le site au prochain chargement de page.');
    } catch { setError('Les paramètres n’ont pas pu être enregistrés.'); }
    finally { setSaving(false); }
  }

  return <>
    <AdminTitle title="Paramètres" description="Les coordonnées et liens affichés dans le pied de page, la page Contact et les données lues par Google." />
    {error && <Notice text={error} error />}
    {message && <Notice text={message} />}
    <form onSubmit={submit} className="bg-off-white rounded-soft shadow-soft p-5 sm:p-6 max-w-3xl">
      <div className="grid sm:grid-cols-2 gap-x-4">
        {settingFields.map(({ key, label, help, multiline }) => (
          <div key={key} className={multiline ? 'sm:col-span-2' : ''}>
            <Field label={label}>
              {multiline
                ? <textarea className="input-field min-h-20" value={values[key]} onChange={(event) => setValues({ ...values, [key]: event.target.value })} />
                : <input className="input-field" value={values[key]} onChange={(event) => setValues({ ...values, [key]: event.target.value })} />}
              {help && <span className="block text-xs text-wood-deep/50 mt-1">{help}</span>}
            </Field>
          </div>
        ))}
      </div>
      <button className="btn-primary" disabled={saving}><Check className="h-4 w-4" />{saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}</button>
    </form>
    <ShopSettings />
    <ReviewsSettings />
  </>;
}

// --- Textes du site ---

function withoutKey(record: Record<string, string>, key: string) {
  const next = { ...record };
  delete next[key];
  return next;
}

export function AdminTexts() {
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [page, setPage] = useState(editablePages[0].page);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { fetchTexts().then(setSaved).catch(() => setError('Impossible de charger les textes.')); }, []);

  const current = editablePages.find((item) => item.page === page) ?? editablePages[0];

  async function save(key: string, multiline?: boolean) {
    const value = (drafts[key] ?? '').trim();
    if (!value) return;
    setBusy(key); setError(''); setMessage('');
    try {
      await saveText(key, value, multiline);
      setSaved((all) => ({ ...all, [key]: value }));
      setDrafts((all) => withoutKey(all, key));
      setMessage('Le texte a bien été enregistré.');
    } catch { setError('Le texte n’a pas pu être enregistré.'); }
    finally { setBusy(null); }
  }

  async function reset(key: string) {
    if (!window.confirm('Revenir au texte d’origine ?')) return;
    setBusy(key); setError(''); setMessage('');
    try {
      await resetText(key);
      setSaved((all) => withoutKey(all, key));
      setDrafts((all) => withoutKey(all, key));
      setMessage('Le texte d’origine est rétabli.');
    } catch { setError('Le texte n’a pas pu être réinitialisé.'); }
    finally { setBusy(null); }
  }

  return <>
    <AdminTitle title="Textes du site" description="Modifiez les titres et paragraphes des pages. Un texte jamais modifié garde sa version d’origine." />
    {error && <Notice text={error} error />}
    {message && <Notice text={message} />}
    <div className="flex flex-wrap gap-2 mb-6">
      {editablePages.map((item) => <button key={item.page} type="button" onClick={() => setPage(item.page)} className={item.page === page ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>{item.label}</button>)}
    </div>
    <div className="space-y-4 max-w-4xl">
      {current.texts.map((text) => {
        const custom = saved[text.key];
        const value = drafts[text.key] ?? custom ?? text.default;
        const dirty = drafts[text.key] !== undefined && drafts[text.key] !== (custom ?? text.default);
        return <div key={text.key} className="bg-off-white rounded-soft shadow-soft p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="label-field mb-0">{text.label}</span>
            <span className={custom ? 'badge-sage' : 'badge-wood'}>{custom ? 'Personnalisé' : 'Texte d’origine'}</span>
          </div>
          {text.multiline
            ? <textarea className="input-field min-h-24" value={value} onChange={(event) => setDrafts({ ...drafts, [text.key]: event.target.value })} />
            : <input className="input-field" value={value} onChange={(event) => setDrafts({ ...drafts, [text.key]: event.target.value })} />}
          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" className="btn-primary text-sm" disabled={!dirty || !value.trim() || busy === text.key} onClick={() => void save(text.key, text.multiline)}><Check className="h-4 w-4" />Enregistrer</button>
            {custom && <button type="button" className="btn-secondary text-sm" disabled={busy === text.key} onClick={() => void reset(text.key)}><RotateCcw className="h-4 w-4" />Revenir au texte d’origine</button>}
          </div>
        </div>;
      })}
    </div>
  </>;
}

// --- Matières ---

const emptyMaterial: Partial<MaterialRow> & { name: string } = { name: '', slug: '', description: '', image: null, display_order: 0, published: true };

export function AdminMaterials() {
  const [items, setItems] = useState<MaterialRow[]>([]);
  const [draft, setDraft] = useState<(Partial<MaterialRow> & { name: string }) | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { fetchAdminMaterials().then(setItems).catch(() => setError('Impossible de charger les matières.')); }, []);

  /** Ouvre le formulaire et le fait apparaître à l'écran (il est sous la liste sur téléphone). */
  function openDraft(next: Partial<MaterialRow> & { name: string }) {
    setDraft(next);
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  /** Remplace la photo d'une matière en un clic : import, conversion WebP et enregistrement. */
  async function changePhoto(item: MaterialRow, file: File) {
    setUploadingId(item.id); setError(''); setMessage('');
    try {
      const uploaded = await uploadImage(file, 'site-images', 'matieres', `matiere-${item.name}`);
      const savedRow = await saveMaterial({ ...item, image: uploaded.url });
      setItems((all) => all.map((entry) => entry.id === savedRow.id ? savedRow : entry));
      if (draft?.id === item.id) setDraft({ ...draft, image: uploaded.url });
      setMessage(`La photo « ${item.name} » a été remplacée. Elle est déjà visible sur le site.`);
    } catch { setError('La photo n’a pas pu être importée. Vérifiez qu’il s’agit bien d’une image (JPG, PNG, WebP…).'); }
    finally { setUploadingId(null); }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft?.name.trim()) return;
    setError(''); setMessage('');
    try {
      const savedRow = await saveMaterial(draft);
      setItems((all) => (draft.id ? all.map((item) => item.id === savedRow.id ? savedRow : item) : [...all, savedRow]).sort((a, b) => a.display_order - b.display_order));
      setDraft(null);
      setMessage('La matière a bien été enregistrée.');
    } catch { setError('La matière n’a pas pu être enregistrée.'); }
  }

  async function remove(item: MaterialRow) {
    if (!window.confirm(`Supprimer « ${item.name} » ?`)) return;
    try { await deleteMaterial(item.id); setItems((all) => all.filter((entry) => entry.id !== item.id)); }
    catch { setError('La matière n’a pas pu être supprimée.'); }
  }

  return <>
    <AdminTitle title="Matières" description="Les matières présentées sur l’accueil et la page « L’atelier » : photo, nom et texte." action={<button className="btn-primary" onClick={() => openDraft({ ...emptyMaterial, display_order: items.length + 1 })}><Plus className="h-4 w-4" />Ajouter</button>} />
    {error && <Notice text={error} error />}
    {message && <Notice text={message} />}
    <div className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((item) => <div key={item.id} className="bg-off-white rounded-soft shadow-soft overflow-hidden">
          <div className="aspect-[4/3] bg-beige/20">{item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-wood-deep/30"><ImagePlus className="h-8 w-8" /></div>}</div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2"><p className="font-medium">{item.name}</p>{!item.published && <span className="badge-wood">Masquée</span>}</div>
            <p className="text-sm text-wood-deep/60 mt-1 line-clamp-3">{item.description}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <label className={`btn-primary text-sm cursor-pointer ${uploadingId === item.id ? 'opacity-60 pointer-events-none' : ''}`}>
                <ImagePlus className="h-4 w-4" />{uploadingId === item.id ? 'Import…' : 'Changer la photo'}
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void changePhoto(item, file); }} />
              </label>
              <button className="btn-secondary text-sm" onClick={() => openDraft({ ...item })}>Modifier</button>
              <button className="h-10 w-10 inline-flex items-center justify-center text-wood-deep/60 hover:text-red-700" onClick={() => void remove(item)} aria-label={`Supprimer ${item.name}`}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        </div>)}
      </div>
      {draft && <form ref={formRef} onSubmit={save} className="bg-off-white rounded-soft shadow-soft p-5 xl:sticky xl:top-24 scroll-mt-20">
        <h2 className="text-xl font-medium mb-4">{draft.id ? 'Modifier la matière' : 'Nouvelle matière'}</h2>
        <ImageUploader label="Photo" value={draft.image || null} onChange={(url) => setDraft({ ...draft, image: url })} bucket="site-images" folder="matieres" shape="wide" baseName={`matiere-${draft.name}`} />
        <div className="mt-4" />
        <Field label="Nom" required><input className="input-field" required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
        <Field label="Texte"><textarea className="input-field min-h-28" value={draft.description || ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></Field>
        <Field label="Ordre d’affichage"><input className="input-field" type="number" min="0" value={draft.display_order ?? 0} onChange={(event) => setDraft({ ...draft, display_order: Number(event.target.value) })} /></Field>
        <label className="flex gap-3 items-center text-sm mb-5"><input type="checkbox" className="accent-terracotta" checked={draft.published ?? true} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} />Afficher sur le site</label>
        <div className="flex gap-3"><button type="button" className="btn-secondary flex-1" onClick={() => setDraft(null)}>Annuler</button><button className="btn-primary flex-1"><Check className="h-4 w-4" />Enregistrer</button></div>
      </form>}
    </div>
  </>;
}

// --- Galerie photos d'une création ---

type GalleryProps = {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  onRemove: (image: GalleryImage) => void;
  productName: string;
  productSlug: string;
  material?: string;
};

/** Plusieurs photos par création : la première est la photo principale (liste, partage, Google). */
export function ProductGalleryEditor({ images, onChange, onRemove, productName, productSlug, material }: GalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const defaultAlt = useMemo(() => productImageAlt(productName || 'Création', material), [productName, material]);

  async function addFiles(files: FileList) {
    setUploading(true); setError('');
    const added: GalleryImage[] = [];
    try {
      for (const file of Array.from(files)) {
        const uploaded = await uploadImage(file, 'product-images', 'catalogue', productSlug || productName);
        added.push({ storage_path: uploaded.path, public_url: uploaded.url, alt_text: defaultAlt, display_order: 0, is_main: false });
      }
    } catch { setError('Une photo n’a pas pu être importée (JPG, PNG ou WebP de 8 Mo maximum).'); }
    finally {
      setUploading(false);
      if (added.length) onChange([...images, ...added]);
    }
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return <div>
    {error && <Notice text={error} error />}
    {images.length === 0 && <p className="text-sm text-wood-deep/60 mb-4">Aucune photo pour l’instant. La première photo ajoutée sera la photo principale.</p>}
    <div className="grid sm:grid-cols-2 gap-4">
      {images.map((image, index) => <div key={image.id || image.public_url} className={`rounded-soft border p-3 ${index === 0 ? 'border-terracotta/60 bg-terracotta/5' : 'border-wood-deep/10'}`}>
        <div className="relative">
          <img src={image.public_url} alt={image.alt_text} className="w-full aspect-square object-cover rounded-soft" />
          {index === 0 && <span className="absolute top-2 left-2 bg-terracotta text-off-white text-xs px-2 py-1 rounded-soft inline-flex items-center gap-1"><Star className="h-3 w-3" />Photo principale</span>}
        </div>
        <label className="block mt-3"><span className="text-xs text-wood-deep/60">Description de la photo (pour Google et l’accessibilité)</span>
          <input className="input-field text-sm mt-1" value={image.alt_text} onChange={(event) => onChange(images.map((item, i) => i === index ? { ...item, alt_text: event.target.value } : item))} />
        </label>
        <div className="flex flex-wrap gap-1 mt-3">
          <button type="button" className="h-10 w-10 inline-flex items-center justify-center rounded-soft hover:bg-beige/40 disabled:opacity-30" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Déplacer vers la gauche"><ArrowLeft className="h-4 w-4" /></button>
          <button type="button" className="h-10 w-10 inline-flex items-center justify-center rounded-soft hover:bg-beige/40 disabled:opacity-30" disabled={index === images.length - 1} onClick={() => move(index, 1)} aria-label="Déplacer vers la droite"><ArrowRight className="h-4 w-4" /></button>
          {index > 0 && <button type="button" className="text-xs px-2 min-h-[40px] rounded-soft hover:bg-beige/40 inline-flex items-center gap-1" onClick={() => onChange([image, ...images.filter((_, i) => i !== index)])}><Star className="h-3.5 w-3.5" />Photo principale</button>}
          <button type="button" className="h-10 w-10 ml-auto inline-flex items-center justify-center rounded-soft text-wood-deep/60 hover:text-red-700" onClick={() => onRemove(image)} aria-label="Retirer la photo"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>)}
    </div>
    <label className={`btn-secondary cursor-pointer inline-flex items-center gap-2 w-fit mt-4 ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
      <ImagePlus className="h-4 w-4" />{uploading ? 'Import en cours…' : 'Ajouter des photos'}
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(event) => { if (event.target.files?.length) void addFiles(event.target.files); event.currentTarget.value = ''; }} />
    </label>
    <p className="mt-2 text-xs text-wood-deep/50">JPG, PNG ou WebP, 8 Mo maximum. Les photos sont allégées automatiquement. Pensez à enregistrer la création.</p>
  </div>;
}

// --- Vente en ligne d'une création (fiche création) ---

type ShopPanelProps = { sellOnline: boolean; onChange: (value: boolean) => void; price: number | null; availability: string; published: boolean; stock: number | null; onStockChange: (value: number | null) => void };

export function ShopPanel({ sellOnline, onChange, price, availability, published, stock, onStockChange }: ShopPanelProps) {
  const blockers = [
    !published && 'la création n’est pas publiée',
    !(price && price > 0) && 'aucun prix n’est indiqué',
    !['available', 'made_to_order'].includes(availability) && 'elle est vendue ou indisponible',
  ].filter(Boolean) as string[];
  return <Panel title="Vente en ligne">
    <label className="flex gap-3 items-start text-sm"><input type="checkbox" className="accent-terracotta mt-0.5" checked={sellOnline} onChange={(event) => onChange(event.target.checked)} /><span>Vendre cette création en ligne<span className="block text-xs text-wood-deep/50 mt-0.5">Un bouton « Ajouter au panier » apparaît sur sa fiche. Le prix payé est toujours celui de la fiche.</span></span></label>
    {sellOnline && availability === 'available' && <div className="mt-4">
      <Field label="Quantité disponible"><input className="input-field" type="number" min="0" inputMode="numeric" placeholder="Vide = pièce unique" value={stock ?? ''} onChange={(event) => onStockChange(event.target.value === '' ? null : Math.max(0, Math.round(Number(event.target.value))))} /></Field>
      <p className="-mt-2 text-xs text-wood-deep/50">Laissez vide pour une pièce unique : elle passe « Vendue » dès qu’elle est payée. Avec une quantité, le stock diminue à chaque vente.</p>
    </div>}
    {sellOnline && availability === 'made_to_order' && <p className="mt-3 text-xs text-wood-deep/60">Fabriquée à la commande : jusqu’à 10 exemplaires par commande, sans gestion de stock.</p>}
    {sellOnline && blockers.length > 0 && <p className="mt-3 text-xs text-amber-800 bg-amber-50 rounded-soft p-2">Pas encore en vente : {blockers.join(', ')}.</p>}
    {sellOnline && blockers.length === 0 && <p className="mt-3 rounded-soft bg-sage/10 p-2 text-xs text-sage-dark flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />En vente dès que la boutique est ouverte (Paramètres).</p>}
  </Panel>;
}

// --- Ouverture de la boutique et connexion Stripe (page Paramètres) ---

export function ShopSettings() {
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [enabled, setEnabled] = useState('false');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchStripeStatus().then(setStatus).catch((e) => setStatus({ configured: false, error: (e as Error).message }));
    fetchSettings(['shop_enabled']).then((saved) => setEnabled(saved.shop_enabled || 'false')).catch(() => setError('Impossible de charger les réglages de la boutique.'));
  }, []);

  async function save(next: string) {
    if (next === 'true' && status?.mode === 'live' && !window.confirm('Ouvrir la boutique au public ? Les paiements seront réels.')) return;
    setBusy(true); setError(''); setMessage('');
    try { await saveSettings({ shop_enabled: next }); setEnabled(next); setMessage(next === 'true' ? 'La boutique est ouverte au public.' : 'La boutique est fermée au public.'); }
    catch { setError('Le réglage n’a pas pu être enregistré.'); }
    finally { setBusy(false); }
  }

  const ready = status?.configured && !status.error;
  return <section className="bg-off-white rounded-soft shadow-soft p-5 sm:p-6 max-w-3xl mt-8">
    <h2 className="text-xl font-medium mb-1 flex items-center gap-2"><CreditCard className="h-5 w-5 text-terracotta" />Boutique en ligne</h2>
    <p className="text-sm text-wood-deep/60 mb-5">Paiements traités par Stripe. Frais de port et retrait se règlent dans <Link to="/admin/livraison" className="text-terracotta underline">Paramètres de livraison</Link>.</p>
    {error && <Notice text={error} error />}
    {message && <Notice text={message} />}
    <div className={`rounded-soft p-4 mb-5 text-sm ${ready ? 'bg-sage/10' : 'bg-amber-50 text-amber-900'}`}>
      {!status && 'Vérification de la connexion à Stripe…'}
      {status && !status.configured && 'Stripe n’est pas encore relié : la clé secrète doit être ajoutée dans les secrets des fonctions Supabase (STRIPE_SECRET_KEY).'}
      {status?.configured && status.error && `Stripe ne répond pas correctement : ${status.error}`}
      {ready && <>Stripe est relié{status.account ? ` (compte « ${status.account} »)` : ''}. {status.mode === 'test' ? <strong>Mode test : aucun vrai paiement n’est encaissé.</strong> : <strong>Paiements réels.</strong>}{status.charges_enabled === false && ' Le compte Stripe doit encore être finalisé pour encaisser.'}</>}
    </div>
    <label className="flex gap-3 items-start text-sm"><input type="checkbox" className="accent-terracotta mt-0.5" disabled={busy} checked={enabled === 'true'} onChange={(event) => void save(event.target.checked ? 'true' : 'false')} /><span>Ouvrir la boutique en ligne au public<span className="block text-xs text-wood-deep/50 mt-0.5">Fermée, la boutique reste visible pour vous seule quand vous êtes connectée, pour tester avec une clé Stripe de test.</span></span></label>
  </section>;
}

// --- Paramètres de livraison ---

const deliveryKeys = ['shop_home_delivery_enabled', 'shop_shipping_fee', 'shop_shipping_note', 'shop_pickup_enabled', 'shop_pickup_name', 'shop_pickup_address', 'shop_pickup_instructions'] as const;
type DeliveryValues = Record<(typeof deliveryKeys)[number], string>;

export function AdminDelivery() {
  const [values, setValues] = useState<DeliveryValues>({ shop_home_delivery_enabled: 'true', shop_shipping_fee: '5.90', shop_shipping_note: '', shop_pickup_enabled: 'true', shop_pickup_name: '', shop_pickup_address: '', shop_pickup_instructions: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetchSettings([...deliveryKeys]).then((saved) => setValues((current) => ({ ...current, ...saved, shop_shipping_fee: String(saved.shop_shipping_fee ?? current.shop_shipping_fee).replace('.', ',') }))).catch(() => setError('Impossible de charger les paramètres de livraison.')); }, []);

  const fee = Number(values.shop_shipping_fee.replace(',', '.'));
  const feeValid = values.shop_shipping_fee.trim() !== '' && Number.isFinite(fee) && fee >= 0 && fee <= 100;
  const pickupMissing = values.shop_pickup_enabled === 'true' && !values.shop_pickup_address.trim();

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(''); setMessage('');
    if (values.shop_home_delivery_enabled === 'true' && !feeValid) return setError('Indiquez des frais de livraison valables, par exemple 5,90 (0 pour une livraison offerte).');
    if (values.shop_home_delivery_enabled !== 'true' && values.shop_pickup_enabled !== 'true') return setError('Gardez au moins un mode de réception activé.');
    setBusy(true);
    try {
      await saveSettings({ ...values, shop_shipping_fee: feeValid ? fee.toFixed(2) : values.shop_shipping_fee });
      setMessage('Paramètres de livraison enregistrés. Ils s’appliquent aux prochaines commandes.');
    } catch { setError('Les paramètres n’ont pas pu être enregistrés.'); }
    finally { setBusy(false); }
  }

  const toggle = (key: 'shop_home_delivery_enabled' | 'shop_pickup_enabled', label: string, help: string) => (
    <label className="flex gap-3 items-start text-sm mb-4"><input type="checkbox" className="accent-terracotta mt-0.5" checked={values[key] === 'true'} onChange={(event) => setValues({ ...values, [key]: event.target.checked ? 'true' : 'false' })} /><span className="font-medium">{label}<span className="block text-xs font-normal text-wood-deep/50 mt-0.5">{help}</span></span></label>
  );

  return <>
    <AdminTitle title="Paramètres de livraison" description="Les deux façons de recevoir une commande, proposées dans le panier." />
    {error && <Notice text={error} error />}
    {message && <Notice text={message} />}
    <form onSubmit={save} className="grid lg:grid-cols-2 gap-6 items-start max-w-5xl">
      <Panel title="Livraison à domicile">
        {toggle('shop_home_delivery_enabled', 'Proposer la livraison à domicile', 'France métropolitaine. Vous expédiez vous-même (Colissimo ou autre).')}
        <Field label="Frais de livraison par commande (€)"><input className="input-field" inputMode="decimal" value={values.shop_shipping_fee} onChange={(event) => setValues({ ...values, shop_shipping_fee: event.target.value })} placeholder="5,90" /></Field>
        <p className="-mt-2 mb-4 text-xs text-wood-deep/50">Un seul montant par commande, quel que soit le nombre d’articles. 0 = livraison offerte.</p>
        <Field label="Précision affichée (facultatif)"><textarea className="input-field min-h-20" value={values.shop_shipping_note} onChange={(event) => setValues({ ...values, shop_shipping_note: event.target.value })} placeholder="Livraison en France métropolitaine." /></Field>
      </Panel>
      <Panel title="Retrait gratuit en boutique">
        {toggle('shop_pickup_enabled', 'Proposer le retrait gratuit', 'Aucune adresse demandée au client ; il est prévenu par e-mail quand la commande est prête.')}
        <Field label="Nom du lieu de retrait"><input className="input-field" value={values.shop_pickup_name} onChange={(event) => setValues({ ...values, shop_pickup_name: event.target.value })} placeholder="La Boutik’art" /></Field>
        <Field label="Adresse complète"><textarea className="input-field min-h-20" value={values.shop_pickup_address} onChange={(event) => setValues({ ...values, shop_pickup_address: event.target.value })} placeholder={'12 rue …\n88100 Saint-Dié-des-Vosges'} /></Field>
        <Field label="Indications de retrait (horaires, consignes)"><textarea className="input-field min-h-20" value={values.shop_pickup_instructions} onChange={(event) => setValues({ ...values, shop_pickup_instructions: event.target.value })} /></Field>
        {pickupMissing && <p className="text-xs text-amber-800 bg-amber-50 rounded-soft p-2">Sans adresse, le retrait n’est pas proposé dans le panier.</p>}
      </Panel>
      <div className="lg:col-span-2"><button className="btn-primary" disabled={busy}><Check className="h-4 w-4" />{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
    </form>
  </>;
}

// --- Avis Google (page Paramètres) ---

const reviewKeys = ['reviews_enabled', 'google_review_url', 'google_place_id', 'reviews_min_rating'];
type ReviewsStatus = { configured: boolean; reason?: string; rating?: number | null; count?: number; reviews?: unknown[]; fetched_at?: string; error?: string; stale?: boolean };

export function ReviewsSettings() {
  const [values, setValues] = useState({ reviews_enabled: 'true', google_review_url: '', google_place_id: '', reviews_min_rating: '4' });
  const [status, setStatus] = useState<ReviewsStatus | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(refresh = false) {
    const { data, error: invokeError } = await supabase.functions.invoke('google-reviews', { body: { refresh } });
    setStatus(invokeError ? { configured: false, error: 'La fonction des avis ne répond pas.' } : data as ReviewsStatus);
  }
  useEffect(() => {
    fetchSettings(reviewKeys).then((saved) => setValues((current) => ({ ...current, ...saved }))).catch(() => setError('Impossible de charger les réglages des avis.'));
    void load();
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try { await saveSettings(values); await load(true); setMessage('Réglages des avis enregistrés.'); }
    catch { setError('Les réglages n’ont pas pu être enregistrés.'); }
    finally { setBusy(false); }
  }

  return <section className="bg-off-white rounded-soft shadow-soft p-5 sm:p-6 max-w-3xl mt-8">
    <h2 className="text-xl font-medium mb-1 flex items-center gap-2"><Star className="h-5 w-5 text-terracotta" />Avis Google</h2>
    <p className="text-sm text-wood-deep/60 mb-5">Section « Avis » de l’accueil : note et derniers avis de votre fiche Google, avec un bouton « Donner mon avis ». Les avis se gèrent et se répondent dans votre fiche Google.</p>
    {error && <Notice text={error} error />}
    {message && <Notice text={message} />}
    <div className={`rounded-soft p-4 mb-5 text-sm ${status?.configured && !status.error ? 'bg-sage/10' : 'bg-amber-50 text-amber-900'}`}>
      {!status && 'Vérification…'}
      {status && !status.configured && (status.reason === 'api_key' ? 'Affichage des avis pas encore relié à Google : la clé GOOGLE_PLACES_API_KEY doit être ajoutée dans les secrets des fonctions Supabase. En attendant, le site affiche l’invitation à donner un avis.' : 'Identifiant de la fiche Google manquant ou incorrect.')}
      {status?.configured && status.error && `Google ne répond pas correctement${status.error !== 'unavailable' ? ` : ${status.error}` : ''}.`}
      {status?.configured && !status.error && <>Relié à Google : note {status.rating?.toLocaleString('fr-FR') ?? '—'} sur {status.count ?? 0} avis, {status.reviews?.length ?? 0} avis récents récupérés{status.fetched_at ? ` (mis à jour le ${new Date(status.fetched_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })})` : ''}.</>}
    </div>
    <form onSubmit={save}>
      <label className="flex gap-3 items-center text-sm mb-5"><input type="checkbox" className="accent-terracotta" checked={values.reviews_enabled !== 'false'} onChange={(event) => setValues({ ...values, reviews_enabled: event.target.checked ? 'true' : 'false' })} />Afficher la section « Avis » sur l’accueil</label>
      <Field label="Lien « Donner mon avis »"><input className="input-field" type="url" value={values.google_review_url} onChange={(event) => setValues({ ...values, google_review_url: event.target.value })} placeholder="https://g.page/r/…/review" /></Field>
      <div className="grid sm:grid-cols-2 gap-x-4">
        <Field label="Identifiant de la fiche Google (Place ID)"><input className="input-field" value={values.google_place_id} onChange={(event) => setValues({ ...values, google_place_id: event.target.value.trim() })} /></Field>
        <Field label="Avis affichés"><select className="input-field" value={values.reviews_min_rating} onChange={(event) => setValues({ ...values, reviews_min_rating: event.target.value })}><option value="1">Tous les avis</option><option value="3">3 étoiles et plus</option><option value="4">4 étoiles et plus</option><option value="5">5 étoiles uniquement</option></select></Field>
      </div>
      <p className="-mt-2 mb-5 text-xs text-wood-deep/50">La note moyenne et le nombre d’avis affichés sont toujours ceux de Google. Google fournit au maximum les 5 avis les plus pertinents.</p>
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" disabled={busy}><Check className="h-4 w-4" />{busy ? 'Enregistrement…' : 'Enregistrer les avis'}</button>
        {status?.configured && <button type="button" className="btn-secondary" disabled={busy} onClick={() => { setBusy(true); void load(true).finally(() => setBusy(false)); }}><RotateCcw className="h-4 w-4" />Actualiser maintenant</button>}
      </div>
    </form>
  </section>;
}

// --- Commandes ---

const paymentLabels: Record<PaymentStatus, string> = { pending: 'Paiement non finalisé', processing: 'Paiement en cours de validation', paid: 'Payée', failed: 'Paiement refusé', expired: 'Abandonnée', cancelled: 'Abandonnée', refunded: 'Remboursée' };
const fulfillmentLabels: Record<FulfillmentStatus, string> = { to_prepare: 'À préparer', ready_for_pickup: 'Prête pour retrait', shipped: 'Expédiée', completed: 'Terminée', cancelled: 'Annulée' };
const euro = (value: number) => value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const dateTime = (value: string | null) => value ? new Date(value).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
const addressLines = (a: OrderAddress | null) => a ? [a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(' '), a.country === 'FR' ? 'France' : a.country].filter(Boolean) as string[] : [];
const isOpen = (order: OrderRow) => order.payment_status === 'paid' && ['to_prepare', 'ready_for_pickup'].includes(order.fulfillment_status);

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const tone = status === 'paid' ? 'badge-sage' : status === 'processing' ? 'badge bg-honey/20 text-honey-dark' : status === 'refunded' ? 'badge-wood' : 'badge bg-wood-deep/5 text-wood-deep/60';
  return <span className={tone}>{paymentLabels[status]}</span>;
}

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(() => new URLSearchParams(window.location.search).get('commande'));
  const [filter, setFilter] = useState<'open' | 'paid' | 'all'>('open');
  const [draft, setDraft] = useState({ carrier: '', tracking_number: '', admin_notes: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetchOrders().then(setOrders).catch(() => setError('Impossible de charger les commandes.')).finally(() => setLoading(false)); }, []);
  const selected = orders.find((order) => order.id === selectedId) || null;
  useEffect(() => { if (selected) setDraft({ carrier: selected.carrier || '', tracking_number: selected.tracking_number || '', admin_notes: selected.admin_notes || '' }); }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const paidOrders = orders.filter((order) => ['paid', 'refunded'].includes(order.payment_status));
  const shown = filter === 'open' ? orders.filter(isOpen) : filter === 'paid' ? paidOrders : orders;
  const replace = (order: OrderRow) => setOrders((all) => all.map((item) => item.id === order.id ? order : item));

  async function change(values: Parameters<typeof updateOrder>[1], success: string) {
    if (!selected) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await updateOrder(selected.id, values);
      replace(result.order);
      setMessage(result.email_error ? `${success} Attention : ${result.email_error}` : result.email_sent ? `${success} Le client a été prévenu par e-mail.` : success);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function resend(kind: 'confirmation' | 'ready' | 'shipped') {
    if (!selected) return;
    setBusy(true); setError(''); setMessage('');
    try { replace(await resendOrderEmail(selected.id, kind)); setMessage('E-mail envoyé au client.'); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  function setStatus(status: FulfillmentStatus) {
    if (!selected || status === selected.fulfillment_status) return;
    if (status === 'shipped' && !draft.tracking_number && !window.confirm('Aucun numéro de suivi n’est indiqué. Marquer comme expédiée quand même ?')) return;
    if (status === 'cancelled' && !window.confirm('Annuler cette commande ? Pensez à rembourser le client depuis Stripe si elle était payée.')) return;
    void change({ fulfillment_status: status, carrier: draft.carrier, tracking_number: draft.tracking_number }, `Commande passée à « ${fulfillmentLabels[status]} ».`);
  }

  const statusChoices: FulfillmentStatus[] = selected?.delivery_method === 'pickup' ? ['to_prepare', 'ready_for_pickup', 'completed', 'cancelled'] : ['to_prepare', 'shipped', 'completed', 'cancelled'];

  return <>
    <AdminTitle title="Commandes" description="Les commandes passées sur la boutique en ligne. Seules les commandes payées sont à préparer." />
    {error && <Notice text={error} error />}
    {message && <Notice text={message} />}
    <div className="flex flex-wrap gap-2 mb-5 print:hidden">
      <button className={filter === 'open' ? 'btn-primary text-sm' : 'btn-secondary text-sm'} onClick={() => setFilter('open')}>À traiter <span className="opacity-70">{orders.filter(isOpen).length}</span></button>
      <button className={filter === 'paid' ? 'btn-primary text-sm' : 'btn-secondary text-sm'} onClick={() => setFilter('paid')}>Payées <span className="opacity-70">{paidOrders.length}</span></button>
      <button className={filter === 'all' ? 'btn-primary text-sm' : 'btn-secondary text-sm'} onClick={() => setFilter('all')}>Toutes, y compris non payées <span className="opacity-70">{orders.length}</span></button>
    </div>
    <div className="grid xl:grid-cols-[minmax(0,1fr)_460px] gap-6 items-start">
      <div className="bg-off-white rounded-soft shadow-soft divide-y divide-wood-deep/10 overflow-hidden print:hidden">
        {loading && <p className="p-8 text-center text-wood-deep/60">Chargement des commandes…</p>}
        {!loading && shown.length === 0 && <p className="p-8 text-center text-wood-deep/60">{orders.length ? 'Aucune commande dans cette liste.' : 'Aucune commande pour le moment.'}</p>}
        {shown.map((order) => <button key={order.id} onClick={() => { setSelectedId(order.id); setMessage(''); setError(''); }} className={`w-full text-left p-4 hover:bg-beige/20 flex items-start justify-between gap-4 ${selectedId === order.id ? 'bg-beige/30' : ''}`}>
          <div className="min-w-0">
            <p className="font-medium">{order.order_number || <span className="text-wood-deep/50">Sans numéro</span>} · {order.customer_first_name} {order.customer_last_name}</p>
            <p className="text-xs text-wood-deep/55 mt-0.5 truncate">{order.order_items.map((item) => `${item.product_name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`).join(', ')}</p>
            {order.customer_note && <p className="text-xs text-terracotta-dark mt-0.5 truncate flex items-center gap-1"><PenLine className="h-3 w-3 shrink-0" />{order.customer_note}</p>}
            <p className="text-xs text-wood-deep/50 mt-1 inline-flex items-center gap-1.5">{order.delivery_method === 'pickup' ? <Store className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}{order.delivery_method === 'pickup' ? 'Retrait en boutique' : 'Livraison à domicile'} · {dateTime(order.paid_at || order.created_at)}{order.stripe_mode === 'test' ? ' · test' : ''}</p>
          </div>
          <div className="text-right shrink-0 space-y-1">
            <p className="font-medium tabular-nums">{euro(order.amount_paid ?? order.total_amount)}</p>
            <PaymentBadge status={order.payment_status} />
            {order.payment_status === 'paid' && <span className={`block ${['to_prepare', 'ready_for_pickup'].includes(order.fulfillment_status) ? 'badge-terracotta' : 'badge-wood'}`}>{fulfillmentLabels[order.fulfillment_status]}</span>}
            {order.alerts.length > 0 && <span className="block text-xs text-red-700 inline-flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />À vérifier</span>}
          </div>
        </button>)}
      </div>

      {selected && <div className="bg-off-white rounded-soft shadow-soft p-5 sm:p-6 xl:sticky xl:top-24 print-area">
        <div className="flex justify-between gap-3">
          <div>
            <h2 className="text-xl font-medium">{selected.order_number ? `Commande ${selected.order_number}` : 'Commande non payée'}</h2>
            <p className="text-sm text-wood-deep/55">{dateTime(selected.paid_at || selected.created_at)}</p>
          </div>
          <button className="h-10 w-10 -mr-2 -mt-2 inline-flex items-center justify-center print:hidden" onClick={() => setSelectedId(null)} aria-label="Fermer"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2"><PaymentBadge status={selected.payment_status} />{selected.payment_status === 'paid' && <span className="badge-terracotta">{fulfillmentLabels[selected.fulfillment_status]}</span>}{selected.stripe_mode === 'test' && <span className="badge bg-honey/20 text-honey-dark">Paiement de test</span>}</div>

        {selected.alerts.length > 0 && <div className="mt-4 rounded-soft bg-red-50 p-3 text-sm text-red-900"><p className="font-medium flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" />À vérifier</p><ul className="mt-1 list-disc pl-5 space-y-1">{selected.alerts.map((alert) => <li key={alert}>{alert}</li>)}</ul></div>}

        {selected.customer_note && <section className="mt-5 rounded-soft border-2 border-terracotta/30 bg-terracotta/[0.05] p-4">
          <h3 className="text-sm font-medium text-terracotta-dark mb-1">Précisions du client</h3>
          <p className="text-sm whitespace-pre-line">{selected.customer_note}</p>
        </section>}

        <section className="mt-5">
          <h3 className="text-sm font-medium text-wood-deep/60 mb-2">Articles</h3>
          <ul className="divide-y divide-wood-deep/10 border-y border-wood-deep/10">
            {selected.order_items.map((item) => <li key={item.id} className="flex items-center gap-3 py-2.5 text-sm">
              {item.image_url && <img src={item.image_url} alt="" className="h-12 w-12 rounded-soft object-cover print:hidden" />}
              <span className="flex-1"><strong className="font-medium">{item.quantity} ×</strong> {item.product_name}<span className="block text-xs text-wood-deep/50">{euro(item.unit_price)} l’unité</span></span>
              <span className="tabular-nums">{euro(item.line_total)}</span>
            </li>)}
          </ul>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-wood-deep/60">Sous-total</dt><dd className="tabular-nums">{euro(selected.subtotal_amount)}</dd></div>
            <div className="flex justify-between"><dt className="text-wood-deep/60">{selected.delivery_method === 'pickup' ? 'Retrait en boutique' : 'Livraison à domicile'}</dt><dd className="tabular-nums">{selected.shipping_amount ? euro(selected.shipping_amount) : 'Gratuit'}</dd></div>
            <div className="flex justify-between font-medium"><dt>{selected.amount_paid !== null ? 'Montant encaissé' : 'Total prévu'}</dt><dd className="tabular-nums">{euro(selected.amount_paid ?? selected.total_amount)}</dd></div>
          </dl>
        </section>

        <section className="mt-5 grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="text-sm font-medium text-wood-deep/60 mb-1">Client</h3>
            <p>{selected.customer_first_name} {selected.customer_last_name}</p>
            <a className="text-terracotta inline-flex items-center gap-1 break-all" href={`mailto:${selected.customer_email}?subject=${encodeURIComponent(`Votre commande ${selected.order_number || ''} — L’Atelier d’Isabelle`)}`}><Mail className="h-3.5 w-3.5 shrink-0" />{selected.customer_email}</a>
            {selected.customer_phone && <a className="text-terracotta flex items-center gap-1" href={`tel:${selected.customer_phone}`}><Phone className="h-3.5 w-3.5" />{selected.customer_phone}</a>}
          </div>
          <div>
            <h3 className="text-sm font-medium text-wood-deep/60 mb-1">{selected.delivery_method === 'pickup' ? 'Retrait gratuit en boutique' : 'Adresse de livraison'}</h3>
            {selected.delivery_method === 'shipping'
              ? (selected.shipping_address ? <p className="text-base leading-snug font-medium">{[selected.shipping_name, ...addressLines(selected.shipping_address)].filter(Boolean).map((line) => <span key={line} className="block">{line}</span>)}</p> : <p className="text-wood-deep/50">Connue après le paiement.</p>)
              : <p>{selected.pickup_location?.name}<span className="block whitespace-pre-line text-wood-deep/70">{selected.pickup_location?.address}</span></p>}
          </div>
        </section>

        {selected.payment_status === 'paid' && <section className="mt-6 border-t border-wood-deep/10 pt-5 print:hidden">
          <h3 className="text-sm font-medium text-wood-deep/60 mb-2">Préparation</h3>
          <div className="grid grid-cols-2 gap-2">
            {statusChoices.map((status) => <button key={status} type="button" disabled={busy} onClick={() => setStatus(status)} className={`min-h-[44px] rounded-soft border px-3 text-sm transition-colors ${selected.fulfillment_status === status ? 'border-terracotta bg-terracotta text-off-white' : 'border-wood-deep/15 hover:border-terracotta'}`}>{fulfillmentLabels[status]}</button>)}
          </div>
          <p className="mt-2 text-xs text-wood-deep/50">{selected.delivery_method === 'pickup' ? '« Prête pour retrait » prévient le client par e-mail.' : '« Expédiée » prévient le client par e-mail, avec le suivi indiqué ci-dessous.'}</p>
          {selected.delivery_method === 'shipping' && <div className="mt-4 grid sm:grid-cols-2 gap-x-3">
            <Field label="Transporteur (facultatif)"><input className="input-field" list="carriers" value={draft.carrier} onChange={(event) => setDraft({ ...draft, carrier: event.target.value })} placeholder="Colissimo" /></Field>
            <Field label="Numéro de suivi (facultatif)"><input className="input-field" value={draft.tracking_number} onChange={(event) => setDraft({ ...draft, tracking_number: event.target.value })} /></Field>
            <datalist id="carriers"><option value="Colissimo" /><option value="La Poste — Lettre suivie" /><option value="Mondial Relay" /><option value="Chronopost" /></datalist>
          </div>}
          <Field label="Notes internes (visibles uniquement ici)"><textarea className="input-field min-h-20" value={draft.admin_notes} onChange={(event) => setDraft({ ...draft, admin_notes: event.target.value })} /></Field>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary text-sm" disabled={busy} onClick={() => void change({ carrier: draft.carrier, tracking_number: draft.tracking_number, admin_notes: draft.admin_notes }, 'Informations enregistrées.')}><Check className="h-4 w-4" />Enregistrer</button>
            <button className="btn-secondary text-sm" onClick={() => window.print()}><Printer className="h-4 w-4" />Imprimer la fiche d’expédition</button>
          </div>
        </section>}

        <section className="mt-6 border-t border-wood-deep/10 pt-4 text-xs text-wood-deep/55 space-y-1 print:hidden">
          <p>E-mail de confirmation au client : {selected.confirmation_email_sent_at ? `envoyé le ${dateTime(selected.confirmation_email_sent_at)}` : 'non envoyé'}{selected.payment_status === 'paid' && <button className="ml-2 text-terracotta underline" disabled={busy} onClick={() => void resend('confirmation')}>{selected.confirmation_email_sent_at ? 'renvoyer' : 'envoyer'}</button>}</p>
          {selected.delivery_method === 'pickup' && selected.ready_at && <p>E-mail « commande prête » : {selected.ready_email_sent_at ? `envoyé le ${dateTime(selected.ready_email_sent_at)}` : 'non envoyé'} <button className="ml-2 text-terracotta underline" disabled={busy} onClick={() => void resend('ready')}>{selected.ready_email_sent_at ? 'renvoyer' : 'envoyer'}</button></p>}
          {selected.delivery_method === 'shipping' && selected.shipped_at && <p>E-mail d’expédition : {selected.shipped_email_sent_at ? `envoyé le ${dateTime(selected.shipped_email_sent_at)}` : 'non envoyé'} <button className="ml-2 text-terracotta underline" disabled={busy} onClick={() => void resend('shipped')}>{selected.shipped_email_sent_at ? 'renvoyer' : 'envoyer'}</button></p>}
          {selected.last_error && <p className="text-red-700">Dernière erreur : {selected.last_error}</p>}
          {selected.stripe_payment_intent_id && <p>Paiement Stripe : <a className="text-terracotta underline break-all" target="_blank" rel="noreferrer" href={`https://dashboard.stripe.com/${selected.stripe_mode === 'test' ? 'test/' : ''}payments/${selected.stripe_payment_intent_id}`}>{selected.stripe_payment_intent_id}</a></p>}
          {selected.stripe_session_id && <p className="break-all">Session Stripe : {selected.stripe_session_id}</p>}
          <p>Remboursement : depuis le paiement Stripe ci-dessus ; la commande passe automatiquement en « Remboursée ».</p>
        </section>
      </div>}
    </div>
  </>;
}

// --- Questions fréquentes (accueil, Google, assistants IA) ---

export function AdminFaqs() {
  const [items, setItems] = useState<FaqRow[]>([]);
  const [draft, setDraft] = useState<(Partial<FaqRow> & { question: string; answer: string }) | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { fetchAdminFaqs().then(setItems).catch(() => setError('Impossible de charger les questions.')); }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft?.question.trim() || !draft.answer.trim()) return;
    setError(''); setMessage('');
    try {
      const savedRow = await saveFaq({ ...draft, question: draft.question.trim(), answer: draft.answer.trim() });
      setItems((all) => (draft.id ? all.map((item) => item.id === savedRow.id ? savedRow : item) : [...all, savedRow]).sort((a, b) => a.display_order - b.display_order));
      setDraft(null);
      setMessage('La question a bien été enregistrée.');
    } catch { setError('La question n’a pas pu être enregistrée.'); }
  }

  async function remove(item: FaqRow) {
    if (!window.confirm('Supprimer cette question ?')) return;
    try { await deleteFaq(item.id); setItems((all) => all.filter((entry) => entry.id !== item.id)); }
    catch { setError('La question n’a pas pu être supprimée.'); }
  }

  return <>
    <AdminTitle title="Questions fréquentes" description="Affichées en bas de l’accueil. Google et les assistants comme ChatGPT s’en servent pour répondre aux personnes qui cherchent un cadeau ou une décoration faite main dans les Vosges." action={<button className="btn-primary" onClick={() => setDraft({ question: '', answer: '', display_order: items.length + 1, published: true })}><Plus className="h-4 w-4" />Ajouter</button>} />
    {error && <Notice text={error} error />}
    {message && <Notice text={message} />}
    <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
      <div className="space-y-3">
        {items.map((item) => <div key={item.id} className="bg-off-white rounded-soft shadow-soft p-5">
          <div className="flex items-start justify-between gap-3"><p className="font-medium">{item.question}</p>{!item.published && <span className="badge-wood shrink-0">Masquée</span>}</div>
          <p className="text-sm text-wood-deep/70 mt-2 whitespace-pre-line">{item.answer}</p>
          <div className="flex gap-2 mt-4"><button className="btn-secondary text-sm" onClick={() => setDraft({ ...item })}>Modifier</button><button className="h-10 w-10 inline-flex items-center justify-center text-wood-deep/60 hover:text-red-700" onClick={() => void remove(item)} aria-label="Supprimer la question"><Trash2 className="h-4 w-4" /></button></div>
        </div>)}
        {items.length === 0 && <p className="text-wood-deep/60">Aucune question pour le moment.</p>}
      </div>
      {draft && <form onSubmit={save} className="bg-off-white rounded-soft shadow-soft p-5 xl:sticky xl:top-24">
        <h2 className="text-xl font-medium mb-4">{draft.id ? 'Modifier la question' : 'Nouvelle question'}</h2>
        <Field label="Question" required><input className="input-field" required value={draft.question} onChange={(event) => setDraft({ ...draft, question: event.target.value })} placeholder="Ex. Où acheter vos créations dans les Vosges ?" /></Field>
        <Field label="Réponse" required><textarea className="input-field min-h-36" required value={draft.answer} onChange={(event) => setDraft({ ...draft, answer: event.target.value })} /></Field>
        <Field label="Ordre d’affichage"><input className="input-field" type="number" min="0" value={draft.display_order ?? 0} onChange={(event) => setDraft({ ...draft, display_order: Number(event.target.value) })} /></Field>
        <label className="flex gap-3 items-center text-sm mb-5"><input type="checkbox" className="accent-terracotta" checked={draft.published ?? true} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} />Afficher sur le site</label>
        <div className="flex gap-3"><button type="button" className="btn-secondary flex-1" onClick={() => setDraft(null)}>Annuler</button><button className="btn-primary flex-1"><Check className="h-4 w-4" />Enregistrer</button></div>
      </form>}
    </div>
  </>;
}
