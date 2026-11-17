import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Lock, Minus, Plus, ShoppingBag, Store, Truck } from 'lucide-react';
import type { Creation } from '@/types';
import { maxQuantity, useCart, useShopAccess } from '@/lib/cart';
import { useSiteSettings } from '@/lib/siteData';
import { formatPrice } from '@/lib/seo';
import { pickupAvailable, scheduleLines } from '@/lib/pickupSchedule';

/** Montant saisi dans l'administration (« 5,90 ») ; null si absent ou invalide. */
export function parseFee(value: string) {
  const n = Number(String(value || '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Ajout au panier depuis la fiche d'une création vendue en ligne. */
export default function BuyBox({ creation }: { creation: Creation }) {
  const { lines, add } = useCart();
  const { preview } = useShopAccess();
  const settings = useSiteSettings();
  const max = maxQuantity(creation);
  const inCart = lines.find((line) => line.id === creation.id)?.quantity ?? 0;
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const left = Math.max(0, max - inCart);
  const fee = parseFee(settings.shop_shipping_fee);
  const home = settings.shop_home_delivery_enabled !== 'false';
  const pickup = pickupAvailable(settings);
  const pickupDays = scheduleLines(settings.shop_pickup_schedule);

  function addToCart() {
    add(creation.id, Math.min(quantity, left), max);
    setAdded(true);
    setQuantity(1);
  }

  return (
    <div className="mt-7 rounded-soft-lg border border-wood-deep/10 bg-off-white/80 p-4 sm:p-5 shadow-soft">
      {preview && <p className="mb-4 rounded-soft bg-honey/15 px-3 py-2 text-xs text-wood-deep/80">Aperçu réservé à l’administration : la boutique n’est pas encore ouverte au public.</p>}
      <div className="flex flex-col sm:flex-row gap-3">
        {max > 1 && left > 0 && (
          <div className="inline-flex items-center rounded-soft border border-wood-deep/15 bg-off-white self-start" role="group" aria-label="Quantité">
            <button type="button" className="h-12 w-11 inline-flex items-center justify-center text-wood-deep/70 hover:text-terracotta disabled:opacity-30" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Retirer un exemplaire"><Minus className="h-4 w-4" /></button>
            <span className="w-8 text-center tabular-nums font-medium" aria-live="polite">{quantity}</span>
            <button type="button" className="h-12 w-11 inline-flex items-center justify-center text-wood-deep/70 hover:text-terracotta disabled:opacity-30" onClick={() => setQuantity((q) => Math.min(left, q + 1))} disabled={quantity >= left} aria-label="Ajouter un exemplaire"><Plus className="h-4 w-4" /></button>
          </div>
        )}
        {left > 0 ? (
          <button type="button" onClick={addToCart} className="btn-primary flex-1 sm:flex-none px-7 py-3.5 text-base">
            <ShoppingBag className="h-5 w-5" /> Ajouter au panier
          </button>
        ) : (
          <Link to="/panier" className="btn-primary flex-1 sm:flex-none px-7 py-3.5 text-base"><Check className="h-5 w-5" /> Déjà dans votre panier</Link>
        )}
      </div>
      <AnimatePresence>
        {added && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-sage-dark" role="status">
            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" /> Ajoutée à votre panier.</span>
            <Link to="/panier" className="font-medium text-terracotta underline underline-offset-4">Voir mon panier</Link>
          </motion.p>
        )}
      </AnimatePresence>
      <ul className="mt-4 space-y-1.5 text-sm text-wood-deep/70">
        {home && <li className="flex gap-2"><Truck className="h-4 w-4 shrink-0 mt-0.5 text-terracotta" />Livraison à domicile en France métropolitaine{fee !== null ? ` : ${fee > 0 ? formatPrice(fee) : 'offerte'} par commande` : ''}</li>}
        {pickup && <li className="flex gap-2"><Store className="h-4 w-4 shrink-0 mt-0.5 text-terracotta" /><span>Retrait gratuit en boutique{settings.shop_pickup_name ? ` — ${settings.shop_pickup_name}` : ''}{pickupDays.length ? <span className="block text-wood-deep/70">{pickupDays.join(' · ')}</span> : null}</span></li>}
        <li className="flex gap-2"><Lock className="h-4 w-4 shrink-0 mt-0.5 text-terracotta" /><span>Paiement sécurisé par Stripe. 14 jours pour changer d’avis, selon nos <Link to="/conditions-generales-de-vente" className="underline hover:text-terracotta">conditions de vente</Link>.</span></li>
      </ul>
    </div>
  );
}

/** Bouton de la barre fixe en bas de la fiche, sur téléphone. */
export function MobileCartButton({ creation }: { creation: Creation }) {
  const { lines, add } = useCart();
  const inCart = lines.some((line) => line.id === creation.id);
  if (inCart) return <Link to="/panier" className="btn-primary shrink-0"><Check className="h-4 w-4" /> Voir le panier</Link>;
  return <button type="button" className="btn-primary shrink-0" onClick={() => add(creation.id, 1, maxQuantity(creation))}><ShoppingBag className="h-4 w-4" /> Ajouter</button>;
}
