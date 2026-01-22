
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wayigtlilhvutbfvxgae.supabase.co';
const supabaseKey = 'sb_publishable_YP9wwSLwb5yIl6mX9ebAmg_IB3xDd4L';

export const supabase = createClient(supabaseUrl, supabaseKey);
