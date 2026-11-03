import { useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { FormPrivacyNotice } from '@/components/LegalPage';
import { useFormSubmission, useFormValidation, useHoneypot, type FormField } from '@/lib/forms';

export default function CustomOrderForm() {
  const [values, setValues] = useState({ name: '', firstName: '', email: '', phone: '', type: '', occasion: '', text: '', colors: '', dimensions: '', budget: '', date: '', description: '', consent: false });
  const { status, errorMessage, submit, reset, isDemo } = useFormSubmission();
  const { errors, validate, clearError } = useFormValidation();
  const { honeypot, setHoneypot, isBot } = useHoneypot();
  const update = (key: keyof typeof values, value: string | boolean) => { setValues((v) => ({ ...v, [key]: value })); clearError(key); if (status !== 'idle') reset(); };
  const submitForm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (isBot) return;
    const fields: FormField[] = [{ name: 'name', value: values.name, required: true }, { name: 'firstName', value: values.firstName, required: true }, { name: 'email', value: values.email, required: true, type: 'email' }, { name: 'type', value: values.type, required: true }, { name: 'description', value: values.description, required: true }];
    if (!validate(fields) || !values.consent) return;
    await submit({
      request_type: 'custom_order',
      first_name: values.firstName,
      last_name: values.name,
      email: values.email,
      phone: values.phone,
      subject: `Demande personnalisée${values.occasion ? ` — ${values.occasion}` : ''}`,
      message: values.description,
      occasion: values.occasion,
      desired_colors: values.colors,
      desired_dimensions: values.dimensions,
      budget: values.budget,
      desired_date: values.date,
      consent: 'true',
    });
  };
  if (status === 'success') return <div className="rounded-soft bg-sage/10 border border-sage/20 p-8 text-center animate-scale-in"><CheckCircle2 className="h-12 w-12 text-sage mx-auto mb-4" /><h2 className="text-2xl font-medium mb-3">Votre idée est bien notée</h2><p className="text-wood-deep/70 leading-relaxed mb-6">{isDemo ? "Le formulaire est en mode démonstration : rien n'a été envoyé. Connectez un service pour recevoir les demandes." : 'Isabelle reviendra vers vous pour échanger sur votre projet, sa faisabilité, son tarif et son délai.'}</p><button onClick={() => { setValues({ name: '', firstName: '', email: '', phone: '', type: '', occasion: '', text: '', colors: '', dimensions: '', budget: '', date: '', description: '', consent: false }); reset(); }} className="btn-secondary">Envoyer une autre demande</button></div>;
  return <form onSubmit={submitForm} className="space-y-5" noValidate>
    <div className="absolute -left-[9999px]" aria-hidden="true"><label htmlFor="company">Ne pas remplir</label><input id="company" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} /></div>
    <div className="grid sm:grid-cols-2 gap-5"><Field label="Nom" id="name" required error={errors.name}><input id="name" value={values.name} onChange={(e) => update('name', e.target.value)} className="input-field" autoComplete="family-name" /></Field><Field label="Prénom" id="firstName" required error={errors.firstName}><input id="firstName" value={values.firstName} onChange={(e) => update('firstName', e.target.value)} className="input-field" autoComplete="given-name" /></Field></div>
    <div className="grid sm:grid-cols-2 gap-5"><Field label="Adresse e-mail" id="email" required error={errors.email}><input id="email" type="email" value={values.email} onChange={(e) => update('email', e.target.value)} className="input-field" autoComplete="email" /></Field><Field label="Téléphone" id="phone" hint="Facultatif"><input id="phone" type="tel" value={values.phone} onChange={(e) => update('phone', e.target.value)} className="input-field" autoComplete="tel" /></Field></div>
    <div className="grid sm:grid-cols-2 gap-5"><Field label="Type de création" id="type" required error={errors.type}><select id="type" value={values.type} onChange={(e) => update('type', e.target.value)} className="input-field"><option value="">Choisir une matière</option><option>Décoration en galets</option><option>Cadre en bois</option><option>Composition en papier</option><option>Création en fil de fer</option><option>Je ne sais pas encore</option></select></Field><Field label="Occasion" id="occasion" hint="Facultatif"><input id="occasion" value={values.occasion} onChange={(e) => update('occasion', e.target.value)} className="input-field" placeholder="Naissance, anniversaire…" /></Field></div>
    <div className="grid sm:grid-cols-2 gap-5"><Field label="Prénom ou texte à intégrer" id="text" hint="Facultatif"><input id="text" value={values.text} onChange={(e) => update('text', e.target.value)} className="input-field" /></Field><Field label="Couleurs souhaitées" id="colors" hint="Facultatif"><input id="colors" value={values.colors} onChange={(e) => update('colors', e.target.value)} className="input-field" placeholder="Douces, terracotta…" /></Field></div>
    <div className="grid sm:grid-cols-2 gap-5"><Field label="Dimensions souhaitées" id="dimensions" hint="Facultatif"><input id="dimensions" value={values.dimensions} onChange={(e) => update('dimensions', e.target.value)} className="input-field" /></Field><Field label="Budget indicatif" id="budget" hint="Facultatif"><input id="budget" value={values.budget} onChange={(e) => update('budget', e.target.value)} className="input-field" placeholder="Ex. 40 €" /></Field></div><div className="grid sm:grid-cols-2 gap-5"><Field label="Date souhaitée" id="date" hint="Facultatif"><input id="date" type="date" value={values.date} onChange={(e) => update('date', e.target.value)} className="input-field" /></Field></div>
    <Field label="Décrivez votre idée" id="description" required error={errors.description}><textarea id="description" rows={6} value={values.description} onChange={(e) => update('description', e.target.value)} className="input-field resize-y" placeholder="Racontez-moi votre projet, même s'il n'est pas encore très précis…" /></Field>
    <p className="text-sm text-wood-deep/60 bg-beige/30 rounded-soft p-4">L’envoi de ce formulaire ne vaut pas validation définitive de la commande. Isabelle reprendra contact avec vous pour confirmer la faisabilité, le tarif et le délai.</p>
    <FormPrivacyNotice kind="custom" />
    <label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={values.consent} onChange={(e) => update('consent', e.target.checked)} className="mt-1 h-4 w-4 accent-terracotta" /><span className="text-sm text-wood-deep/70">J’accepte que les informations saisies soient utilisées pour répondre à ma demande. <span className="text-terracotta">*</span></span></label>
    {status === 'error' && <div className="flex gap-2 rounded-soft bg-red-50 border border-red-200 p-3 text-sm text-red-800" role="alert"><AlertCircle className="h-4 w-4 shrink-0" />{errorMessage}</div>}
    <button type="submit" disabled={status === 'submitting'} className="btn-primary">{status === 'submitting' ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours…</> : <><Send className="h-4 w-4" /> Envoyer ma demande</>}</button>
  </form>;
}
function Field({ label, id, required, hint, error, children }: { label: string; id: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) { return <div><label htmlFor={id} className="label-field">{label} {required && <span className="text-terracotta">*</span>} {hint && <span className="text-xs font-normal text-wood-deep/50">({hint})</span>}</label>{children}{error && <p className="mt-1 text-xs text-red-700">{error}</p>}</div>; }
