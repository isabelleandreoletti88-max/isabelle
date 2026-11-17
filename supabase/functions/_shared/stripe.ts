// Accès à l'API Stripe et à la base, partagé par les fonctions de la boutique.
// La clé secrète Stripe (STRIPE_SECRET_KEY) n'existe que dans les secrets des fonctions Supabase.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.57.4';

export const SITE_URL = 'https://atelier-isabelle.fr';
export const STRIPE_VERSION = '2024-06-20';
// Adresse de l'API Stripe. STRIPE_API_BASE ne sert qu'aux tests automatisés (faux serveur Stripe local).
const STRIPE_API = Deno.env.get('STRIPE_API_BASE') || 'https://api.stripe.com';

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
}

export function stripeKey() {
  return Deno.env.get('STRIPE_SECRET_KEY') || '';
}

export class StripeError extends Error {
  constructor(message: string, public code?: string, public status?: number) { super(message); }
}

/** Encode les paramètres au format attendu par Stripe (a[b][0]=c). */
function encode(value: unknown, prefix: string, out: URLSearchParams) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) value.forEach((item, index) => encode(item, `${prefix}[${index}]`, out));
  else if (typeof value === 'object') for (const [key, inner] of Object.entries(value)) encode(inner, prefix ? `${prefix}[${key}]` : key, out);
  else out.append(prefix, String(value));
}

export async function stripe<T = Record<string, unknown>>(method: 'GET' | 'POST' | 'DELETE', path: string, params?: Record<string, unknown>): Promise<T> {
  const key = stripeKey();
  if (!key) throw new StripeError('La clé Stripe n’est pas encore configurée.', 'not_configured');
  const body = new URLSearchParams();
  if (params) encode(params, '', body);
  const url = `${STRIPE_API}/v1/${path}${method === 'GET' && params ? `?${body}` : ''}`;
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${key}`, 'Stripe-Version': STRIPE_VERSION, ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: method === 'POST' ? body : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new StripeError(json?.error?.message || `Erreur Stripe ${res.status}`, json?.error?.code, res.status);
  return json as T;
}

/** « test » ou « live » selon la clé configurée. */
export function stripeMode(): 'test' | 'live' {
  const key = stripeKey();
  return key.startsWith('sk_live') || key.startsWith('rk_live') ? 'live' : 'test';
}

/** Vérifie que l'appelant est connecté à l'administration (rôle admin ou éditeur). */
export async function isStaff(db: SupabaseClient, req: Request) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const { data } = await db.auth.getUser(token);
  if (!data.user) return false;
  const { data: profile } = await db.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  return profile?.role === 'admin' || profile?.role === 'editor';
}

export async function getConfig(db: SupabaseClient, key: string): Promise<string | null> {
  const { data } = await db.rpc('stripe_config_get', { config_key: key });
  return (data as string | null) ?? null;
}

export async function setConfig(db: SupabaseClient, key: string, value: string) {
  const { error } = await db.rpc('stripe_config_set', { config_key: key, config_value: value });
  if (error) throw new Error(`Configuration non enregistrée : ${error.message}`);
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
