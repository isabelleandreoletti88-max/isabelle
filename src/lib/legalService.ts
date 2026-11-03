import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type LegalSetting = {
  setting_key: string;
  setting_value: unknown;
  category: string;
  is_required: boolean;
  is_completed: boolean;
};

export type LegalDocument = {
  id: string;
  document_type: string;
  title: string;
  slug: string;
  content: string | null;
  status: 'draft' | 'published' | 'disabled';
  version: number;
  effective_date: string | null;
  published_at: string | null;
  updated_at: string;
};

export type LegalSettingsMap = Record<string, string>;

function asString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try { return JSON.stringify(value); } catch { return ''; }
}

export function useLegalSettings() {
  const [settings, setSettings] = useState<LegalSettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    supabase.from('legal_settings').select('setting_key,setting_value,category,is_required,is_completed')
      .then(({ data, error: err }) => {
        if (!active) return;
        if (err) { setError('Impossible de charger les paramètres légaux.'); setLoading(false); return; }
        const map: LegalSettingsMap = {};
        for (const row of (data as LegalSetting[] | null) ?? []) map[row.setting_key] = asString(row.setting_value);
        setSettings(map);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);
  return { settings, loading, error };
}

export function useLegalDocument(documentType: string) {
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    supabase.from('legal_documents').select('*').eq('document_type', documentType).maybeSingle()
      .then(({ data }) => { if (active) { setDoc((data as LegalDocument | null) ?? null); setLoading(false); } });
    return () => { active = false; };
  }, [documentType]);
  return { doc, loading };
}

export async function saveLegalSettings(updates: Record<string, string>) {
  const rows = Object.entries(updates).map(([key, value]) => ({ setting_key: key, setting_value: JSON.stringify(value), is_completed: Boolean(value) }));
  for (const row of rows) {
    const { error } = await supabase.from('legal_settings').update({ setting_value: row.setting_value, is_completed: row.is_completed }).eq('setting_key', row.setting_key);
    if (error) throw new Error('Une erreur est survenue lors de l\'enregistrement.');
  }
}

export async function saveLegalDocument(documentType: string, content: string, status: LegalDocument['status']) {
  const { data: existing } = await supabase.from('legal_documents').select('id,version').eq('document_type', documentType).maybeSingle();
  if (!existing) throw new Error('Document introuvable.');
  const nextVersion = (existing.version ?? 0) + 1;
  await supabase.from('legal_document_versions').insert({ document_id: existing.id, version: existing.version, content });
  const { error } = await supabase.from('legal_documents').update({ content, status, version: nextVersion, effective_date: new Date().toISOString().slice(0, 10), published_at: status === 'published' ? new Date().toISOString() : null }).eq('id', existing.id);
  if (error) throw new Error('La mise à jour du document a échoué.');
}
