import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

/**
 * Teste de isolamento multi-tenant: um usuário do tenant A NÃO pode enxergar
 * dados do tenant B (RLS). É um teste de INTEGRAÇÃO — só roda quando há um
 * banco de teste configurado. No CI sem essas envs, ele é pulado (verde).
 *
 * Para rodar localmente contra um Supabase de teste:
 *   TEST_SUPABASE_URL=... TEST_SUPABASE_ANON_KEY=... \
 *   TEST_A_EMAIL=... TEST_A_PASSWORD=... TEST_B_TENANT_ID=... pnpm test
 */
const url = process.env.TEST_SUPABASE_URL;
const anon = process.env.TEST_SUPABASE_ANON_KEY;
const aEmail = process.env.TEST_A_EMAIL;
const aPassword = process.env.TEST_A_PASSWORD;
const bTenantId = process.env.TEST_B_TENANT_ID;

const ready = Boolean(url && anon && aEmail && aPassword && bTenantId);

describe.skipIf(!ready)("isolamento multi-tenant (RLS)", () => {
  it("usuário do tenant A não lê tenant B", async () => {
    const supabase = createClient(url!, anon!);
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: aEmail!,
      password: aPassword!,
    });
    expect(authErr).toBeNull();

    // Tenta ler explicitamente o tenant B — RLS deve devolver vazio.
    const { data } = await supabase
      .from("tenants")
      .select("id")
      .eq("id", bTenantId!);

    expect(data ?? []).toHaveLength(0);
  });
});
