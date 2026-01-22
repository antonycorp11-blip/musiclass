
import { createClient } from '@supabase/supabase-js';

// Use environment variables if available (standard for Vite/Vercel)
// Fallback to the hardcoded ones if not set (for immediate functioning)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wayigtlilhvutbfvxgae.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YP9wwSLwb5yIl6mX9ebAmg_IB3xDd4L';

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or Key is missing. Check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
