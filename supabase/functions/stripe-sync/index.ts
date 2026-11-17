// État de la connexion Stripe pour l'administration (équipe connectée uniquement).
//   { action: 'status' }  vérifie la clé, le compte, et crée ou met à jour automatiquement le point
//                         de réception des paiements (webhook) pour le mode en cours (test ou réel).
// Les prix ne sont plus synchronisés création par création : la session de paiement est calculée
// à chaque commande depuis le catalogue (fonction checkout-create).
import { adminClient, corsHeaders, ensureWebhook, isStaff, json, stripe, stripeKey, stripeMode } from '../_shared/stripe.ts';
import { loadShopSettings } from '../_shared/shop.ts';

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
