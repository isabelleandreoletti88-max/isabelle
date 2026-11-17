import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Creation } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import { useSiteSettings } from '@/lib/siteData';

/**
 * Panier du site. Il ne contient que des identifiants de créations et des quantités :
 * les prix affichés viennent du catalogue, et le serveur recalcule tout au paiement.
 * Conservé dans le navigateur (localStorage) pour retrouver son panier plus tard.
 */
export type CartLine = { id: string; quantity: number };

const CART_KEY = 'atelier-panier-v1';
const PENDING_KEY = 'atelier-commande-en-cours';

function read<T>(key: string, fallback: T): T {
  try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) {
  try { if (value === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* navigation privée */ }
}

/** Une création peut être achetée en ligne : cochée, publiée, avec un prix, disponible. */
export function isSellable(creation: Creation) {
  return creation.sellOnline && Boolean(creation.price && creation.price > 0) && ['available', 'made_to_order'].includes(creation.availability);
}

/** Quantité maximale : 1 pour une pièce unique, le stock s'il est suivi, 10 pour une fabrication à la commande. */
export function maxQuantity(creation: Creation) {
  if (creation.availability === 'made_to_order') return 10;
  return creation.stock === null ? 1 : Math.max(0, creation.stock);
}

type CartContextValue = {
  lines: CartLine[];
  count: number;
  add: (id: string, quantity?: number, max?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** Référence du dernier passage au paiement non abouti (pour le libérer). */
  pendingToken: string | null;
  setPendingToken: (token: string | null) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => (typeof window === 'undefined' ? [] : read<CartLine[]>(CART_KEY, []).filter((line) => line && typeof line.id === 'string' && line.quantity > 0)));
  const [pendingToken, setPending] = useState<string | null>(() => (typeof window === 'undefined' ? null : read<string | null>(PENDING_KEY, null)));

  useEffect(() => { write(CART_KEY, lines); }, [lines]);
  // Panier modifié dans un autre onglet.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => { if (event.key === CART_KEY) setLines(read<CartLine[]>(CART_KEY, [])); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((id: string, quantity = 1, max = 10) => setLines((current) => {
    const existing = current.find((line) => line.id === id);
    if (existing) return current.map((line) => line.id === id ? { ...line, quantity: Math.min(max, line.quantity + quantity) } : line);
    return [...current, { id, quantity: Math.min(max, quantity) }];
  }), []);
  const setQuantity = useCallback((id: string, quantity: number) => setLines((current) => quantity <= 0 ? current.filter((line) => line.id !== id) : current.map((line) => line.id === id ? { ...line, quantity } : line)), []);
  const remove = useCallback((id: string) => setLines((current) => current.filter((line) => line.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);
  const setPendingToken = useCallback((token: string | null) => { setPending(token); write(PENDING_KEY, token); }, []);

  const value = useMemo(() => ({ lines, count: lines.reduce((sum, line) => sum + line.quantity, 0), add, setQuantity, remove, clear, pendingToken, setPendingToken }), [lines, add, setQuantity, remove, clear, pendingToken, setPendingToken]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart doit être utilisé dans CartProvider');
  return value;
}

/**
 * La boutique est visible quand Isabelle l'a ouverte. Avant l'ouverture, l'équipe connectée
 * la voit en aperçu pour la tester (paiements de test uniquement, vérifié côté serveur).
 */
export function useShopAccess() {
  const settings = useSiteSettings();
  const { profile, loading } = useAuth();
  const open = settings.shop_enabled === 'true';
  const preview = !open && Boolean(profile && ['admin', 'editor'].includes(profile.role));
  return { visible: open || preview, preview, loading };
}
