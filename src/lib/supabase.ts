import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin' | 'editor';
}
