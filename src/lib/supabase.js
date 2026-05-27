import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Client is null if credentials are missing — app falls back to localStorage
export const supabase = (url && key) ? createClient(url, key) : null;

export const isSupabaseReady = !!(url && key);
