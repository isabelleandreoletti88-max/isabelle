import { useState, useCallback, type FormEvent } from 'react';
import { formConfig } from '@/config/site';
import { supabase } from '@/lib/supabase';

export type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface FormField {
  name: string;
  value: string;
  required: boolean;
  type?: string;
}

/**
 * Abstraction de soumission de formulaire.
 *
 * En mode démonstration (endpoint vide), aucune donnée n'est envoyée :
 * on simule un délai et un succès, en informant clairement l'utilisateur.
 * Pour activer l'envoi réel, renseigner `formConfig.endpoint` dans
 * src/config/site.ts (Formspree, Netlify Forms, API personnalisée…).
 */
export function useFormSubmission() {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const submit = useCallback(
    async (data: Record<string, string>) => {
      setStatus('submitting');
      setErrorMessage('');

      try {
        if (!formConfig.endpoint) {
          const { error } = await supabase.from('contact_requests').insert(data);
          if (error) throw new Error('request_failed');
          setStatus('success');
          return;
        }

        const res = await fetch(formConfig.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error('Échec de l’envoi');

        setStatus('success');
      } catch {
        setStatus('error');
        setErrorMessage(
          "Une erreur est survenue. Vous pouvez réessayer ou écrire directement à l'adresse de contact."
        );
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setErrorMessage('');
  }, []);

  return { status, errorMessage, submit, reset, isDemo: false };
}

/** Validation simple des champs. */
export function validateField(field: FormField): string | null {
  if (field.required && !field.value.trim()) {
    return 'Ce champ est obligatoire.';
  }
  if (field.type === 'email' && field.value) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
      return "L'adresse e-mail n'est pas valide.";
    }
  }
  if (field.type === 'tel' && field.value) {
    if (!/^[0-9+\s().-]{6,}$/.test(field.value)) {
      return 'Le numéro de téléphone n’est pas valide.';
    }
  }
  return null;
}

export function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((fields: FormField[]): boolean => {
    const newErrors: Record<string, string> = {};
    for (const f of fields) {
      const err = validateField(f);
      if (err) newErrors[f.name] = err;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const clearError = useCallback((name: string) => {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  return { errors, validate, clearError };
}

/** Honeypot antispam simple. */
export function useHoneypot() {
  const [honeypot, setHoneypot] = useState('');
  const isBot = honeypot !== '';
  return { honeypot, setHoneypot, isBot };
}

export function preventDefaultSubmit(e: FormEvent) {
  e.preventDefault();
}
