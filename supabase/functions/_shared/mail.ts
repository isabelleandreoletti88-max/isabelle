// Envoi d'e-mails par la boîte de l'atelier (SMTP Hostinger), partagé par les fonctions.
// Secret requis : SMTP_PASSWORD. Facultatifs : SMTP_USER, SMTP_HOST, SMTP_PORT.
import nodemailer from 'npm:nodemailer@6.9.16';

export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function smtpUser() {
  return (Deno.env.get('SMTP_USER') || 'contact@atelier-isabelle.fr').trim().toLowerCase();
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
  await transport.sendMail({ from: `"L'Atelier d'Isabelle" <${user}>`, ...message, subject: message.subject.slice(0, 180) });
}
