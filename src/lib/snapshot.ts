/**
 * Données embarquées dans les pages pré-générées.
 *
 * Pendant la pré-génération (scripts/prerender.cjs), chaque chargement de données est noté
 * (window.__DATA_SNAPSHOT__) puis écrit dans la page sous forme d'un bloc <script id="__DATA__">.
 * À l'ouverture de la page, l'application affiche immédiatement ces données (pas d'écran
 * « Chargement… », pas de saut de mise en page), puis les rafraîchit depuis Supabase.
 */
type Store = Record<string, unknown>;
type Win = { __PRERENDER__?: boolean; __DATA_SNAPSHOT__?: Store };

const win = typeof window === 'undefined' ? undefined : (window as unknown as Win);
let embedded: Store = {};
if (win) {
  try {
    const element = document.getElementById('__DATA__');
    if (element?.textContent) embedded = JSON.parse(element.textContent) as Store;
  } catch { /* bloc absent ou illisible : chargement normal */ }
}

/** Valeur embarquée dans la page pour cette clé, si elle existe. */
export function fromSnapshot<T>(key: string): T | undefined {
  return embedded[key] as T | undefined;
}

/** Charge une donnée et, pendant la pré-génération, la note pour l'embarquer dans la page. */
export async function withSnapshot<T>(key: string, load: () => Promise<T>): Promise<T> {
  const value = await load();
  if (win?.__PRERENDER__) (win.__DATA_SNAPSHOT__ ??= {})[key] = value;
  return value;
}
