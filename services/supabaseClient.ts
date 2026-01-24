import { createClient } from '@supabase/supabase-js';

// Vite uses import.meta.env instead of process.env
// NOTE: Replace values in .env file with your actual Supabase project credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// [3] 런타임 env 확인 (Vite: .env 변경 후 dev 서버 재시작 필요)
if (import.meta.env.DEV) {
  const u = import.meta.env.VITE_SUPABASE_URL;
  const k = import.meta.env.VITE_SUPABASE_ANON_KEY;
  console.log('[Supabase] VITE_SUPABASE_URL:', u === undefined || u === '' ? 'undefined or empty' : (u === 'https://your-project.supabase.co' ? 'placeholder' : 'configured'));
  console.log('[Supabase] VITE_SUPABASE_ANON_KEY:', k === undefined || k === '' ? 'undefined or empty' : (k === 'your-anon-key' ? 'placeholder' : 'set'));
}

export const isSupabaseConfigured = () => {
  return import.meta.env.VITE_SUPABASE_URL &&
         import.meta.env.VITE_SUPABASE_ANON_KEY &&
         import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co';
};