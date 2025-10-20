import { createClient } from '@supabase/supabase-js';

// Remplacez ces valeurs par vos vraies clés Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://votre-projet.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'votre-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;