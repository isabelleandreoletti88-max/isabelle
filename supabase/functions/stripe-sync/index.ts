// État de la connexion Stripe pour l'administration (équipe connectée uniquement).
//   { action: 'status' }  vérifie la clé, le compte, et crée ou met à jour automatiquement le point
//                         de réception des paiements (webhook) pour le mode en cours (test ou réel).
// Les prix ne sont plus synchronisés création par création : la session de paiement est calculée
// à chaque commande depuis le catalogue (fonction checkout-create).
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.57.4';
import { STRIPE_VERSION, adminClient, corsHeaders, getConfig, isStaff, json, setConfig, stripe, stripeKey, stripeMode } from '../_shared/stripe.ts';
import { loadShopSettings } from '../_shared/shop.ts';

const EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired', 'charge.refunded'];

async function ensureWebhook(db: SupabaseClient) {
  const key = `webhook_${stripeMode()}`;
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/stripe-webhook`;
  const existing = await getConfig(db, `${key}_id`);
  if (existing) {
    try {
      const endpoint = await stripe<{ status: string; url: string; enabled_events: string[] }>('GET', `webhook_endpoints/${existing}`);
      if (endpoint.url === url) {
        if (endpoint.status !== 'enabled' || EVENTS.some((event) => !endpoint.enabled_events.includes(event))) await stripe('POST', `webhook_endpoints/${existing}`, { enabled_events: EVENTS, disabled: false });
        return;
      }
    } catch { /* supprimé dans Stripe : recréé ci-dessous */ }
  }
  const endpoint = await stripe<{ id: string; secret: string }>('POST', 'webhook_endpoints', { url, enabled_events: EVENTS, api_version: STRIPE_VERSION, description: 'atelier-isabelle.fr — commandes' });
  await setConfig(db, `${key}_id`, endpoint.id);
  await setConfig(db, `${key}_secret`, endpoint.secret);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const db = adminClient();
  if (!(await isStaff(db, req))) return json({ error: 'Accès réservé à l’administration.' }, 403);
  if (!stripeKey()) return json({ configured: false });
  try {
    const account = await stripe<{ settings?: { dashboard?: { display_name?: string } }; business_profile?: { name?: string }; charges_enabled?: boolean }>('GET', 'account');
    await ensureWebhook(db);
    const settings = await loadShopSettings(db);
    return json({ configured: true, mode: stripeMode(), account: account.settings?.dashboard?.display_name || account.business_profile?.name || '', charges_enabled: account.charges_enabled ?? true, shop_enabled: settings.enabled });
  } catch (error) {
    return json({ configured: true, mode: stripeMode(), error: (error as Error).message });
  }
});
