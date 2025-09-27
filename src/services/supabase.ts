import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Only create client if we have real credentials
export const supabase = (supabaseUrl && supabaseKey && supabaseUrl !== '' && supabaseKey !== '')
    ? createClient(supabaseUrl, supabaseKey)
    : null as any;

// Export a helper to check if supabase is configured
export const isSupabaseConfigured = () => {
    return supabase !== null;
};