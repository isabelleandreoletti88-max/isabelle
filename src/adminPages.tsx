import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, ImagePlus, Plus, RotateCcw, Star, Trash2 } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import { AdminTitle, Field, Notice } from '@/components/adminUi';
import { editablePages } from '@/config/editableContent';
import { settingsDefaults, type SiteSettings } from '@/lib/siteData';
import { productImageAlt } from '@/lib/seo';
import {
  deleteMaterial, fetchAdminMaterials, fetchSettings, fetchTexts, resetText, saveMaterial, saveSettings, saveText, uploadImage,
  type GalleryImage, type MaterialRow,
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
    fetchSettings(Object.keys(settingsDefaults))
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
      await saveSettings(values);
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

  useEffect(() => { fetchAdminMaterials().then(setItems).catch(() => setError('Impossible de charger les matières.')); }, []);

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
    <AdminTitle title="Matières" description="Les matières présentées sur l’accueil et la page « L’atelier » : photo, nom et texte." action={<button className="btn-primary" onClick={() => setDraft({ ...emptyMaterial, display_order: items.length + 1 })}><Plus className="h-4 w-4" />Ajouter</button>} />
    {error && <Notice text={error} error />}
    {message && <Notice text={message} />}
    <div className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((item) => <div key={item.id} className="bg-off-white rounded-soft shadow-soft overflow-hidden">
          <div className="aspect-[4/3] bg-beige/20">{item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-wood-deep/30"><ImagePlus className="h-8 w-8" /></div>}</div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2"><p className="font-medium">{item.name}</p>{!item.published && <span className="badge-wood">Masquée</span>}</div>
            <p className="text-sm text-wood-deep/60 mt-1 line-clamp-3">{item.description}</p>
            <div className="flex gap-2 mt-4">
              <button className="btn-secondary text-sm" onClick={() => setDraft({ ...item })}>Modifier</button>
              <button className="p-2 text-wood-deep/60 hover:text-red-700" onClick={() => void remove(item)} aria-label={`Supprimer ${item.name}`}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        </div>)}
      </div>
      {draft && <form onSubmit={save} className="bg-off-white rounded-soft shadow-soft p-5 xl:sticky xl:top-24">
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
          <button type="button" className="p-2 rounded-soft hover:bg-beige/40 disabled:opacity-30" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Déplacer vers la gauche"><ArrowLeft className="h-4 w-4" /></button>
          <button type="button" className="p-2 rounded-soft hover:bg-beige/40 disabled:opacity-30" disabled={index === images.length - 1} onClick={() => move(index, 1)} aria-label="Déplacer vers la droite"><ArrowRight className="h-4 w-4" /></button>
          {index > 0 && <button type="button" className="text-xs px-2 py-1 rounded-soft hover:bg-beige/40 inline-flex items-center gap-1" onClick={() => onChange([image, ...images.filter((_, i) => i !== index)])}><Star className="h-3.5 w-3.5" />Photo principale</button>}
          <button type="button" className="p-2 ml-auto rounded-soft text-wood-deep/60 hover:text-red-700" onClick={() => onRemove(image)} aria-label="Retirer la photo"><Trash2 className="h-4 w-4" /></button>
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
