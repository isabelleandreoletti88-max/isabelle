import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BarChart3, ChevronRight, HelpCircle, ShoppingBag, Star, Layers, Type, Scale, FileText, ImagePlus, LayoutDashboard, LogOut, Menu, Package, Pencil, Plus, Settings, Tags, X, Check, Trash2, Inbox, Upload, ExternalLink, Eye, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { deleteCategory, deleteSeason, fetchAdminProducts, fetchAdminStats, fetchCategories, fetchSeasons, saveCategory, saveSeason, fetchHeroSlides, saveHeroSlide, deleteHeroSlide, type HeroSlideRow, fetchAdminEvents, saveEvent, deleteEvent, type EventRow } from '@/lib/catalogService';
import { fetchSiteImages, saveSiteImage, type SiteImageKey } from '@/lib/siteImages';
import { deleteMedia, deleteProduct, fetchMedia, fetchProductImages, fetchProductSeasonIds, fetchRequests, recordPreviousSlug, saveProduct, syncProductWithStripe, archiveProductInStripe, fetchProductStripeState, type ProductStripeState, saveProductImages, saveProductSeasons, setProductFlag, updateRequest, uploadImage, fetchAdminMaterials, saveMaterial, type MaterialRow, type GalleryImage, type MediaItem, type ProductInput } from '@/lib/adminService';
import { ProductGalleryEditor, ShopPanel } from '@/adminPages';
import { supabase } from '@/lib/supabase';
import { formatPrice, metaDescription, slugify, thumbUrl } from '@/lib/seo';
import { saveLegalDocument, saveLegalSettings, type LegalDocument } from '@/lib/legalService';
import ImageUploader from '@/components/ImageUploader';
import { AdminTitle, Field, Notice, Panel } from '@/components/adminUi';

type AdminProductRow = { id: string; name: string; slug: string; price: number | null; published: boolean; featured: boolean; categories?: { name: string } | null; product_images?: { public_url: string; is_main: boolean; display_order: number }[] };
type AdminRequestRow = { id: string; status: string; request_type: string; product_name?: string | null; first_name: string; last_name: string; email: string; phone?: string | null; subject: string; message: string; occasion?: string | null; desired_colors?: string | null; desired_dimensions?: string | null; budget?: string | null; desired_date?: string | null; admin_notes?: string | null; created_at: string };
type SimpleRow = { id: string; name: string; slug: string; description?: string; display_order?: number; published?: boolean; color?: string; icon?: string };

