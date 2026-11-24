// Envoi d'e-mails par la boîte de l'atelier (SMTP Hostinger), partagé par les fonctions.
// Secret requis : SMTP_PASSWORD. Facultatifs : SMTP_USER, SMTP_HOST, SMTP_PORT.
import nodemailer from 'npm:nodemailer@6.9.16';

export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function smtpUser() {
  return (Deno.env.get('SMTP_USER') || 'contact@atelier-isabelle.fr').trim().toLowerCase();
}

/**
 * Page HTML complète (doctype, langue, encodage, titre) : les filtres anti-spam pénalisent
 * les e-mails composés d'un simple fragment HTML.
 */
function htmlDocument(subject: string, body: string) {
  if (/^\s*<!doctype/i.test(body)) return body;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#FBF3E4">
${body}
</body>
</html>`;
}

export async function sendMail(message: { to: string; subject: string; html: string; text: string; replyTo?: string }) {
  const password = Deno.env.get('SMTP_PASSWORD')?.trim();
  if (!password) throw new Error('SMTP_PASSWORD non configuré');
  const user = smtpUser();
  const transport = nodemailer.createTransport({
    host: Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com',
    port: Number(Deno.env.get('SMTP_PORT') || 465),
    secure: true,
    auth: { user, pass: password },
  });
  const subject = message.subject.slice(0, 180);
  await transport.sendMail({
    from: { name: "L'Atelier d'Isabelle", address: user },
    to: message.to,
    replyTo: message.replyTo,
    subject,
    text: message.text,
    html: htmlDocument(subject, message.html),
    // E-mail transactionnel (suite à une commande) : pas une campagne, pas de réponse automatique.
    headers: { 'Auto-Submitted': 'auto-generated', 'X-Auto-Response-Suppress': 'OOF, AutoReply' },
  });
}
