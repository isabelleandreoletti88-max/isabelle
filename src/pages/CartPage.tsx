import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Clock, Lock, Mail, MapPin, Minus, Plus, ShoppingBag, Store, Trash2, Truck } from 'lucide-react';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/Breadcrumb';
import { parseFee } from '@/components/BuyBox';
import { isSellable, maxQuantity, useCart, useShopAccess } from '@/lib/cart';
import { usePublicCreations } from '@/lib/publicCatalog';
import { useSiteSettings } from '@/lib/siteData';
import { formatPrice, thumbUrl } from '@/lib/seo';
import { supabase } from '@/lib/supabase';
import { useLegalSettings } from '@/lib/legalService';
import { pickupAvailable, scheduleLines } from '@/lib/pickupSchedule';

type Delivery = 'shipping' | 'pickup';
type Contact = { first_name: string; last_name: string; email: string; phone: string; note: string };
const CONTACT_KEY = 'atelier-coordonnees';
const emptyContact: Contact = { first_name: '', last_name: '', email: '', phone: '', note: '' };

/** Message d'erreur renvoyé par une fonction serveur, sinon message générique. */
async function functionError(error: unknown, fallback: string) {
  const context = (error as { context?: Response }).context;
  try { const body = await context?.json(); if (body?.error) return String(body.error); } catch { /* réponse sans JSON */ }
  return fallback;
}

function readContact(): Contact {
  try { return { ...emptyContact, ...JSON.parse(window.sessionStorage.getItem(CONTACT_KEY) || '{}') }; } catch { return emptyContact; }
}

