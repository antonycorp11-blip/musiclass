
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wayigtlilhvutbfvxgae.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YP9wwSLwb5yIl6mX9ebAmg_IB3xDd4L';

if (!import.meta.env.VITE_SUPABASE_URL) {
    console.warn("⚠️ MusiClass: Usando Configuração de Fallback (Automática).");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
