import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com service_role — BYPASSA RLS. Usar APENAS no servidor
 * (jobs do Trigger.dev, webhooks, provisionamento). Nunca expor ao browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
