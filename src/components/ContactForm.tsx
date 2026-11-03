import { useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { FormPrivacyNotice } from '@/components/LegalPage';
import { useFormSubmission, useFormValidation, useHoneypot, type FormField } from '@/lib/forms';

interface ContactFormProps {
  prefilledSubject?: string;
  compact?: boolean;
}

type ContactValues = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  consent: boolean;
};

const initialValues: ContactValues = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  consent: false,
};

export default function ContactForm({ prefilledSubject = '', compact = false }: ContactFormProps) {
  const [values, setValues] = useState<ContactValues>({ ...initialValues, subject: prefilledSubject });
  const { status, errorMessage, submit, reset, isDemo } = useFormSubmission();
  const { errors, validate, clearError } = useFormValidation();
  const { honeypot, setHoneypot, isBot } = useHoneypot();

  const update = (key: keyof ContactValues, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
    if (status !== 'idle') reset();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isBot) return;
    const fields: FormField[] = [
      { name: 'name', value: values.name, required: true },
      { name: 'email', value: values.email, required: true, type: 'email' },
      { name: 'subject', value: values.subject, required: true },
      { name: 'message', value: values.message, required: true },
    ];
    if (!validate(fields)) return;
    if (!values.consent) {
      return;
    }
    const [firstName, ...lastNameParts] = values.name.trim().split(/\s+/);
    await submit({
      request_type: prefilledSubject ? 'product' : 'contact',
      first_name: firstName,
      last_name: lastNameParts.join(' ') || firstName,
      email: values.email,
      phone: values.phone,
      subject: values.subject,
      message: values.message,
      consent: 'true',
    });
  };

  if (status === 'success') {
    return (
      <div className="rounded-soft bg-sage/10 border border-sage/20 p-8 text-center animate-scale-in">
        <CheckCircle2 className="h-12 w-12 text-sage mx-auto mb-4" />
        <h2 className="text-2xl font-medium text-wood-deep mb-3">Merci pour votre message</h2>
        <p className="text-wood-deep/70 leading-relaxed mb-6">
          {isDemo
            ? "Le formulaire est actuellement en mode démonstration : aucune donnée n'a été envoyée. Pour recevoir les messages, connectez un service de formulaire."
            : "Votre message a bien été envoyé. Isabelle reviendra vers vous avec plaisir."}
        </p>
        <button onClick={() => { setValues(initialValues); reset(); }} className="btn-secondary">
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">Ne pas remplir ce champ</label>
        <input id="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Nom et prénom" id="name" required error={errors.name}>
          <input id="name" value={values.name} onChange={(e) => update('name', e.target.value)} className="input-field" autoComplete="name" />
        </Field>
        <Field label="Adresse e-mail" id="email" required error={errors.email}>
          <input id="email" type="email" value={values.email} onChange={(e) => update('email', e.target.value)} className="input-field" autoComplete="email" />
        </Field>
      </div>

      {!compact && (
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Téléphone" id="phone" hint="Facultatif">
            <input id="phone" type="tel" value={values.phone} onChange={(e) => update('phone', e.target.value)} className="input-field" autoComplete="tel" />
          </Field>
          <Field label="Objet" id="subject" required error={errors.subject}>
            <select id="subject" value={values.subject} onChange={(e) => update('subject', e.target.value)} className="input-field">
              <option value="">Choisir un objet</option>
              <option value="Une création m’intéresse">Une création m’intéresse</option>
              <option value="Demande de personnalisation">Demande de personnalisation</option>
              <option value="Question sur l’atelier">Question sur l’atelier</option>
              <option value="Autre demande">Autre demande</option>
            </select>
          </Field>
        </div>
      )}

      {compact && (
        <Field label="Objet" id="subject" required error={errors.subject}>
          <input id="subject" value={values.subject} onChange={(e) => update('subject', e.target.value)} className="input-field" />
        </Field>
      )}

      <Field label="Votre message" id="message" required error={errors.message}>
        <textarea id="message" rows={compact ? 5 : 7} value={values.message} onChange={(e) => update('message', e.target.value)} className="input-field resize-y" placeholder="Parlez-moi de votre envie, de votre question…" />
      </Field>

      <FormPrivacyNotice />
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={values.consent} onChange={(e) => update('consent', e.target.checked)} className="mt-1 h-4 w-4 accent-terracotta" />
        <span className="text-sm text-wood-deep/70 leading-relaxed">
          J’accepte que les informations saisies soient utilisées pour répondre à ma demande. <span className="text-terracotta">*</span>
        </span>
      </label>
      {!values.consent && status === 'error' && <p className="text-sm text-red-700">Votre consentement est nécessaire pour envoyer ce formulaire.</p>}

      {status === 'error' && (
        <div className="flex items-start gap-2 rounded-soft bg-red-50 border border-red-200 p-3 text-sm text-red-800" role="alert">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {errorMessage}
        </div>
      )}

      <button type="submit" disabled={status === 'submitting'} className="btn-primary w-full sm:w-auto">
        {status === 'submitting' ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours…</> : <><Send className="h-4 w-4" /> Envoyer mon message</>}
      </button>
      <p className="text-xs text-wood-deep/50">Les champs marqués d’un * sont obligatoires.</p>
    </form>
  );
}

function Field({ label, id, required, hint, error, children }: { label: string; id: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label-field">{label} {required && <span className="text-terracotta">*</span>} {hint && <span className="text-xs font-normal text-wood-deep/50">({hint})</span>}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