const nav = [
  { path: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/admin/demandes', label: 'Demandes', icon: Inbox },
  { path: '/admin/commandes', label: 'Commandes', icon: ShoppingBag },
  { path: '/admin/creations', label: 'Créations', icon: Package },
  { path: '/admin/categories', label: 'Catégories', icon: Tags },
  { path: '/admin/saisons', label: 'Saisons', icon: BarChart3 },
  { path: '/admin/matieres', label: 'Matières', icon: Layers },
  { path: '/admin/hero', label: 'Bannière d’accueil', icon: ImagePlus },
  { path: '/admin/evenements', label: 'Événements et boutiques', icon: Calendar },
  { path: '/admin/images', label: 'Images du site', icon: ImagePlus },
  { path: '/admin/contenus', label: 'Textes du site', icon: Type },
  { path: '/admin/questions', label: 'Questions fréquentes', icon: HelpCircle },
  { path: '/admin/medias', label: 'Médiathèque', icon: FileText },
  { path: '/admin/legal', label: 'Pages légales', icon: Scale },
  { path: '/admin/parametres', label: 'Paramètres', icon: Settings },
];

export function ProtectedRoute() { const { session, profile, loading } = useAuth(); if (loading) return <AdminLoading />; if (!session || !profile) return <Navigate to="/admin/login" replace />; return <Outlet />; }
export function AdminLogin() { const { session, signIn, resetPassword } = useAuth(); const location = useLocation(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [forgot, setForgot] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState(''); if (session && new URLSearchParams(location.search).get('reset') === '1') return <AdminSetPassword />; if (session) return <Navigate to="/admin" replace />; async function submit(e: FormEvent) { e.preventDefault(); setError(''); setMessage(''); const result = forgot ? await resetPassword(email) : await signIn(email, password); if (result.error) setError(result.error); else setMessage(forgot ? 'Si cette adresse est autorisée, un lien vient d’être envoyé.' : 'Connexion réussie.'); } return <div className="min-h-screen bg-cream flex items-center justify-center p-4"><div className="w-full max-w-md bg-off-white rounded-soft shadow-card p-8"><img src="/logo-atelier-isabelle.png" alt="L’Atelier d’Isabelle" className="h-20 w-auto mx-auto object-contain mb-6" /><h1 className="text-2xl text-center font-medium">{forgot ? 'Mot de passe oublié' : 'Administration privée'}</h1><p className="text-center text-sm text-wood-deep/60 mt-2">{forgot ? 'Recevez un lien sécurisé pour choisir un nouveau mot de passe.' : 'Connectez-vous pour gérer votre atelier.'}</p><form onSubmit={submit} className="mt-8 space-y-4"><label className="block"><span className="label-field">Adresse e-mail</span><input className="input-field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>{!forgot && <label className="block"><span className="label-field">Mot de passe</span><input className="input-field" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>}{error && <p className="text-sm text-red-700" role="alert">{error}</p>}{message && <p className="text-sm text-sage" role="status">{message}</p>}<button className="btn-primary w-full">{forgot ? 'Envoyer le lien' : 'Se connecter'}</button></form><button className="block mx-auto mt-5 text-sm text-terracotta hover:underline" onClick={() => { setForgot(!forgot); setError(''); }}>{forgot ? 'Retour à la connexion' : 'Mot de passe oublié ?'}</button><Link className="block text-center mt-5 text-sm text-wood-deep/60 hover:text-terracotta" to="/">Retourner au site</Link></div></div>; }

// Affiché après un lien d'invitation ou de réinitialisation (/admin/login?reset=1) : la session existe déjà, il reste à choisir le mot de passe.
function AdminSetPassword() { const { updatePassword } = useAuth(); const navigate = useNavigate(); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false); async function submit(e: FormEvent) { e.preventDefault(); setError(''); if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; } if (password !== confirm) { setError('Les deux mots de passe ne correspondent pas.'); return; } setSaving(true); const result = await updatePassword(password); setSaving(false); if (result.error) setError(result.error); else navigate('/admin', { replace: true }); } return <div className="min-h-screen bg-cream flex items-center justify-center p-4"><div className="w-full max-w-md bg-off-white rounded-soft shadow-card p-8"><img src="/logo-atelier-isabelle.png" alt="L’Atelier d’Isabelle" className="h-20 w-auto mx-auto object-contain mb-6" /><h1 className="text-2xl text-center font-medium">Choisir votre mot de passe</h1><p className="text-center text-sm text-wood-deep/60 mt-2">Il vous servira à vous connecter à l’administration de l’atelier.</p><form onSubmit={submit} className="mt-8 space-y-4"><label className="block"><span className="label-field">Nouveau mot de passe</span><input className="input-field" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></label><label className="block"><span className="label-field">Confirmer le mot de passe</span><input className="input-field" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>{error && <p className="text-sm text-red-700" role="alert">{error}</p>}<button className="btn-primary w-full" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer et accéder à l’administration'}</button></form></div></div>; }

export function AdminLayout() { const { profile, signOut } = useAuth(); const location = useLocation(); const [open, setOpen] = useState(false); return <div className="min-h-screen bg-cream">{open && <button className="lg:hidden fixed inset-0 z-40 bg-wood-deep/40" aria-label="Fermer le menu" onClick={() => setOpen(false)} />}<aside className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto bg-wood-deep text-cream transform transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}><div className="h-full flex flex-col p-5"><div className="flex items-center justify-between mb-8"><img src="/logo-atelier-isabelle.png" alt="L’Atelier d’Isabelle" className="h-16 w-auto object-contain brightness-0 invert" /><button className="lg:hidden h-11 w-11 -mr-2 inline-flex items-center justify-center" onClick={() => setOpen(false)} aria-label="Fermer"><X /></button></div><p className="text-xs uppercase tracking-wider text-beige mb-3">Espace privé</p><nav className="space-y-1 flex-1">{nav.map(({ path, label, icon: Icon }) => <Link key={path} to={path} onClick={() => setOpen(false)} className={`flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-soft text-sm transition-colors ${location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path)) ? 'bg-terracotta text-off-white' : 'text-cream/75 hover:bg-cream/10 hover:text-cream'}`}><Icon className="h-4 w-4" />{label}</Link>)}</nav><div className="border-t border-cream/10 pt-4"><p className="text-sm text-cream/80 truncate">{profile?.full_name || profile?.email}</p><p className="text-xs text-cream/50 mt-1 capitalize">{profile?.role}</p><Link to="/admin/login?reset=1" onClick={() => setOpen(false)} className="flex items-center gap-2 text-sm text-cream/70 hover:text-terracotta mt-2 py-3"><Settings className="h-4 w-4" />Changer mon mot de passe</Link><button onClick={() => void signOut()} className="flex items-center gap-2 text-sm text-cream/70 hover:text-terracotta py-3"><LogOut className="h-4 w-4" />Déconnexion</button></div></div></aside><div className="lg:pl-72"><header className="h-16 bg-off-white border-b border-wood-deep/10 flex items-center px-4 sm:px-8 sticky top-0 z-40"><button className="lg:hidden mr-2 -ml-2 h-11 w-11 inline-flex items-center justify-center" onClick={() => setOpen(true)} aria-label="Ouvrir le menu"><Menu /></button><Link to="/" className="text-sm text-wood-deep/60 hover:text-terracotta py-3">Voir le site</Link></header><main className="p-4 sm:p-8 pb-28 max-w-7xl mx-auto"><Outlet /></main></div></div>; }

function AdminLoading() { return <div className="min-h-screen bg-cream flex items-center justify-center text-wood-deep/60">Chargement de votre espace…</div>; }

export function AdminDashboard() { const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, unavailable: 0, requests: 0 }); const [recent, setRecent] = useState<AdminRequestRow[]>([]); const [error, setError] = useState(''); useEffect(() => { fetchAdminStats().then(setStats).catch(() => setError('Les statistiques ne sont pas disponibles pour le moment.')); fetchRequests().then((rows) => setRecent((rows as AdminRequestRow[]).slice(0, 5))).catch(() => {}); }, []); const cards = [['Créations', stats.total, 'total'], ['Publiées', stats.published, 'en ligne'], ['Brouillons', stats.drafts, 'à finaliser'], ['Indisponibles', stats.unavailable, 'vendues ou masquées'], ['Nouvelles demandes', stats.requests, 'à traiter']]; return <><AdminTitle title="Tableau de bord" description="Retrouvez l’essentiel de votre atelier en un coup d'œil." action={<Link to="/admin/creations/nouvelle" className="btn-primary"><Plus className="h-4 w-4" />Ajouter une création</Link>} />{error && <Notice text={error} error />}{!error && <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">{cards.map(([label, value, hint]) => <div key={String(label)} className="bg-off-white rounded-soft p-5 shadow-soft"><p className="text-sm text-wood-deep/60">{label}</p><p className="text-3xl font-medium mt-2">{value}</p><p className="text-xs text-sage mt-1">{hint}</p></div>)}</div>}<div className="mt-10 grid lg:grid-cols-2 gap-6"><div className="bg-off-white rounded-soft p-6"><h2 className="text-xl font-medium mb-4">Accès rapides</h2><div className="grid sm:grid-cols-2 gap-3"><Link to="/admin/creations/nouvelle" className="rounded-soft border border-wood-deep/10 p-4 hover:border-terracotta text-sm"><Plus className="h-5 w-5 text-terracotta mb-2" />Nouvelle création</Link><Link to="/admin/demandes" className="rounded-soft border border-wood-deep/10 p-4 hover:border-terracotta text-sm"><Inbox className="h-5 w-5 text-terracotta mb-2" />Voir les demandes</Link><Link to="/admin/contenus" className="rounded-soft border border-wood-deep/10 p-4 hover:border-terracotta text-sm"><Type className="h-5 w-5 text-terracotta mb-2" />Modifier les textes du site</Link><Link to="/admin/images" className="rounded-soft border border-wood-deep/10 p-4 hover:border-terracotta text-sm"><ImagePlus className="h-5 w-5 text-terracotta mb-2" />Changer les images du site</Link></div></div><div className="bg-off-white rounded-soft p-6"><div className="flex items-center justify-between mb-4"><h2 className="text-xl font-medium">Dernières demandes</h2><Link to="/admin/demandes" className="text-sm text-terracotta hover:underline py-3 -my-3">Tout voir</Link></div>{recent.length === 0 ? <p className="text-sm text-wood-deep/60">Aucune demande pour le moment.</p> : <ul className="divide-y divide-wood-deep/10">{recent.map((item) => <li key={item.id} className="py-3 flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-medium truncate">{item.first_name} {item.last_name} — {item.subject}</p><p className="text-xs text-wood-deep/50">{new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p></div>{item.status === 'new' && <span className="badge-terracotta shrink-0">Nouvelle</span>}</li>)}</ul>}</div></div></>; }

export function AdminProducts() {
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'published' | 'draft' | 'featured'>('all');
  const [category, setCategory] = useState('all');
  const [error, setError] = useState('');
  useEffect(() => { fetchAdminProducts().then((rows) => setProducts(rows as AdminProductRow[])).catch(() => setError('Impossible de charger les créations.')); }, []);
  const categoryNames = useMemo(() => [...new Set(products.map((p) => p.categories?.name?.trim()).filter((name): name is string => Boolean(name)))].sort(), [products]);
  const filtered = useMemo(() => products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
    && (status === 'all' || (status === 'published' ? p.published : status === 'draft' ? !p.published : p.featured))
    && (category === 'all' || p.categories?.name?.trim() === category)
  ), [products, query, status, category]);
  async function toggle(product: AdminProductRow, flag: 'published' | 'featured') {
    try {
      await setProductFlag(product.id, flag, !product[flag]);
      if (flag === 'published') void syncProductWithStripe(product.id).catch(() => {});
      setProducts((all) => all.map((p) => p.id === product.id ? { ...p, [flag]: !product[flag] } : p));
    } catch { setError('La modification n’a pas pu être enregistrée.'); }
  }
  async function remove(id: string) { if (!window.confirm('Supprimer définitivement cette création ?')) return; try { await archiveProductInStripe(id).catch(() => {}); await deleteProduct(id); setProducts((p) => p.filter((x) => x.id !== id)); } catch { setError('La suppression a échoué.'); } }
  const mainImage = (p: AdminProductRow) => [...(p.product_images || [])].sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.display_order - b.display_order)[0];
  return <>
    <AdminTitle title="Créations" description={`${products.length} créations, dont ${products.filter((p) => p.published).length} publiées.`} action={<Link to="/admin/creations/nouvelle" className="btn-primary"><Plus className="h-4 w-4" />Nouvelle création</Link>} />
    {error && <Notice text={error} error />}
    <div className="bg-off-white rounded-soft p-4 mb-5 grid sm:flex sm:flex-wrap gap-3 sm:items-center">
      <input className="input-field sm:max-w-xs" placeholder="Rechercher une création…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <select className="input-field sm:max-w-[200px]" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}><option value="all">Tous les statuts</option><option value="published">Publiées</option><option value="draft">Brouillons</option><option value="featured">Coups de cœur</option></select>
      <select className="input-field sm:max-w-[240px]" value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">Toutes les catégories</option>{categoryNames.map((name) => <option key={name} value={name}>{name}</option>)}</select>
      <span className="text-sm text-wood-deep/60">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
    </div>
    <ul className="md:hidden space-y-3">{filtered.map((p) => { const image = mainImage(p); return <li key={p.id} className="bg-off-white rounded-soft shadow-soft p-3 flex gap-3">
      <Link to={`/admin/creations/${p.id}`} className="shrink-0">{image ? <img src={thumbUrl(image.public_url)} alt="" className="h-20 w-20 rounded-soft object-cover" loading="lazy" /> : <span className="h-20 w-20 rounded-soft bg-beige/40 flex items-center justify-center text-wood-deep/30"><ImagePlus className="h-6 w-6" /></span>}</Link>
      <div className="min-w-0 flex-1">
        <Link to={`/admin/creations/${p.id}`} className="block font-medium leading-snug">{p.name}</Link>
        <p className="text-xs text-wood-deep/50 mt-0.5 truncate">{p.categories?.name || 'Sans catégorie'} · {p.price ? formatPrice(p.price) : 'Sur demande'}</p>
        <div className="flex items-center gap-1 mt-2 -ml-2">
          <button onClick={() => void toggle(p, 'published')} className={`${p.published ? 'badge-sage' : 'badge-wood'} min-h-[36px] mx-2`}>{p.published ? 'Publiée' : 'Brouillon'}</button>
          <button onClick={() => void toggle(p, 'featured')} aria-label={p.featured ? 'Retirer des coups de cœur' : 'Ajouter aux coups de cœur'} className={`h-10 w-10 inline-flex items-center justify-center ${p.featured ? 'text-terracotta' : 'text-wood-deep/30'}`}><Star className="h-5 w-5" fill={p.featured ? 'currentColor' : 'none'} /></button>
          <Link className="h-10 w-10 inline-flex items-center justify-center text-wood-deep/60" to={`/admin/creations/${p.id}`} aria-label={`Modifier ${p.name}`}><Pencil className="h-4 w-4" /></Link>
          <button className="h-10 w-10 inline-flex items-center justify-center text-wood-deep/60 ml-auto" onClick={() => void remove(p.id)} aria-label={`Supprimer ${p.name}`}><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </li>; })}{filtered.length === 0 && <li className="p-8 text-center text-wood-deep/60">Aucune création trouvée.</li>}</ul>
    <div className="hidden md:block bg-off-white rounded-soft shadow-soft overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
      <thead className="bg-beige/30"><tr><th className="text-left p-4">Création</th><th className="text-left p-4">Prix</th><th className="text-left p-4">Publiée</th><th className="text-left p-4">Coup de cœur</th><th className="text-right p-4">Actions</th></tr></thead>
      <tbody>{filtered.map((p) => { const image = mainImage(p); return <tr key={p.id} className="border-t border-wood-deep/10">
        <td className="p-4"><Link to={`/admin/creations/${p.id}`} className="flex items-center gap-3 group">{image ? <img src={thumbUrl(image.public_url)} alt="" className="h-12 w-12 rounded object-cover" loading="lazy" /> : <span className="h-12 w-12 rounded bg-beige/40 flex items-center justify-center text-wood-deep/30"><ImagePlus className="h-5 w-5" /></span>}<div><p className="font-medium group-hover:text-terracotta">{p.name}</p><p className="text-xs text-wood-deep/50">{p.categories?.name || 'Sans catégorie'} · {(p.product_images || []).length} photo{(p.product_images || []).length > 1 ? 's' : ''}</p></div></Link></td>
        <td className="p-4 whitespace-nowrap">{p.price ? formatPrice(p.price) : 'Sur demande'}</td>
        <td className="p-4"><button onClick={() => void toggle(p, 'published')} className={`${p.published ? 'badge-sage' : 'badge-wood'} min-h-[36px]`} title="Cliquer pour changer">{p.published ? 'Publiée' : 'Brouillon'}</button></td>
        <td className="p-4"><button onClick={() => void toggle(p, 'featured')} aria-label={p.featured ? 'Retirer des coups de cœur' : 'Ajouter aux coups de cœur'} className={`h-10 w-10 inline-flex items-center justify-center ${p.featured ? 'text-terracotta' : 'text-wood-deep/25 hover:text-terracotta'}`}><Star className="h-5 w-5" fill={p.featured ? 'currentColor' : 'none'} /></button></td>
        <td className="p-4"><div className="flex justify-end gap-1">{p.published && <a className="p-3 text-wood-deep/60 hover:text-terracotta" href={`/creations/${p.slug}`} target="_blank" rel="noreferrer" aria-label={`Voir ${p.name} sur le site`}><Eye className="h-4 w-4" /></a>}<Link className="p-3 text-wood-deep/60 hover:text-terracotta" to={`/admin/creations/${p.id}`} aria-label={`Modifier ${p.name}`}><Pencil className="h-4 w-4" /></Link><button className="p-3 text-wood-deep/60 hover:text-red-700" onClick={() => void remove(p.id)} aria-label={`Supprimer ${p.name}`}><Trash2 className="h-4 w-4" /></button></div></td>
      </tr>; })}</tbody>
    </table>{filtered.length === 0 && <p className="p-8 text-center text-wood-deep/60">Aucune création trouvée.</p>}</div></div>
  </>;
}

