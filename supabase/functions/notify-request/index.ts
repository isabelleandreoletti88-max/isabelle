// Envoie un e-mail à l'atelier pour chaque nouvelle demande des formulaires du site.
// Appelée par le site juste après l'enregistrement de la demande, avec son identifiant.
// L'e-mail part de contact@atelier-isabelle.fr (SMTP Hostinger) ; « Répondre » écrit au client.
//
// Secret requis (Supabase > Edge Functions > Secrets) : SMTP_PASSWORD, mot de passe de la boîte.
// Facultatifs : SMTP_USER (défaut contact@atelier-isabelle.fr), SMTP_HOST, SMTP_PORT.
import nodemailer from 'npm:nodemailer@6.9.16';
import { adminClient, corsHeaders, json } from '../_shared/stripe.ts';

const typeLabel: Record<string, string> = { contact: 'Message', product: 'Question sur une création', custom_order: 'Demande de création personnalisée' };

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  let id = '';
  try { id = String((await req.json()).id || ''); } catch { /* corps invalide */ }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'Identifiant invalide.' }, 400);

  const db = adminClient();
  const { data: request } = await db.from('contact_requests').select('*').eq('id', id).maybeSingle();
  // Seules les demandes toutes récentes, jamais notifiées, déclenchent un envoi.
  if (!request || request.notified_at || Date.now() - new Date(request.created_at).getTime() > 15 * 60 * 1000) return json({ sent: false });

  const password = Deno.env.get('SMTP_PASSWORD');
  if (!password) {
    await db.from('contact_requests').update({ notify_error: 'SMTP_PASSWORD non configuré' }).eq('id', id);
    return json({ sent: false, reason: 'not_configured' });
  }

  const user = Deno.env.get('SMTP_USER') || 'contact@atelier-isabelle.fr';
  const { data: setting } = await db.from('site_settings').select('setting_value').eq('setting_key', 'notification_email').maybeSingle();
  const to = String(setting?.setting_value || user);

  const rows: [string, string | null][] = [
    ['Nom', `${request.first_name} ${request.last_name}`],
    ['E-mail', request.email],
    ['Téléphone', request.phone],
    ['Création concernée', request.product_name],
    ['Occasion', request.occasion],
    ['Couleurs souhaitées', request.desired_colors],
    ['Dimensions souhaitées', request.desired_dimensions],
    ['Budget', request.budget],
    ['Date souhaitée', request.desired_date],
  ];
  const filled = rows.filter(([, value]) => value && String(value).trim());
  const kind = typeLabel[request.request_type] || 'Demande';
  const text = `${kind} reçue sur atelier-isabelle.fr\n\nObjet : ${request.subject}\n\n${filled.map(([k, v]) => `${k} : ${v}`).join('\n')}\n\nMessage :\n${request.message}\n\nRépondez directement à cet e-mail pour écrire à ${request.first_name}.\nToutes les demandes : https://atelier-isabelle.fr/admin/demandes`;
  const html = `<div style="font-family:Georgia,serif;color:#49372B;max-width:600px">
<h2 style="font-weight:normal;margin:0 0 4px">${escapeHtml(kind)}</h2>
<p style="color:#7a6a5d;margin:0 0 20px">Reçue sur atelier-isabelle.fr — ${escapeHtml(request.subject)}</p>
<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${filled.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#7a6a5d;vertical-align:top">${escapeHtml(k)}</td><td style="padding:4px 0">${escapeHtml(String(v))}</td></tr>`).join('')}</table>
<p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap;background:#F8F3EA;padding:16px;border-radius:8px;margin:20px 0">${escapeHtml(request.message)}</p>
<p style="font-family:Arial,sans-serif;font-size:13px;color:#7a6a5d">Répondez directement à cet e-mail pour écrire à ${escapeHtml(request.first_name)}.<br><a href="https://atelier-isabelle.fr/admin/demandes" style="color:#C77C5D">Voir toutes les demandes</a></p></div>`;

  try {
    const transport = nodemailer.createTransport({
      host: Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com',
      port: Number(Deno.env.get('SMTP_PORT') || 465),
      secure: true,
      auth: { user, pass: password },
    });
    await transport.sendMail({
      from: `"L'Atelier d'Isabelle — site" <${user}>`,
      to,
      replyTo: `"${request.first_name} ${request.last_name}" <${request.email}>`,
      subject: `${kind} — ${request.first_name} ${request.last_name} : ${request.subject}`.slice(0, 180),
      text,
      html,
    });
    await db.from('contact_requests').update({ notified_at: new Date().toISOString(), notify_error: null }).eq('id', id);
    return json({ sent: true });
  } catch (error) {
    await db.from('contact_requests').update({ notify_error: (error as Error).message.slice(0, 300) }).eq('id', id);
    return json({ sent: false, error: 'Envoi impossible' }, 500);
  }
});
