import { createClient } from '@supabase/supabase-js';

// Vite uses import.meta.env instead of process.env
// NOTE: Replace values in .env file with your actual Supabase project credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isSupabaseConfigured = () => {
  // TEMPORARY: Force localStorage mode for emergency deployment
  // TODO: Re-enable Supabase after CORS issue is resolved
  return false;

  // Original implementation (uncomment when ready):
  // return import.meta.env.VITE_SUPABASE_URL &&
  //        import.meta.env.VITE_SUPABASE_ANON_KEY &&
  //        import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co';
};