const emptyProduct: ProductInput = { name: '', slug: '', short_description: '', description: '', price: null, price_from: false, compare_at_price: null, category_id: null, materials: [], dimensions: '', colors: [], personalizable: false, availability_status: 'made_to_order', stock_quantity: null, production_time: '', maintenance_advice: '', featured: false, published: false, display_order: 0, seo_title: '', seo_description: '', sell_online: false };
const materialOptions = ['Galet', 'Papier', 'Bois', 'Fil de fer'];

export function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [value, setValue] = useState<ProductInput>({ ...emptyProduct, id });
  const [categories, setCategories] = useState<SimpleRow[]>([]);
  const [seasons, setSeasons] = useState<SimpleRow[]>([]);
  const [seasonIds, setSeasonIds] = useState<string[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [shopMessage, setShopMessage] = useState('');
  const [stripeState, setStripeState] = useState<ProductStripeState | null>(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setError('Impossible de charger les catégories.'));
    fetchSeasons().then(setSeasons).catch(() => setError('Impossible de charger les saisons.'));
    if (id) {
      supabase.from('products').select('*').eq('id', id).maybeSingle().then(({ data }) => {
        if (data) {
          // On ne renvoie à l'enregistrement que les champs du formulaire.
          const loaded = Object.fromEntries(Object.keys(emptyProduct).map((key) => [key, (data as Record<string, unknown>)[key]])) as ProductInput;
          setValue({ ...loaded, id });
        }
      });
      fetchProductImages(id).then(setImages).catch(() => setError('Impossible de charger les photos.'));
      fetchProductStripeState(id).then(setStripeState).catch(() => {});
      fetchProductSeasonIds(id).then(setSeasonIds).catch(() => setError('Impossible de charger les saisons de la création.'));
    }
  }, [id]);

  function update<K extends keyof ProductInput>(key: K, next: ProductInput[K]) {
    setValue((v) => ({ ...v, [key]: next }));
    setSaved(false);
  }

  function toggleMaterial(material: string) {
    update('materials', value.materials.includes(material) ? value.materials.filter((item) => item !== material) : [...value.materials, material]);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      if (id) await recordPreviousSlug(id, slugify(value.slug || value.name));
      const product = await saveProduct(value);
      await saveProductImages(product.id, images, removedImageIds);
      await saveProductSeasons(product.id, seasonIds);
      setRemovedImageIds([]);
      setImages(await fetchProductImages(product.id));
      setValue((v) => ({ ...v, slug: product.slug }));
      setSaved(true);
      // Synchronisation Stripe : produit, prix et lien de paiement suivent la fiche.
      setShopMessage('');
      if (value.sell_online || stripeState?.stripe_product_id) {
        try {
          const result = await syncProductWithStripe(product.id);
          if (result.reason === 'not_configured') setShopMessage('La boutique en ligne n’est pas encore reliée à Stripe : la création est enregistrée, la vente en ligne sera activée dès la connexion.');
        } catch (syncError) {
          setShopMessage(`La création est enregistrée, mais la vente en ligne n’a pas pu être mise à jour : ${(syncError as Error).message}`);
        }
        setStripeState(await fetchProductStripeState(product.id));
      }
      if (!id) navigate(`/admin/creations/${product.id}`);
    } catch {
      setError('La création n’a pas pu être enregistrée.');
    } finally {
      setSaving(false);
    }
  }

  const slugPreview = slugify(value.slug || value.name);
  const seoTitle = value.seo_title || `${value.name || 'Nom de la création'} – Fait main dans les Vosges | L'Atelier d'Isabelle`;
  const seoDescription = value.seo_description || value.short_description || value.description;

  return <>
    <AdminTitle title={id ? 'Modifier une création' : 'Nouvelle création'} description="Les informations peuvent être complétées et modifiées à tout moment." action={id && value.published ? <a href={`/creations/${slugPreview}`} target="_blank" rel="noreferrer" className="btn-secondary"><Eye className="h-4 w-4" />Voir sur le site</a> : undefined} />
    {error && <Notice text={error} error />}
    {saved && <Notice text="La création a bien été enregistrée." />}
    {shopMessage && <Notice text={shopMessage} error />}
    <form onSubmit={submit} className="space-y-6 pb-20">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Présentation">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nom" required><input className="input-field" required value={value.name} onChange={(e) => update('name', e.target.value)} /></Field>
              <Field label="Adresse de la page"><input className="input-field" placeholder="Générée depuis le nom" value={value.slug} onChange={(e) => update('slug', e.target.value)} /><span className="block text-xs text-wood-deep/50 mt-1 break-all">atelier-isabelle.fr/creations/{slugPreview || '…'}</span></Field>
            </div>
            <Field label="Description courte (liste des créations et Google)"><input className="input-field" value={value.short_description} onChange={(e) => update('short_description', e.target.value)} /></Field>
            <Field label="Description complète"><textarea className="input-field min-h-32" value={value.description} onChange={(e) => update('description', e.target.value)} /></Field>
          </Panel>
          <Panel title="Photos">
            <ProductGalleryEditor images={images} onChange={(next) => { setImages(next); setSaved(false); }} onRemove={(image) => { if (image.id) setRemovedImageIds((ids) => [...ids, image.id!]); setImages((all) => all.filter((item) => item !== image)); setSaved(false); }} productName={value.name} productSlug={slugPreview} material={value.materials[0]} />
          </Panel>
          <Panel title="Détails">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Prix en euros"><input className="input-field" type="number" min="0" step="0.01" placeholder="Vide = sur demande" value={value.price ?? ''} onChange={(e) => update('price', e.target.value ? Number(e.target.value) : null)} /></Field>
              <Field label="Ancien prix (prix barré)"><input className="input-field" type="number" min="0" step="0.01" value={value.compare_at_price ?? ''} onChange={(e) => update('compare_at_price', e.target.value ? Number(e.target.value) : null)} /></Field>
              <Field label="Catégorie"><select className="input-field" value={value.category_id || ''} onChange={(e) => update('category_id', e.target.value || null)}><option value="">Sans catégorie</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="Disponibilité"><select className="input-field" value={value.availability_status} onChange={(e) => update('availability_status', e.target.value as ProductInput['availability_status'])}><option value="available">Disponible</option><option value="made_to_order">Sur commande</option><option value="sold">Vendue</option><option value="unavailable">Indisponible</option></select></Field>
            </div>
            <div className="mb-4"><span className="label-field">Matières</span><div className="flex flex-wrap gap-2 mt-1">{[...materialOptions, ...value.materials.filter((m) => !materialOptions.includes(m))].map((material) => <label key={material} className={`text-sm px-3 py-1.5 rounded-full border cursor-pointer ${value.materials.includes(material) ? 'bg-terracotta text-off-white border-terracotta' : 'border-wood-deep/20 hover:border-terracotta'}`}><input type="checkbox" className="sr-only" checked={value.materials.includes(material)} onChange={() => toggleMaterial(material)} />{material}</label>)}</div></div>
            <div className="mb-4"><span className="label-field">Saisons</span><div className="flex flex-wrap gap-2 mt-1">{seasons.map((season) => <label key={season.id} className={`text-sm px-3 py-1.5 rounded-full border cursor-pointer ${seasonIds.includes(season.id) ? 'bg-sage text-off-white border-sage' : 'border-wood-deep/20 hover:border-sage'}`}><input type="checkbox" className="sr-only" checked={seasonIds.includes(season.id)} onChange={() => { setSeasonIds((ids) => ids.includes(season.id) ? ids.filter((x) => x !== season.id) : [...ids, season.id]); setSaved(false); }} />{season.name}</label>)}</div></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Couleurs (séparées par des virgules)"><input className="input-field" value={value.colors.join(', ')} onChange={(e) => update('colors', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} /></Field>
              <Field label="Dimensions"><input className="input-field" placeholder="Ex. 13x18 à poser ou à suspendre" value={value.dimensions} onChange={(e) => update('dimensions', e.target.value)} /></Field>
              <Field label="Délai de fabrication"><input className="input-field" placeholder="Ex. 1 semaine" value={value.production_time} onChange={(e) => update('production_time', e.target.value)} /></Field>
              <Field label="Ordre d’affichage"><input className="input-field" type="number" min="0" value={value.display_order} onChange={(e) => update('display_order', Number(e.target.value))} /></Field>
            </div>
            <Field label="Conseils d’entretien"><textarea className="input-field" value={value.maintenance_advice} onChange={(e) => update('maintenance_advice', e.target.value)} /></Field>
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Publication">
            <label className="flex gap-3 items-center text-sm"><input type="checkbox" className="accent-terracotta" checked={value.published} onChange={(e) => update('published', e.target.checked)} /> Publier sur le site</label>
            <label className="flex gap-3 items-center text-sm mt-3"><input type="checkbox" className="accent-terracotta" checked={value.featured} onChange={(e) => update('featured', e.target.checked)} /> Coup de cœur (mis en avant sur l’accueil)</label>
            <label className="flex gap-3 items-center text-sm mt-3"><input type="checkbox" className="accent-terracotta" checked={value.price_from} onChange={(e) => update('price_from', e.target.checked)} /> Afficher « À partir de »</label>
            <label className="flex gap-3 items-center text-sm mt-3"><input type="checkbox" className="accent-terracotta" checked={value.personalizable} onChange={(e) => update('personalizable', e.target.checked)} /> Personnalisable</label>
          </Panel>
          <ShopPanel sellOnline={value.sell_online} onChange={(next) => update('sell_online', next)} state={stripeState} price={value.price} availability={value.availability_status} published={value.published} />
          <Panel title="Référencement Google">
            <p className="text-xs text-wood-deep/60 mb-4">Facultatif : laissés vides, le titre et la description sont créés automatiquement.</p>
            <Field label={`Titre (${value.seo_title.length}/60)`}><input className="input-field" placeholder={seoTitle} value={value.seo_title} onChange={(e) => update('seo_title', e.target.value)} /></Field>
            <Field label={`Description (${value.seo_description.length}/158)`}><textarea className="input-field" placeholder={seoDescription.slice(0, 158)} value={value.seo_description} onChange={(e) => update('seo_description', e.target.value)} /></Field>
            <div className="rounded-soft border border-wood-deep/10 bg-white p-3">
              <p className="text-xs text-wood-deep/50">Aperçu dans Google</p>
              <p className="text-xs text-sage mt-1 break-all">atelier-isabelle.fr › creations › {slugPreview}</p>
              <p className="text-[#1a0dab] text-base leading-snug mt-0.5 line-clamp-2">{seoTitle}</p>
              <p className="text-xs text-wood-deep/70 mt-1 line-clamp-3">{metaDescription(seoDescription || '')}</p>
            </div>
          </Panel>
        </div>
      </div>
      <div className="fixed bottom-0 right-0 left-0 lg:left-72 z-30 bg-off-white border-t border-wood-deep/10 px-3 pt-3 safe-bottom flex justify-end gap-3 [&>*]:flex-1 sm:[&>*]:flex-none">
        <Link to="/admin/creations" className="btn-secondary">Retour à la liste</Link>
        <button className="btn-primary" disabled={saving}><Check className="h-4 w-4" />{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </form>
  </>;
}

