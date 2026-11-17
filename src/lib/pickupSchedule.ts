/**
 * Jours où Isabelle est présente au lieu de retrait, réglés dans Admin → Paramètres de livraison.
 * Enregistrés dans le réglage `shop_pickup_schedule` (JSON) ; affichés dans la fiche, le panier,
 * la confirmation de commande, les e-mails et la politique de livraison.
 */
export type PickupDay = { day: string; open: boolean; hours: string };

export const WEEK_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export function parseSchedule(value: string | null | undefined): PickupDay[] {
  let saved: Partial<PickupDay>[] = [];
  try { const parsed = JSON.parse(value || '[]'); if (Array.isArray(parsed)) saved = parsed; } catch { /* réglage vide ou ancien */ }
  return WEEK_DAYS.map((day) => {
    const found = saved.find((item) => item?.day === day);
    return { day, open: Boolean(found?.open), hours: String(found?.hours ?? '').slice(0, 80) };
  });
}

/** « Mercredi : 14 h – 18 h » pour chaque jour de présence. */
export function scheduleLines(value: string | null | undefined): string[] {
  return parseSchedule(value).filter((d) => d.open).map((d) => (d.hours.trim() ? `${d.day} : ${d.hours.trim()}` : d.day));
}

/** Le retrait gratuit est proposé dès qu'il est activé ; sans lieu renseigné, Isabelle l'indique par e-mail. */
export function pickupAvailable(settings: { shop_pickup_enabled: string }) {
  return settings.shop_pickup_enabled !== 'false';
}