export function CartPage() {
  const { lines, setQuantity, remove, pendingToken, setPendingToken } = useCart();
  const { creations, loading } = usePublicCreations();
  const settings = useSiteSettings();
  const { settings: legal } = useLegalSettings();
  const shop = useShopAccess();
  const location = useLocation();
  const navigate = useNavigate();

  const fee = parseFee(settings.shop_shipping_fee) ?? 0;
  const homeEnabled = settings.shop_home_delivery_enabled !== 'false';
  const pickupEnabled = pickupAvailable(settings);
  const pickupDays = scheduleLines(settings.shop_pickup_schedule);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const chosen: Delivery | null = delivery && ((delivery === 'shipping' && homeEnabled) || (delivery === 'pickup' && pickupEnabled)) ? delivery : homeEnabled ? 'shipping' : pickupEnabled ? 'pickup' : null;
  const [contact, setContact] = useState<Contact>(() => (typeof window === 'undefined' ? emptyContact : readContact()));
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const handledReturn = useRef(false);

  useEffect(() => { try { window.sessionStorage.setItem(CONTACT_KEY, JSON.stringify(contact)); } catch { /* navigation privée */ } }, [contact]);

  // Retour depuis Stripe sans payer : la session est close pour libérer les pièces uniques.
  useEffect(() => {
    const token = new URLSearchParams(location.search).get('retour');
    if (!token || handledReturn.current) return;
    handledReturn.current = true;
    setNotice('Le paiement n’a pas été effectué. Votre panier est conservé : vous pouvez le modifier ou réessayer.');
    void supabase.functions.invoke('checkout-status', { body: { action: 'cancel', token } }).catch(() => {});
    if (token === pendingToken) setPendingToken(null);
    navigate('/panier', { replace: true });
  }, [location.search, pendingToken, setPendingToken, navigate]);

  const rows = useMemo(() => lines.map((line) => {
    const creation = creations.find((item) => item.id === line.id);
    const sellable = Boolean(creation && isSellable(creation));
    const max = creation ? maxQuantity(creation) : 0;
    return { line, creation, sellable, max, quantity: Math.min(line.quantity, Math.max(max, 1)) };
  }), [lines, creations]);
  const valid = rows.filter((row) => row.sellable && row.creation);
  const blocked = !loading && rows.some((row) => !row.sellable);
  const subtotal = valid.reduce((sum, row) => sum + (row.creation!.price ?? 0) * row.quantity, 0);
  const shipping = chosen === 'shipping' ? fee : 0;
  const total = subtotal + shipping;
  const pickupLabel = settings.shop_pickup_name || 'la boutique';
  const personalizable = valid.some((row) => row.creation?.customizable);

  async function pay(event: FormEvent) {
    event.preventDefault();
    if (!chosen) return setError('Choisissez un mode de réception.');
    if (!accepted) return setError('Merci d’accepter les conditions générales de vente.');
    setSubmitting(true); setError('');
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('checkout-create', {
        body: { items: valid.map((row) => ({ product_id: row.line.id, quantity: row.quantity })), delivery: chosen, customer: { first_name: contact.first_name, last_name: contact.last_name, email: contact.email, phone: contact.phone }, note: contact.note, accept_terms: true, previous_token: pendingToken },
      });
      if (invokeError) throw new Error(await functionError(invokeError, 'Le paiement n’a pas pu être ouvert. Réessayez dans un instant.'));
      if (!data?.url) throw new Error('Le paiement n’a pas pu être ouvert. Réessayez dans un instant.');
      setPendingToken(data.token);
      window.location.assign(data.url);
    } catch (e) {
      setError((e as Error).message || 'Le paiement n’a pas pu être ouvert. Réessayez dans un instant.');
      setSubmitting(false);
    }
  }

  const field = (key: keyof Contact, label: string, props: Record<string, unknown> = {}) => (
    <label className="block">
      <span className="label-field">{label}</span>
      <input className="input-field" value={contact[key]} onChange={(e) => setContact({ ...contact, [key]: e.target.value })} {...props} />
    </label>
  );

  return (
    <>
      <SEO title="Votre panier | L'Atelier d'Isabelle" description="Votre panier de créations faites main dans les Vosges." noindex />
      <main className="pt-28 lg:pt-36 pb-24">
        <div className="container-page">
          <Breadcrumb items={[{ label: 'La boutique', path: '/boutique' }, { label: 'Panier' }]} />
          <h1 className="font-serif font-normal tracking-[-0.015em] text-[2.1rem] leading-[1.05] sm:text-5xl">Votre panier</h1>

          {shop.preview && <p className="mt-5 rounded-soft bg-honey/15 px-4 py-3 text-sm text-wood-deep/80">Aperçu réservé à l’administration : la boutique n’est pas encore ouverte au public. Les paiements passent en mode test Stripe.</p>}
          {notice && <p className="mt-5 flex gap-2 rounded-soft bg-sand-light px-4 py-3 text-sm" role="status"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-terracotta" />{notice}</p>}

          {!loading && lines.length === 0 && (
            <div className="mt-10 rounded-soft-lg bg-off-white/80 p-10 text-center shadow-soft">
              <ShoppingBag className="h-10 w-10 mx-auto text-terracotta/70" />
              <p className="mt-4 font-serif text-2xl">Votre panier est vide</p>
              <p className="mt-2 text-wood-deep/65">Les créations disponibles à l’achat en ligne portent un bouton « Ajouter au panier ».</p>
              <Link to="/boutique" className="btn-primary mt-6">Découvrir les créations <ArrowRight className="h-4 w-4" /></Link>
            </div>
          )}

          {lines.length > 0 && !shop.visible && !shop.loading && (
            <p className="mt-6 rounded-soft bg-sand-light px-4 py-3 text-sm">La vente en ligne n’est pas encore ouverte. <Link to="/contact" className="text-terracotta underline">Contactez Isabelle</Link> pour réserver ces créations.</p>
          )}

          {lines.length > 0 && (
            <form onSubmit={pay} className="mt-8 grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-7 space-y-10">
                {/* Articles */}
                <section aria-labelledby="articles">
                  <h2 id="articles" className="sr-only">Articles</h2>
                  <ul className="divide-y divide-wood-deep/10 border-y border-wood-deep/10">
                    <AnimatePresence initial={false}>
                      {rows.map(({ line, creation, sellable, max, quantity }) => (
                        <motion.li key={line.id} layout exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="flex gap-4 py-5">
                          <Link to={creation ? `/creations/${creation.slug}` : '/boutique'} className="shrink-0 h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-soft bg-sand-light">
                            {creation && <img src={thumbUrl(creation.mainImage)} alt="" className="h-full w-full object-cover" />}
                          </Link>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-serif text-lg sm:text-xl leading-snug">{creation ? <Link to={`/creations/${creation.slug}`} className="hover:text-terracotta">{creation.name}</Link> : loading ? 'Chargement…' : 'Création retirée'}</p>
                                {creation && <p className="mt-0.5 text-sm text-wood-deep/70 tabular-nums">{formatPrice(creation.price ?? 0)}{max === 1 && creation.availability === 'available' ? ' · pièce unique' : ''}</p>}
                              </div>
                              <p className="font-medium tabular-nums whitespace-nowrap">{creation && sellable ? formatPrice((creation.price ?? 0) * quantity) : ''}</p>
                            </div>
                            {!loading && !sellable && <p className="mt-2 text-sm text-red-800">Cette création n’est plus disponible à l’achat en ligne. Retirez-la pour continuer.</p>}
                            <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                              {sellable && max > 1 ? (
                                <div className="inline-flex items-center rounded-soft border border-wood-deep/15 bg-off-white" role="group" aria-label={`Quantité de ${creation?.name}`}>
                                  <button type="button" className="h-10 w-10 inline-flex items-center justify-center disabled:opacity-30" onClick={() => setQuantity(line.id, quantity - 1)} disabled={quantity <= 1} aria-label="Retirer un exemplaire"><Minus className="h-4 w-4" /></button>
                                  <span className="w-7 text-center tabular-nums">{quantity}</span>
                                  <button type="button" className="h-10 w-10 inline-flex items-center justify-center disabled:opacity-30" onClick={() => setQuantity(line.id, quantity + 1)} disabled={quantity >= max} aria-label="Ajouter un exemplaire"><Plus className="h-4 w-4" /></button>
                                </div>
                              ) : <span className="text-sm text-wood-deep/70">{sellable ? 'Quantité : 1' : ''}</span>}
                              <button type="button" onClick={() => remove(line.id)} className="inline-flex items-center gap-1.5 min-h-[40px] text-sm text-wood-deep/70 hover:text-red-700"><Trash2 className="h-4 w-4" />Retirer</button>
                            </div>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                  <Link to="/boutique" className="mt-4 inline-flex items-center gap-2 min-h-[44px] text-sm text-wood-deep/70 hover:text-terracotta"><ArrowLeft className="h-4 w-4" />Continuer mes achats</Link>
                </section>

                {shop.visible && (
                  <>
                    {/* Réception */}
                    <fieldset>
                      <legend className="font-serif text-2xl">Comment souhaitez-vous recevoir votre commande ?</legend>
                      {!homeEnabled && !pickupEnabled && <p className="mt-4 text-sm text-red-800">Aucun mode de réception n’est disponible pour le moment. Contactez l’atelier.</p>}
                      <div className="mt-4 grid sm:grid-cols-2 gap-3">
                        {homeEnabled && (
                          <label className={`relative flex cursor-pointer flex-col rounded-soft-lg border-2 p-4 sm:p-5 transition-colors ${chosen === 'shipping' ? 'border-terracotta bg-terracotta/[0.06]' : 'border-wood-deep/12 bg-off-white hover:border-wood-deep/30'}`}>
                            <input type="radio" name="reception" value="shipping" checked={chosen === 'shipping'} onChange={() => setDelivery('shipping')} className="sr-only" />
                            <span className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 font-medium"><Truck className="h-5 w-5 text-terracotta" />Livraison à domicile</span><span className="font-medium tabular-nums">{fee > 0 ? formatPrice(fee) : 'Offerte'}</span></span>
                            <span className="mt-2 text-sm text-wood-deep/65 leading-relaxed">France métropolitaine. Colis préparé et expédié par Isabelle. Adresse demandée à l’étape du paiement.</span>
                            {chosen === 'shipping' && <CheckCircle2 className="absolute -top-2.5 -right-2.5 h-6 w-6 rounded-full bg-cream text-terracotta" aria-hidden="true" />}
                          </label>
                        )}
                        {pickupEnabled && (
                          <label className={`relative flex cursor-pointer flex-col rounded-soft-lg border-2 p-4 sm:p-5 transition-colors ${chosen === 'pickup' ? 'border-terracotta bg-terracotta/[0.06]' : 'border-wood-deep/12 bg-off-white hover:border-wood-deep/30'}`}>
                            <input type="radio" name="reception" value="pickup" checked={chosen === 'pickup'} onChange={() => setDelivery('pickup')} className="sr-only" />
                            <span className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 font-medium"><Store className="h-5 w-5 text-terracotta" />Retrait gratuit en boutique</span><span className="font-medium text-sage-dark">0 €</span></span>
                            <span className="mt-2 text-sm text-wood-deep/65 leading-relaxed">{settings.shop_pickup_name ? `${settings.shop_pickup_name}. ` : ''}Vous serez informé(e) par e-mail lorsque votre commande sera prête.</span>
                            {chosen === 'pickup' && <CheckCircle2 className="absolute -top-2.5 -right-2.5 h-6 w-6 rounded-full bg-cream text-terracotta" aria-hidden="true" />}
                          </label>
                        )}
                      </div>
                      {chosen === 'pickup' && (
                        <div className="mt-3 flex gap-3 rounded-soft-lg bg-sand-light/70 p-4 text-sm leading-relaxed">
                          <MapPin className="h-5 w-5 shrink-0 text-terracotta" />
                          <div>
                            {settings.shop_pickup_name && <p className="font-medium">{settings.shop_pickup_name}</p>}
                            <p className="whitespace-pre-line">{settings.shop_pickup_address}</p>
                            {pickupDays.length > 0 && <div className="mt-2"><p className="font-medium">Jours de présence d’Isabelle</p><ul className="mt-0.5">{pickupDays.map((line) => <li key={line}>{line}</li>)}</ul></div>}
                            {settings.shop_pickup_instructions && <p className="mt-2 text-wood-deep/65 whitespace-pre-line">{settings.shop_pickup_instructions}</p>}
                          </div>
                        </div>
                      )}
                    </fieldset>

                    {/* Coordonnées */}
                    <fieldset>
                      <legend className="font-serif text-2xl">Vos coordonnées</legend>
                      <p className="mt-1 text-sm text-wood-deep/70">{chosen === 'pickup' ? `Pour vous prévenir quand la commande vous attend à ${pickupLabel}.` : 'Pour vous envoyer la confirmation et le suivi de votre colis.'}</p>
                      <div className="mt-4 grid sm:grid-cols-2 gap-4">
                        {field('first_name', 'Prénom *', { required: true, autoComplete: 'given-name', maxLength: 60 })}
                        {field('last_name', 'Nom *', { required: true, autoComplete: 'family-name', maxLength: 60 })}
                        {field('email', 'E-mail *', { required: true, type: 'email', autoComplete: 'email', inputMode: 'email', maxLength: 120 })}
                        {field('phone', chosen === 'pickup' ? 'Téléphone *' : 'Téléphone (facultatif)', { required: chosen === 'pickup', type: 'tel', autoComplete: 'tel', inputMode: 'tel', maxLength: 25 })}
                      </div>
                      <label className="mt-4 block">
                        <span className="label-field">Précisions pour Isabelle (facultatif)</span>
                        <textarea className="input-field min-h-28" maxLength={1000} value={contact.note} onChange={(e) => setContact({ ...contact, note: e.target.value })} placeholder={personalizable ? 'Prénom à inscrire, date, message, couleurs souhaitées…' : 'Une précision sur votre commande, un message pour un cadeau…'} />
                        <span className="mt-1 block text-xs text-wood-deep/70">{personalizable ? 'Une ou plusieurs créations sont personnalisables : indiquez ici le prénom, la date ou le message à inscrire. Isabelle vous contactera si besoin avant de réaliser la pièce.' : 'Isabelle lira votre message avec la commande.'}{contact.note.length > 800 ? ` ${1000 - contact.note.length} caractères restants.` : ''}</span>
                      </label>
                    </fieldset>
                  </>
                )}
              </div>

              {/* Récapitulatif */}
              {shop.visible && (
                <aside className="lg:col-span-5 lg:sticky lg:top-28 rounded-soft-lg bg-off-white p-5 sm:p-7 shadow-card">
                  <h2 className="font-serif text-2xl">Récapitulatif</h2>
                  <dl className="mt-5 space-y-3 text-[0.95rem]">
                    <div className="flex justify-between gap-4"><dt className="text-wood-deep/70">Sous-total ({valid.reduce((n, r) => n + r.quantity, 0)} article{valid.reduce((n, r) => n + r.quantity, 0) > 1 ? 's' : ''})</dt><dd className="tabular-nums">{formatPrice(subtotal)}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-wood-deep/70">{chosen === 'pickup' ? 'Retrait gratuit en boutique' : 'Livraison à domicile'}</dt><dd className="tabular-nums">{shipping > 0 ? formatPrice(shipping) : 'Gratuit'}</dd></div>
                    <div className="flex justify-between gap-4 border-t border-wood-deep/15 pt-4 text-lg font-medium"><dt>Total à payer</dt><dd className="tabular-nums">{formatPrice(total)}</dd></div>
                  </dl>
                  {legal.editor_vat_franchise === 'true' && <p className="mt-2 text-xs text-wood-deep/70">TVA non applicable, article 293 B du CGI.</p>}
                  <label className="mt-6 flex gap-3 items-start text-sm leading-relaxed cursor-pointer">
                    <input type="checkbox" className="mt-0.5" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} required />
                    <span>J’ai lu et j’accepte les <Link to="/conditions-generales-de-vente" target="_blank" className="text-terracotta underline">conditions générales de vente</Link> et la <Link to="/livraison" target="_blank" className="text-terracotta underline">politique de livraison</Link>.</span>
                  </label>
                  {error && <p className="mt-4 flex gap-2 rounded-soft bg-red-50 px-3 py-2.5 text-sm text-red-800" role="alert"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</p>}
                  <button type="submit" disabled={submitting || loading || !valid.length || blocked || !chosen} className="btn-primary mt-5 w-full py-4 text-base">
                    <Lock className="h-4 w-4" />{submitting ? 'Ouverture du paiement sécurisé…' : `Payer ${formatPrice(total)}`}
                  </button>
                  {blocked && <p className="mt-2 text-xs text-red-800">Retirez les créations indisponibles pour continuer.</p>}
                  <ul className="mt-5 space-y-2 text-xs text-wood-deep/70">
                    <li className="flex gap-2"><Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />Paiement par carte sur la page sécurisée de Stripe. L’atelier n’a jamais accès à vos données bancaires.</li>
                    <li className="flex gap-2"><Mail className="h-3.5 w-3.5 shrink-0 mt-0.5" />Confirmation envoyée par e-mail dès le paiement validé.</li>
                    <li className="flex gap-2"><Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />14 jours pour changer d’avis après réception (hors créations personnalisées).</li>
                  </ul>
                </aside>
              )}
            </form>
          )}
        </div>
      </main>
    </>
  );
}

type Summary = {
  order_number: string | null; payment_status: string; delivery_method: Delivery; first_name: string; email: string;
  items: { name: string; slug: string | null; image: string | null; quantity: number; unit_price: number; line_total: number }[];
  subtotal: number; shipping: number; total: number;
  pickup_location: { name?: string; address?: string; instructions?: string; schedule?: string[] } | null; shipping_city: string | null;
};

/** Page de retour après le paiement Stripe. N'affiche que ce que le serveur a vérifié. */
export function OrderConfirmationPage() {
  const sessionId = new URLSearchParams(useLocation().search).get('session_id') || '';
  const { clear, setPendingToken } = useCart();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [failed, setFailed] = useState(false);
  const [waitedOut, setWaitedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempt = 0;
    async function poll() {
      attempt += 1;
      const { data, error } = await supabase.functions.invoke('checkout-status', { body: { session_id: sessionId } });
      if (cancelled) return;
      if (error || !data) { if (attempt < 3) window.setTimeout(poll, 2000); else setFailed(true); return; }
      setSummary(data as Summary);
      const status = (data as Summary).payment_status;
      if (status === 'paid' || status === 'processing') { clear(); setPendingToken(null); return; }
      if (status === 'pending') { if (attempt < 10) window.setTimeout(poll, 2500); else setWaitedOut(true); }
    }
    if (sessionId) void poll(); else setFailed(true);
    return () => { cancelled = true; };
  }, [sessionId, clear, setPendingToken]);

  const status = summary?.payment_status;
  const paid = status === 'paid';
  return (
    <>
      <SEO title="Votre commande | L'Atelier d'Isabelle" description="Confirmation de commande." noindex />
      <main className="pt-28 lg:pt-36 pb-24">
        <div className="container-page max-w-3xl">
          {!summary && !failed && <p className="py-24 text-center text-wood-deep/65" role="status">Vérification de votre paiement…</p>}
          {failed && (
            <div className="py-16 text-center">
              <AlertCircle className="h-10 w-10 mx-auto text-terracotta" />
              <h1 className="mt-4 font-serif text-3xl">Nous ne retrouvons pas ce paiement</h1>
              <p className="mt-3 text-wood-deep/70">Si vous avez payé, vous recevrez la confirmation par e-mail. En cas de doute, contactez l’atelier.</p>
              <Link to="/contact" className="btn-primary mt-6">Contacter Isabelle</Link>
            </div>
          )}
          {summary && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
              {paid && <>
                <CheckCircle2 className="h-12 w-12 text-sage-dark" />
                <h1 className="mt-4 font-serif font-normal text-[2.2rem] leading-tight sm:text-5xl">Merci {summary.first_name} !</h1>
                <p className="mt-4 text-lg text-wood-deep/75">Votre commande <strong className="font-medium">{summary.order_number}</strong> est confirmée. Un récapitulatif vient d’être envoyé à <strong className="font-medium">{summary.email}</strong>.</p>
              </>}
              {status === 'processing' && <>
                <Clock className="h-12 w-12 text-honey-dark" />
                <h1 className="mt-4 font-serif text-4xl">Paiement en cours de validation</h1>
                <p className="mt-4 text-lg text-wood-deep/75">Votre banque doit encore confirmer le paiement. Vous recevrez un e-mail à {summary.email} dès qu’il sera validé ; Isabelle préparera alors votre commande.</p>
              </>}
              {status === 'pending' && <>
                <Clock className="h-12 w-12 text-honey-dark" />
                <h1 className="mt-4 font-serif text-4xl">{waitedOut ? 'Confirmation en attente' : 'Vérification du paiement…'}</h1>
                <p className="mt-4 text-lg text-wood-deep/75">{waitedOut ? `Stripe ne nous a pas encore confirmé le paiement. Si vous avez payé, vous recevrez la confirmation par e-mail à ${summary.email} dans quelques minutes.` : 'Merci de patienter quelques secondes.'}</p>
              </>}
              {['failed', 'expired', 'cancelled'].includes(status || '') && <>
                <AlertCircle className="h-12 w-12 text-terracotta" />
                <h1 className="mt-4 font-serif text-4xl">Le paiement n’a pas abouti</h1>
                <p className="mt-4 text-lg text-wood-deep/75">Aucun montant n’a été débité. Votre panier est toujours disponible.</p>
                <Link to="/panier" className="btn-primary mt-6">Retour au panier</Link>
              </>}

              {(paid || status === 'processing') && (
                <div className="mt-10 grid sm:grid-cols-2 gap-6">
                  <section className="rounded-soft-lg bg-off-white p-5 sm:p-6 shadow-soft">
                    <h2 className="font-serif text-xl">Votre commande</h2>
                    <ul className="mt-4 space-y-3">
                      {summary.items.map((item) => (
                        <li key={item.name} className="flex gap-3 items-center">
                          {item.image && <img src={thumbUrl(item.image)} alt="" className="h-14 w-14 rounded-soft object-cover" />}
                          <span className="flex-1 text-sm">{item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ''}</span>
                          <span className="text-sm tabular-nums">{formatPrice(item.line_total)}</span>
                        </li>
                      ))}
                    </ul>
                    <dl className="mt-4 space-y-1.5 border-t border-wood-deep/10 pt-4 text-sm">
                      <div className="flex justify-between"><dt className="text-wood-deep/65">Sous-total</dt><dd className="tabular-nums">{formatPrice(summary.subtotal)}</dd></div>
                      <div className="flex justify-between"><dt className="text-wood-deep/65">{summary.delivery_method === 'pickup' ? 'Retrait en boutique' : 'Livraison'}</dt><dd className="tabular-nums">{summary.shipping ? formatPrice(summary.shipping) : 'Gratuit'}</dd></div>
                      <div className="flex justify-between font-medium text-base pt-1"><dt>Total payé</dt><dd className="tabular-nums">{formatPrice(summary.total)}</dd></div>
                    </dl>
                  </section>
                  <section className="rounded-soft-lg bg-sand-light/70 p-5 sm:p-6">
                    <h2 className="font-serif text-xl">La suite</h2>
                    {summary.delivery_method === 'pickup' ? (
                      <div className="mt-4 space-y-3 text-sm leading-relaxed">
                        <p className="flex gap-2"><Store className="h-5 w-5 shrink-0 text-terracotta" /><span><strong className="font-medium">Retrait gratuit en boutique</strong><br />{summary.pickup_location?.name}{summary.pickup_location?.name && <br />}<span className="whitespace-pre-line">{summary.pickup_location?.address}</span></span></p>
                        {summary.pickup_location?.schedule?.length ? <div><p className="font-medium">Jours de présence d’Isabelle</p><ul>{summary.pickup_location.schedule.map((line) => <li key={line}>{line}</li>)}</ul></div> : null}
                        <p>Isabelle vous enverra un e-mail dès que votre commande sera prête. Attendez ce message avant de vous déplacer.</p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3 text-sm leading-relaxed">
                        <p className="flex gap-2"><Truck className="h-5 w-5 shrink-0 text-terracotta" /><span><strong className="font-medium">Livraison à domicile</strong>{summary.shipping_city ? ` à ${summary.shipping_city}` : ''}</span></p>
                        <p>Isabelle prépare votre colis avec soin et vous prévient par e-mail lors de l’expédition, avec le numéro de suivi s’il y en a un.</p>
                      </div>
                    )}
                    <Link to="/boutique" className="btn-secondary mt-6">Retour à la boutique</Link>
                  </section>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
}