export function AdminRequests() {
  const [items, setItems] = useState<AdminRequestRow[]>([]);
  const [selected, setSelected] = useState<AdminRequestRow | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchRequests().then(setItems).catch(() => setError('Impossible de charger les demandes.')); }, []);

  function selectRequest(item: AdminRequestRow) { setSelected(item); setNotes(item.admin_notes || ''); }
  async function changeStatus(status: string) {
    if (!selected) return;
    try {
      await updateRequest(selected.id, status, notes);
      const updated = { ...selected, status, admin_notes: notes };
      setItems((all) => all.map((item) => item.id === selected.id ? updated : item));
      setSelected(updated);
    } catch { setError('La demande n’a pas pu être mise à jour.'); }
  }
  const filtered = filter === 'all' ? items : items.filter((item) => item.status === filter);
  const statusLabel: Record<string, string> = { new: 'Nouvelle', in_progress: 'En cours', answered: 'Répondue', archived: 'Archivée' };

  return <>
    <AdminTitle title="Demandes" description="Les messages reçus depuis les formulaires du site." />
    {error && <Notice text={error} error />}
    <div className="flex flex-wrap gap-2 mb-5">{[['all', 'Toutes'], ['new', 'Nouvelles'], ['in_progress', 'En cours'], ['answered', 'Répondues'], ['archived', 'Archivées']].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={filter === value ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>{label} <span className="opacity-70">{value === 'all' ? items.length : items.filter((item) => item.status === value).length}</span></button>)}</div>
    <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
      <div className="bg-off-white rounded-soft shadow-soft divide-y divide-wood-deep/10 overflow-hidden">{filtered.map((item) => <button key={item.id} onClick={() => selectRequest(item)} className={`w-full text-left p-4 hover:bg-beige/20 flex items-center justify-between gap-4 ${selected?.id === item.id ? 'bg-beige/30' : ''}`}><div><div className="flex gap-2 items-center"><span className={item.status === 'new' ? 'badge-terracotta' : 'badge-wood'}>{statusLabel[item.status] || item.status}</span><span className="text-xs text-wood-deep/50">{item.request_type === 'custom_order' ? 'Sur mesure' : item.request_type === 'product' ? 'Création' : 'Contact'}</span></div><p className="font-medium mt-2">{item.first_name} {item.last_name}</p><p className="text-sm text-wood-deep/60">{item.subject}</p><p className="text-xs text-wood-deep/40 mt-1">{new Date(item.created_at).toLocaleDateString('fr-FR')}</p></div><ChevronRight className="h-4 w-4 text-wood-deep/40" /></button>)}{!filtered.length && <p className="p-8 text-center text-wood-deep/60">Aucune demande dans cette catégorie.</p>}</div>
      {selected && <div className="bg-off-white rounded-soft shadow-soft p-6 sticky top-24"><div className="flex justify-between gap-3"><div><h2 className="text-xl font-medium">Détail de la demande</h2><p className="text-sm text-wood-deep/50 mt-1">{statusLabel[selected.status] || selected.status}</p></div><button onClick={() => setSelected(null)} aria-label="Fermer"><X className="h-5 w-5" /></button></div><dl className="mt-5 space-y-3 text-sm"><div><dt className="text-wood-deep/50">Nom</dt><dd>{selected.first_name} {selected.last_name}</dd></div><div><dt className="text-wood-deep/50">Contact</dt><dd><a href={`mailto:${selected.email}`} className="text-terracotta hover:underline">{selected.email}</a>{selected.phone && <span className="block mt-1">{selected.phone}</span>}</dd></div>{selected.product_name && <div><dt className="text-wood-deep/50">Création</dt><dd>{selected.product_name}</dd></div>}<div><dt className="text-wood-deep/50">Message</dt><dd className="whitespace-pre-wrap leading-relaxed">{selected.message}</dd></div>{[['Occasion', selected.occasion], ['Couleurs souhaitées', selected.desired_colors], ['Dimensions souhaitées', selected.desired_dimensions], ['Budget', selected.budget], ['Date souhaitée', selected.desired_date]].filter((entry): entry is [string, string] => Boolean(entry[1])).map(([label, value]) => <div key={label}><dt className="text-wood-deep/50">{label}</dt><dd>{value}</dd></div>)}</dl><Field label="Notes internes"><textarea className="input-field min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ajoutez vos notes de suivi…" /></Field><div className="mt-2 flex flex-wrap gap-2">{['in_progress', 'answered', 'archived'].map((status) => <button key={status} className="btn-secondary text-xs" onClick={() => void changeStatus(status)}>{statusLabel[status]}</button>)}</div></div>}
    </div>
  </>;
}

