import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase ADMIN (service role) — SÓ no servidor.
 * Usa a service key, que ignora RLS. Nunca importe em código de navegador.
 *
 * É LAZY (criado no primeiro uso) de propósito: assim o módulo pode ser
 * importado no build mesmo sem a env SUPABASE_SERVICE_ROLE_KEY definida —
 * o cliente só é instanciado quando a rota /api/whatsapp roda de fato.
 */
let _client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return _client;
}
