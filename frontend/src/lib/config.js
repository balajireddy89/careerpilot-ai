/**
 * Frontend env config — loaded from frontend/.env.local or frontend/.env
 * (Vite exposes only variables prefixed with VITE_)
 *
 * Required:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *   VITE_OPENROUTER_API_KEY  — same OpenRouter key as backend application.properties
 */
export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '',
  openRouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY?.trim() || '',
  openRouterModel: import.meta.env.VITE_OPENROUTER_MODEL?.trim() || 'gpt-oss-120b',
};

export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);

export const isOpenRouterConfigured = Boolean(config.openRouterApiKey);

export function getMissingConfigKeys() {
  const missing = [];
  if (!config.supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!config.supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!config.openRouterApiKey) missing.push('VITE_OPENROUTER_API_KEY');
  return missing;
}