export function AdminSimplePage({ title, kind }: { title: string; kind: 'categories' | 'seasons' | 'medias' }) {
  const [items, setItems] = useState<SimpleRow[]>([]);
  const [draft, setDraft] = useState<SimpleRow | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setError('');
    if (kind === 'categories') fetchCategories().then(setItems).catch(() => setError('Impossible de charger les catégories.'));
    else if (kind === 'seasons') fetchSeasons().then(setItems).catch(() => setError('Impossible de charger les saisons.'));
    else if (kind === 'medias') fetchMedia().then(setMedia).catch(() => setError('Impossible de charger la médiathèque.'));
  }, [kind]);

  function startNew() { setError(''); setDraft({ id: '', name: '', slug: '', description: '', display_order: items.length, published: true, color: '#8F9D83', icon: 'leaf' }); }
  function startEdit(item: SimpleRow) { setError(''); setDraft({ ...item }); }
  async function save(submitEvent: FormEvent) {
    submitEvent.preventDefault();
    if (!draft?.name.trim()) return;
    try {
      const saved = kind === 'categories' ? await saveCategory(draft) : await saveSeason(draft);
      setItems((current) => draft.id ? current.map((item) => item.id === draft.id ? saved as SimpleRow : item) : [...current, saved as SimpleRow]);
      setDraft(null);
    } catch { setError('L’enregistrement a échoué.'); }
  }
  async function remove(item: SimpleRow) {
    if (!window.confirm(`Supprimer « ${item.name} » ?`)) return;
    try { if (kind === 'categories') await deleteCategory(item.id); else await deleteSeason(item.id); setItems((current) => current.filter((entry) => entry.id !== item.id)); } catch { setError('La suppression a échoué.'); }
  }
  async function uploadMedia(file: File) { setUploading(true); setError(''); try { const uploaded = await uploadImage(file, 'site-images', 'library'); setMedia((current) => [{ bucket: 'site-images', path: uploaded.path, url: uploaded.url, name: file.name }, ...current]); setMessage('L’image a bien été ajoutée à la médiathèque.'); } catch { setError('L’image n’a pas pu être importée.'); } finally { setUploading(false); } }
  async function removeMedia(item: MediaItem) { if (!window.confirm(`Supprimer « ${item.name} » ?`)) return; try { await deleteMedia(item); setMedia((current) => current.filter((entry) => !(entry.bucket === item.bucket && entry.path === item.path))); } catch { setError('Le média n’a pas pu être supprimé.'); } }

  const manageable = kind === 'categories' || kind === 'seasons';

  if (kind === 'medias') return <><AdminTitle title={title} description="Importez, prévisualisez et supprimez les images utilisées par votre site." action={<label className={`btn-primary cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}><Upload className="h-4 w-4" />{uploading ? 'Import en cours…' : 'Importer une image'}<input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMedia(file); event.currentTarget.value = ''; }} /></label>} />{error && <Notice text={error} error />}{message && <Notice text={message} />}<div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{media.map((item) => <div key={`${item.bucket}-${item.path}`} className="bg-off-white rounded-soft shadow-soft overflow-hidden"><div className="aspect-square bg-beige/20"><img src={item.url} alt={item.name} className="h-full w-full object-cover" /></div><div className="p-4"><p className="text-sm font-medium truncate" title={item.name}>{item.name}</p><p className="text-xs text-wood-deep/45 mt-1">{item.bucket === 'site-images' ? 'Site' : 'Création'}{item.size ? ` · ${(item.size / 1024 / 1024).toFixed(1)} Mo` : ''}</p><div className="flex gap-2 mt-3"><a href={item.url} target="_blank" rel="noreferrer" className="btn-secondary text-xs"><ExternalLink className="h-3.5 w-3.5" />Ouvrir</a><button className="p-2 text-wood-deep/55 hover:text-red-700" onClick={() => void removeMedia(item)} aria-label={`Supprimer ${item.name}`}><Trash2 className="h-4 w-4" /></button></div></div></div>)}{!media.length && <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 bg-off-white rounded-soft p-10 text-center text-wood-deep/60">Aucune image dans la médiathèque.</div>}</div></>;
  return <><AdminTitle title={title} description="Gérez ces éléments sans modifier le code du site." action={manageable ? <button className="btn-primary" onClick={startNew}><Plus className="h-4 w-4" />Ajouter</button> : undefined} />{error && <Notice text={error} error />}{manageable ? <div className="grid xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start"><div className="grid sm:grid-cols-2 gap-4">{items.map((item) => <div key={item.id} className="bg-off-white rounded-soft p-5 shadow-soft border border-transparent hover:border-terracotta/30 transition-colors"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{item.name}</p><p className="text-xs text-wood-deep/50 mt-1">/{item.slug}</p></div><span className="text-xs text-sage">#{item.display_order ?? 0}</span></div>{kind === 'categories' && <p className="text-sm text-wood-deep/60 mt-4 line-clamp-2">{item.description || 'Aucune description'}</p>}<div className="flex gap-2 mt-5 pt-4 border-t border-wood-deep/10"><button className="btn-secondary text-sm" onClick={() => startEdit(item)}><Pencil className="h-4 w-4" />Modifier</button><button className="p-2 text-wood-deep/55 hover:text-red-700" onClick={() => void remove(item)} aria-label={`Supprimer ${item.name}`}><Trash2 className="h-4 w-4" /></button></div></div>)}{!items.length && <div className="sm:col-span-2 bg-off-white rounded-soft p-8 text-center text-wood-deep/60">Aucun élément pour le moment.</div>}</div>{draft && <form onSubmit={(event) => void save(event)} className="bg-off-white rounded-soft p-6 shadow-soft sticky top-24"><div className="flex items-center justify-between gap-3 mb-5"><h2 className="text-xl font-medium">{draft.id ? 'Modifier' : 'Nouvelle'} {kind === 'categories' ? 'catégorie' : 'saison'}</h2><button type="button" className="p-1 text-wood-deep/50 hover:text-wood-deep" onClick={() => setDraft(null)} aria-label="Fermer"><X className="h-5 w-5" /></button></div><Field label="Nom" required><input className="input-field" required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field><Field label="Identifiant URL"><input className="input-field" placeholder="Généré automatiquement si vide" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} /></Field>{kind === 'categories' ? <><Field label="Description"><textarea className="input-field min-h-28" value={draft.description || ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></Field><label className="flex gap-3 items-center text-sm mb-4"><input type="checkbox" className="accent-terracotta" checked={draft.published ?? true} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /> Visible sur le site</label></> : <><Field label="Couleur"><input className="input-field" type="text" value={draft.color || ''} onChange={(event) => setDraft({ ...draft, color: event.target.value })} /></Field><Field label="Icône"><input className="input-field" value={draft.icon || ''} onChange={(event) => setDraft({ ...draft, icon: event.target.value })} /></Field></>}<Field label="Ordre d’affichage"><input className="input-field" type="number" min="0" value={draft.display_order ?? 0} onChange={(event) => setDraft({ ...draft, display_order: Number(event.target.value) })} /></Field><div className="flex gap-3"><button type="button" className="btn-secondary flex-1" onClick={() => setDraft(null)}>Annuler</button><button className="btn-primary flex-1"><Check className="h-4 w-4" />Enregistrer</button></div></form>}</div> : <div className="bg-off-white rounded-soft p-8 text-wood-deep/70"><p>Cette section n’a pas encore de formulaire de gestion.</p></div>}</>;
}

const legalFieldGroups = [
  { key: 'identity', label: 'Identité de l’éditeur', fields: [['editor_full_name', 'Nom et prénom / dénomination'], ['editor_legal_form', 'Forme ou statut juridique'], ['editor_address', 'Adresse professionnelle'], ['editor_email', 'Adresse e-mail'], ['editor_phone', 'Téléphone'], ['editor_siren', 'SIREN'], ['editor_siret', 'SIRET'], ['editor_rcs', 'RNE ou RCS'], ['editor_rcs_city', 'Ville d’immatriculation'], ['editor_capital', 'Capital social'], ['editor_vat_number', 'TVA intracommunautaire'], ['editor_publication_director', 'Directeur ou directrice de publication']], },
  { key: 'hosting', label: 'Hébergement', fields: [['host_name', 'Nom de l’hébergeur'], ['host_company', 'Dénomination sociale'], ['host_address', 'Adresse'], ['host_phone', 'Téléphone'], ['host_website', 'Site internet']], },
  { key: 'mediation', label: 'Médiation', fields: [['mediator_name', 'Nom du médiateur'], ['mediator_address', 'Adresse postale'], ['mediator_website', 'Site internet'], ['mediator_process', 'Modalités de saisine']], },
  { key: 'data', label: 'Protection des données', fields: [['dpo_controller', 'Responsable du traitement'], ['dpo_email', 'E-mail d’exercice des droits'], ['dpo_address', 'Adresse d’exercice des droits'], ['dpo_dpo', 'DPO (si désigné)'], ['data_processors', 'Prestataires techniques'], ['data_hosting_location', 'Lieu d’hébergement des données'], ['data_eeu_transfers', 'Transferts hors EEE'], ['data_retention_contact', 'Durée de conservation des demandes'], ['data_retention_orders', 'Durée de conservation des commandes'], ['privacy_update_date', 'Date de mise à jour de la politique']], },
  { key: 'ecommerce', label: 'E-commerce futur', fields: [['ecommerce_payment_methods', 'Moyens de paiement'], ['ecommerce_delivery_zones', 'Zones de livraison'], ['ecommerce_carriers', 'Transporteurs'], ['ecommerce_shipping_fees', 'Frais de livraison'], ['ecommerce_prep_time', 'Délais de préparation'], ['ecommerce_delivery_time', 'Délais de livraison'], ['ecommerce_return_address', 'Adresse de retour'], ['ecommerce_return_fees', 'Frais de retour'], ['ecommerce_complaints', 'Procédure de réclamation'], ['ecommerce_warranty', 'Garanties commerciales éventuelles'], ['ecommerce_cgv_date', 'Date d’entrée en vigueur des CGV']], },
];

export function AdminLegal() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([
      supabase.from('legal_settings').select('setting_key,setting_value,is_required,is_completed,category'),
      supabase.from('legal_documents').select('*').order('title'),
    ]).then(([settingsResult, documentsResult]) => {
      if (settingsResult.error || documentsResult.error) { setError('Impossible de charger les informations légales.'); setLoading(false); return; }
      const mapped: Record<string, string> = {};
      for (const row of settingsResult.data || []) {
        const raw = row.setting_value;
        mapped[row.setting_key] = typeof raw === 'string' ? raw : raw === null ? '' : JSON.stringify(raw);
      }
      setSettings(mapped);
      setDocuments((documentsResult.data || []) as LegalDocument[]);
      setLoading(false);
    });
  }, []);
  const requiredMissing = ['editor_full_name', 'editor_legal_form', 'editor_address', 'editor_email', 'editor_publication_director', 'host_name', 'host_address', 'mediator_name', 'mediator_address', 'mediator_website', 'dpo_email'].filter((key) => !settings[key]);
  function update(key: string, value: string) { setSettings((current) => ({ ...current, [key]: value })); setMessage(''); }
  async function saveSettings() { setSaving(true); setError(''); setMessage(''); try { await saveLegalSettings(settings); setMessage('Les paramètres légaux ont été enregistrés.'); } catch { setError('Les paramètres n’ont pas pu être enregistrés.'); } finally { setSaving(false); } }
  async function saveDocument() { if (!selectedDocument) return; setSaving(true); setError(''); try { await saveLegalDocument(selectedDocument.document_type, selectedDocument.content || '', selectedDocument.status); setDocuments((all) => all.map((doc) => doc.id === selectedDocument.id ? { ...selectedDocument, version: selectedDocument.version + 1 } : doc)); setMessage('Le document a été enregistré.'); } catch { setError('Le document n’a pas pu être enregistré.'); } finally { setSaving(false); } }
  if (loading) return <AdminLoading />;
  return <><AdminTitle title="Informations légales" description="Complétez les informations obligatoires avant de publier vos documents." />{error && <Notice text={error} error />}{message && <Notice text={message} />}
    <div className="mb-8 rounded-soft border border-terracotta/30 bg-beige/25 p-5"><p className="font-medium">Modèles à adapter</p><p className="mt-2 text-sm text-wood-deep/70">Ces pages sont des modèles d’information. Vérifiez-les avec vos pratiques réelles et demandez une validation professionnelle avant l’ouverture de la vente en ligne.</p></div>
    <div className="grid xl:grid-cols-[1fr_360px] gap-8 items-start"><div className="space-y-6">{legalFieldGroups.map((group) => <Panel key={group.key} title={group.label}><div className="grid sm:grid-cols-2 gap-4">{group.fields.map(([key, label]) => <Field key={key} label={label}><input className="input-field" value={settings[key] || ''} onChange={(event) => update(key, event.target.value)} /></Field>)}</div>{group.key === 'ecommerce' && <label className="flex gap-3 items-center text-sm mt-2"><input type="checkbox" className="accent-terracotta" checked={settings.ecommerce_enabled === 'true'} onChange={(event) => update('ecommerce_enabled', String(event.target.checked))} /> Activer les documents e-commerce</label>}</Panel>)}<button className="btn-primary" onClick={() => void saveSettings()} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}</button></div>
      <div className="space-y-6"><Panel title="Tableau de conformité"><p className="text-sm mb-4">{requiredMissing.length ? `${requiredMissing.length} information(s) obligatoire(s) manquante(s)` : 'Les informations principales sont complètes.'}</p><ul className="space-y-2 text-sm">{requiredMissing.map((key) => <li key={key} className="text-red-700">• {key.replace(/_/g, ' ')}</li>)}</ul>{settings.ecommerce_enabled === 'true' && <ul className="mt-4 pt-4 border-t border-wood-deep/10 space-y-2 text-sm"><li className={settings.ecommerce_delivery_zones ? 'text-sage' : 'text-red-700'}>• Informations de livraison</li><li className={settings.mediator_name ? 'text-sage' : 'text-red-700'}>• Médiateur renseigné</li><li className={documents.some((doc) => doc.document_type === 'withdrawal-form' && doc.status === 'published') ? 'text-sage' : 'text-red-700'}>• Formulaire de rétractation</li></ul>}</Panel><Panel title="Documents"><div className="space-y-2">{documents.map((doc) => <button key={doc.id} onClick={() => setSelectedDocument({ ...doc })} className={`w-full text-left rounded-soft border p-3 text-sm ${selectedDocument?.id === doc.id ? 'border-terracotta bg-beige/30' : 'border-wood-deep/10 hover:border-terracotta/40'}`}><span className="font-medium">{doc.title}</span><span className="block text-xs text-wood-deep/50 mt-1">{doc.status === 'disabled' ? 'Préparation' : doc.status === 'published' ? `Publié · v${doc.version}` : 'Brouillon'}</span></button>)}</div></Panel>{selectedDocument && <Panel title={`Modifier : ${selectedDocument.title}`}><select className="input-field mb-4" value={selectedDocument.status} onChange={(event) => setSelectedDocument({ ...selectedDocument, status: event.target.value as LegalDocument['status'] })}><option value="published">Publié</option><option value="draft">Brouillon</option><option value="disabled">Désactivé</option></select><textarea className="input-field min-h-56" placeholder="Texte personnalisé optionnel…" value={selectedDocument.content || ''} onChange={(event) => setSelectedDocument({ ...selectedDocument, content: event.target.value })} /><button className="btn-primary mt-4 w-full" onClick={() => void saveDocument()} disabled={saving}>Enregistrer le document</button></Panel>}</div></div></>;
}

const emptySlide: Partial<HeroSlideRow> = { chapter: '', number: '', image: null, video_id: null, eyebrow: '', title: '', poem: '', quote: '', cta_label: '', cta_to: '/', palette_accent: 'from-honey via-amber to-honey-light', palette_accent_soft: 'from-honey/20', palette_text: 'text-honey-dark', palette_number: 'text-honey/30', display_order: 0, published: true };
export function AdminHeroSlides() {
  const [items, setItems] = useState<HeroSlideRow[]>([]);
  const [draft, setDraft] = useState<Partial<HeroSlideRow> & { id?: string } | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { fetchHeroSlides().then(setItems).catch(() => setError('Impossible de charger la bannière.')); }, []);
  function startNew() { setError(''); setDraft({ ...emptySlide, display_order: items.length }); }
  function startEdit(item: HeroSlideRow) { setError(''); setDraft({ ...item }); }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft?.title?.trim()) return;
    try {
      const saved = await saveHeroSlide(draft as Partial<HeroSlideRow> & { id?: string });
      setItems((current) => draft.id ? current.map((item) => item.id === draft.id ? saved : item) : [...current, saved]);
      setDraft(null);
      setMessage('Le slide a bien été enregistré.');
    } catch { setError('L’enregistrement a échoué.'); }
  }
  async function remove(item: HeroSlideRow) {
    if (!window.confirm(`Supprimer « ${item.title} » ?`)) return;
    try { await deleteHeroSlide(item.id); setItems((current) => current.filter((entry) => entry.id !== item.id)); } catch { setError('La suppression a échoué.'); }
  }

  return <>
    <AdminTitle title="Bannière d’accueil" description="Gérez les slides (images et vidéos) de la bannière principale." action={<button className="btn-primary" onClick={startNew}><Plus className="h-4 w-4" />Ajouter un slide</button>} />
    {error && <Notice text={error} error />}{message && <Notice text={message} />}
    <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-off-white rounded-soft p-5 shadow-soft border border-transparent hover:border-terracotta/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-terracotta uppercase tracking-wider">{item.chapter || 'Chapitre'}</p>
                <p className="font-medium mt-1">{item.title}</p>
                <p className="text-xs text-wood-deep/50 mt-1">{item.video_id ? 'Vidéo YouTube' : item.image ? 'Image' : 'Aucun média'}</p>
              </div>
              <span className="text-xs text-sage">#{item.display_order}</span>
            </div>
            {item.image && <div className="mt-3 rounded-soft overflow-hidden h-28 bg-beige/20"><img src={item.image} alt={item.title} className="w-full h-full object-cover" /></div>}
            {item.video_id && <div className="mt-3 rounded-soft overflow-hidden h-28 bg-beige/20 flex items-center justify-center"><span className="text-xs text-wood-deep/50">Vidéo YouTube</span></div>}
            <div className="flex gap-2 mt-5 pt-4 border-t border-wood-deep/10">
              <button className="btn-secondary text-sm" onClick={() => startEdit(item)}><Pencil className="h-4 w-4" />Modifier</button>
              <button className="p-2 text-wood-deep/55 hover:text-red-700" onClick={() => void remove(item)} aria-label={`Supprimer ${item.title}`}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {!items.length && <div className="sm:col-span-2 bg-off-white rounded-soft p-8 text-center text-wood-deep/60">Aucun slide pour le moment.</div>}
      </div>
      {draft && (
        <form onSubmit={save} className="bg-off-white rounded-soft p-6 shadow-soft sticky top-24">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-medium">{draft.id ? 'Modifier' : 'Nouveau'} slide</h2>
            <button type="button" className="p-1 text-wood-deep/50 hover:text-wood-deep" onClick={() => setDraft(null)} aria-label="Fermer"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Chapitre"><input className="input-field" value={draft.chapter || ''} onChange={(e) => setDraft({ ...draft, chapter: e.target.value })} placeholder="Chapitre I" /></Field>
            <Field label="Numéro"><input className="input-field" value={draft.number || ''} onChange={(e) => setDraft({ ...draft, number: e.target.value })} placeholder="01" /></Field>
          </div>
          <Field label="Titre" required><input className="input-field" required value={draft.title || ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
          <Field label="Sur-titre"><input className="input-field" value={draft.eyebrow || ''} onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })} /></Field>
          <Field label="Poème / description"><textarea className="input-field min-h-24" value={draft.poem || ''} onChange={(e) => setDraft({ ...draft, poem: e.target.value })} /></Field>
          <Field label="Citation"><input className="input-field" value={draft.quote || ''} onChange={(e) => setDraft({ ...draft, quote: e.target.value })} /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Texte du bouton"><input className="input-field" value={draft.cta_label || ''} onChange={(e) => setDraft({ ...draft, cta_label: e.target.value })} /></Field>
            <Field label="Lien du bouton"><input className="input-field" value={draft.cta_to || ''} onChange={(e) => setDraft({ ...draft, cta_to: e.target.value })} placeholder="/boutique" /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="ID vidéo YouTube"><input className="input-field" value={draft.video_id || ''} onChange={(e) => setDraft({ ...draft, video_id: e.target.value || null })} placeholder="Laisser vide pour une image" /></Field>
            <div className="mb-4">
              <ImageUploader
                label="Image de la bannière"
                value={draft.image || null}
                onChange={(url) => setDraft({ ...draft, image: url })}
                bucket="site-images"
                folder="banniere"
                shape="wide"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Palette accent"><input className="input-field" value={draft.palette_accent || ''} onChange={(e) => setDraft({ ...draft, palette_accent: e.target.value })} /></Field>
            <Field label="Palette texte"><input className="input-field" value={draft.palette_text || ''} onChange={(e) => setDraft({ ...draft, palette_text: e.target.value })} /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Ordre"><input className="input-field" type="number" min="0" value={draft.display_order ?? 0} onChange={(e) => setDraft({ ...draft, display_order: Number(e.target.value) })} /></Field>
            <label className="flex gap-3 items-center text-sm mt-6"><input type="checkbox" className="accent-terracotta" checked={draft.published ?? true} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> Publier</label>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" className="btn-secondary flex-1" onClick={() => setDraft(null)}>Annuler</button>
            <button className="btn-primary flex-1"><Check className="h-4 w-4" />Enregistrer</button>
          </div>
        </form>
      )}
    </div>
  </>;
}

const emptyEvent: Partial<EventRow> = { title: '', location: '', description: '', image: null, start_date: null, end_date: null, is_permanent: false, link_url: null, display_order: 0, published: true };
export function AdminEvents() {
  const [items, setItems] = useState<EventRow[]>([]);
  const [draft, setDraft] = useState<Partial<EventRow> & { id?: string } | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { fetchAdminEvents().then(setItems).catch(() => setError('Impossible de charger les événements.')); }, []);
  function startNew() { setError(''); setDraft({ ...emptyEvent, display_order: items.length }); }
  function startEdit(item: EventRow) { setError(''); setDraft({ ...item }); }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft?.title?.trim()) return;
    try {
      const saved = await saveEvent(draft as Partial<EventRow> & { id?: string });
      setItems((current) => draft.id ? current.map((item) => item.id === draft.id ? saved : item) : [...current, saved]);
      setDraft(null);
      setMessage('L’événement a bien été enregistré.');
    } catch { setError('L’enregistrement a échoué.'); }
  }
  async function remove(item: EventRow) {
    if (!window.confirm(`Supprimer « ${item.title} » ?`)) return;
    try { await deleteEvent(item.id); setItems((current) => current.filter((entry) => entry.id !== item.id)); } catch { setError('La suppression a échoué.'); }
  }

  return <>
    <AdminTitle title="Événements" description="Gérez les boutiques partenaires, marchés et salons affichés sur la page Événements." action={<button className="btn-primary" onClick={startNew}><Plus className="h-4 w-4" />Ajouter un événement</button>} />
    {error && <Notice text={error} error />}{message && <Notice text={message} />}
    <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-off-white rounded-soft p-5 shadow-soft border border-transparent hover:border-terracotta/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-terracotta uppercase tracking-wider">{item.is_permanent ? 'Boutique partenaire' : 'Marché / Salon'}</p>
                <p className="font-medium mt-1 truncate">{item.title}</p>
                <p className="text-xs text-wood-deep/50 mt-1">{item.location || 'Lieu non précisé'}</p>
              </div>
              <span className="text-xs text-sage shrink-0">#{item.display_order}</span>
            </div>
            {item.image && <div className="mt-3 rounded-soft overflow-hidden h-28 bg-beige/20"><img src={item.image} alt={item.title} className="w-full h-full object-cover" /></div>}
            <div className="flex gap-2 mt-4 pt-4 border-t border-wood-deep/10">
              <button className="btn-secondary text-sm" onClick={() => startEdit(item)}><Pencil className="h-4 w-4" />Modifier</button>
              <button className="p-2 text-wood-deep/55 hover:text-red-700" onClick={() => void remove(item)} aria-label={`Supprimer ${item.title}`}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {!items.length && <div className="sm:col-span-2 bg-off-white rounded-soft p-8 text-center text-wood-deep/60">Aucun événement pour le moment.</div>}
      </div>
      {draft && (
        <form onSubmit={save} className="bg-off-white rounded-soft p-6 shadow-soft sticky top-24">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-medium">{draft.id ? 'Modifier' : 'Nouvel'} événement</h2>
            <button type="button" className="p-1 text-wood-deep/50 hover:text-wood-deep" onClick={() => setDraft(null)} aria-label="Fermer"><X className="h-5 w-5" /></button>
          </div>
          <Field label="Titre" required><input className="input-field" required value={draft.title || ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="La Boutik’art" /></Field>
          <Field label="Lieu"><input className="input-field" value={draft.location || ''} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="Saint-Dié-des-Vosges" /></Field>
          <Field label="Lien (facultatif)"><input className="input-field" type="url" value={draft.link_url || ''} onChange={(e) => setDraft({ ...draft, link_url: e.target.value || null })} placeholder="https://… site de la boutique ou page de l’événement" /></Field>
          <Field label="Description"><textarea className="input-field min-h-24" value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
          <div className="mb-4">
            <ImageUploader
              label="Image de l’événement"
              value={draft.image || null}
              onChange={(url) => setDraft((d) => d ? { ...d, image: url } : d)}
              bucket="site-images"
              folder="evenements"
              shape="wide"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Date de début"><input className="input-field" type="date" value={draft.start_date || ''} onChange={(e) => setDraft({ ...draft, start_date: e.target.value || null })} /></Field>
            <Field label="Date de fin"><input className="input-field" type="date" value={draft.end_date || ''} onChange={(e) => setDraft({ ...draft, end_date: e.target.value || null })} /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Ordre d’affichage"><input className="input-field" type="number" min="0" value={draft.display_order ?? 0} onChange={(e) => setDraft({ ...draft, display_order: Number(e.target.value) })} /></Field>
            <div className="flex flex-col gap-2 mt-6">
              <label className="flex gap-3 items-center text-sm"><input type="checkbox" className="accent-terracotta" checked={draft.is_permanent ?? false} onChange={(e) => setDraft({ ...draft, is_permanent: e.target.checked })} /> Boutique permanente</label>
              <label className="flex gap-3 items-center text-sm"><input type="checkbox" className="accent-terracotta" checked={draft.published ?? true} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> Publier</label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" className="btn-secondary flex-1" onClick={() => setDraft(null)}>Annuler</button>
            <button className="btn-primary flex-1"><Check className="h-4 w-4" />Enregistrer</button>
          </div>
        </form>
      )}
    </div>
  </>;
}

const siteImageLabels: { key: SiteImageKey; label: string; description: string }[] = [
  { key: 'logo', label: 'Logo principal', description: 'Affiché dans le pied de page et l\'écran de connexion' },
  { key: 'header_logo', label: 'Logo d\'en-tête', description: 'Affiché en haut de chaque page' },
  { key: 'og_image', label: 'Image de partage (réseaux sociaux)', description: 'Image affichée lors du partage du site sur Facebook, WhatsApp, etc.' },
  { key: 'home_sur_mesure_image', label: 'Accueil — Sur mesure', description: 'Image de la section « Sur mesure » de la page d\'accueil' },
  { key: 'home_univers_image', label: 'Accueil — Univers d\'Isabelle', description: 'Image de la section « Bienvenue dans l\'univers » de la page d\'accueil' },
  { key: 'personnalisation_image', label: 'Personnalisation', description: 'Image de la page de création personnalisée' },
  { key: 'about_image', label: 'À propos', description: 'Image principale de la page « L\'atelier »' },
];

export function AdminSiteImages() {
  const [images, setImages] = useState<Partial<Record<SiteImageKey, string>>>({});
  const [seasonRows, setSeasonRows] = useState<{ id: string; name: string; slug: string; image: string | null }[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([]);

  useEffect(() => {
    fetchAdminMaterials().then(setMaterialRows).catch(() => setError('Impossible de charger les matières.'));
    fetchSiteImages().then(setImages).catch(() => setError('Impossible de charger les images.'));
    fetchSeasons().then((rows) => setSeasonRows(rows as { id: string; name: string; slug: string; image: string | null }[])).catch(() => setError('Impossible de charger les saisons.'));
  }, []);

  async function saveImage(key: SiteImageKey, value: string) {
    setSaving(key);
    setError(''); setMessage('');
    try {
      await saveSiteImage(key, value);
      setImages((current) => ({ ...current, [key]: value }));
      setMessage('L\'image a bien été enregistrée.');
    } catch { setError('L\'image n\'a pas pu être enregistrée.'); }
    finally { setSaving(null); }
  }

  async function saveSeasonImage(id: string, slug: string, value: string) {
    setSaving(`season-${id}`);
    setError(''); setMessage('');
    try {
      const { error: updateError } = await supabase.from('seasons').update({ image: value || null }).eq('id', id);
      if (updateError) throw updateError;
      setSeasonRows((current) => current.map((row) => row.id === id ? { ...row, image: value } : row));
      setMessage('L\'image de saison a bien été enregistrée.');
    } catch { setError('L\'image de saison n\'a pas pu être enregistrée.'); }
    finally { setSaving(null); }
  }

  async function saveMaterialImage(row: MaterialRow) {
    setSaving(`material-${row.id}`);
    setError(''); setMessage('');
    try {
      await saveMaterial({ ...row, image: row.image || null });
      setMessage(`La photo « ${row.name} » a bien été enregistrée.`);
    } catch { setError('La photo de la matière n\'a pas pu être enregistrée.'); }
    finally { setSaving(null); }
  }

  return <>
    <AdminTitle title="Images du site" description="Modifiez toutes les images affichées sur le site : logos, photos de sections, saisons et matières." />
    {error && <Notice text={error} error />}{message && <Notice text={message} />}
    <div className="grid lg:grid-cols-2 gap-6">
      {siteImageLabels.map(({ key, label, description }) => (
        <Panel key={key} title={label}>
          <p className="text-sm text-wood-deep/60 mb-4">{description}</p>
          <ImageUploader
            label={label}
            value={(images[key] as string) || null}
            onChange={(url) => setImages((current) => ({ ...current, [key]: url || '' }))}
            bucket="site-images"
            folder="site"
          />
          <button className="btn-primary text-sm mt-3" onClick={() => void saveImage(key, (images[key] as string) || '')} disabled={saving === key}>
            {saving === key ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </Panel>
      ))}
    </div>
    <div className="mt-8">
      <h2 className="text-2xl font-medium mb-4">Images des saisons</h2>
      <div className="grid lg:grid-cols-2 gap-6">
        {seasonRows.map((season) => (
          <Panel key={season.id} title={season.name}>
            <ImageUploader
              label={season.name}
              value={season.image || null}
              onChange={(url) => setSeasonRows((current) => current.map((row) => row.id === season.id ? { ...row, image: url } : row))}
              bucket="site-images"
              folder="saisons"
            />
            <button className="btn-primary text-sm mt-3" onClick={() => void saveSeasonImage(season.id, season.slug, season.image || '')} disabled={saving === `season-${season.id}`}>
              {saving === `season-${season.id}` ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </Panel>
        ))}
      </div>
    </div>
    <div className="mt-8">
      <h2 className="text-2xl font-medium mb-1">Photos des matières</h2>
      <p className="text-sm text-wood-deep/60 mb-4">Affichées sur l’accueil et la page « L’atelier ». Le nom et le texte se modifient dans <Link to="/admin/matieres" className="text-terracotta underline">Matières</Link>.</p>
      <div className="grid lg:grid-cols-2 gap-6">
        {materialRows.map((row) => (
          <Panel key={row.id} title={row.name}>
            <ImageUploader
              label={`Photo « ${row.name} »`}
              value={row.image || null}
              onChange={(url) => setMaterialRows((current) => current.map((item) => item.id === row.id ? { ...item, image: url } : item))}
              bucket="site-images"
              folder="matieres"
              shape="wide"
              baseName={`matiere-${row.name}`}
            />
            <button className="btn-primary text-sm mt-3" onClick={() => void saveMaterialImage(row)} disabled={saving === `material-${row.id}`}>
              {saving === `material-${row.id}` ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </Panel>
        ))}
      </div>
    </div>
  </>;
}
