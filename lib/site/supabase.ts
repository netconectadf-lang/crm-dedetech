import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase do navegador para a vitrine.
 * Usa a anon key (pública) do MESMO projeto do sistema (dedetech-crm),
 * apenas para o fluxo de cadastro (auth.signUp + provisionamento do tenant).
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
