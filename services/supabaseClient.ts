import { createClient } from '@supabase/supabase-js';

// Vite uses import.meta.env instead of process.env
// NOTE: Replace values in .env file with your actual Supabase project credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isSupabaseConfigured = () => {
  // Temporarily disabled to use localStorage for file uploads
  // Re-enable when Supabase storage bucket and documents table are properly configured
  return false;

  // Original implementation:
  // return import.meta.env.VITE_SUPABASE_URL &&
  //        import.meta.env.VITE_SUPABASE_ANON_KEY &&
  //        import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co';
};