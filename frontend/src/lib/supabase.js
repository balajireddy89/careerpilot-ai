import { createClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from './config';

export { isSupabaseConfigured };

export const supabase = isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;
