/**
 * Backfill único da integração Trílogo:
 *  1) casa automaticamente as unidades Bluefit por código (grava trilogo_company_id);
 *  2) importa os chamados ABERTOS como OS "agendada" (dedup por id do chamado).
 *
 * Uso:  pnpm exec tsx scripts/backfill-trilogo.mts
 * Lê credenciais e chaves do .env.local. Escreve no Supabase de produção
 * (mesmo banco do app) via service role. Idempotente — pode rodar de novo.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

import { extractUnitCode, observacoesDoChamado } from "../lib/trilogo/match";
import { TRILOGO_STATUS, type TrilogoTicket } from "../lib/trilogo/types";

const A7_TENANT = "3aa56352-4ce8-4835-a85b-8ee0f0dd7c0e";
const TRILOGO_BASE = "https://web.api.trilogo.app/api";
const PANEL_BASE = "https://bluefit.trilogo.app";

// --- carrega .env.local manualmente ---
function loadEnv() {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env: Record<string, string> = {};
  for (const line of txt.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  // 1) login Trílogo
  const loginRes = await fetch(`${TRILOGO_BASE}/Login/SignIn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ UserEmail: env.TRILOGO_EMAIL, UserPassword: env.TRILOGO_PASSWORD }),
  });
  const login = (await loginRes.json()) as { accessToken?: string; authenticated?: boolean };
  if (!login.authenticated || !login.accessToken) throw new Error("Login Trílogo falhou");
  const token = login.accessToken;

  // 2) todos os chamados
  const listRes = await fetch(`${TRILOGO_BASE}/Ticket/ListTicketsByUser`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ Offset: 0, Limit: 1000 }),
  });
  const tickets = ((await listRes.json()) as { tickets?: TrilogoTicket[] }).tickets ?? [];
  console.log(`Chamados no Trílogo: ${tickets.length}`);

  // unidades distintas
  const unidades = new Map<number, string>();
  for (const t of tickets) {
    const id = t.company?.id;
    if (id != null && !unidades.has(id)) unidades.set(id, t.companyName ?? `Unidade ${id}`);
  }
  console.log(`Unidades distintas: ${unidades.size}`);

  // 3) clientes do tenant
  const { data: clientesData } = await supabase
    .from("clients")
    .select("id, razao_social, nome_fantasia, trilogo_company_id")
    .eq("tenant_id", A7_TENANT)
    .eq("ativo", true);
  const clientes = (clientesData ?? []) as {
    id: string;
    razao_social: string;
    nome_fantasia: string | null;
    trilogo_company_id: number | null;
  }[];

  const clientePorCodigo = new Map<string, string>();
  for (const c of clientes) {
    const code = extractUnitCode(c.nome_fantasia) ?? extractUnitCode(c.razao_social);
    if (code && !clientePorCodigo.has(code)) clientePorCodigo.set(code, c.id);
  }

  // 4) auto-casamento por código (só onde ainda não há vínculo)
  const jaVinculado = new Set(
    clientes.filter((c) => c.trilogo_company_id != null).map((c) => c.trilogo_company_id),
  );
  let casados = 0;
  const semCasar: string[] = [];
  for (const [companyId, nome] of unidades) {
    if (jaVinculado.has(companyId)) continue;
    const code = extractUnitCode(nome);
    const clientId = code ? clientePorCodigo.get(code) : undefined;
    if (!clientId) {
      semCasar.push(nome);
      continue;
    }
    // libera o código antes de gravar (índice único)
    await supabase
      .from("clients")
      .update({ trilogo_company_id: null })
      .eq("tenant_id", A7_TENANT)
      .eq("trilogo_company_id", companyId);
    const { error } = await supabase
      .from("clients")
      .update({ trilogo_company_id: companyId })
      .eq("tenant_id", A7_TENANT)
      .eq("id", clientId);
    if (!error) casados += 1;
  }
  console.log(`Unidades casadas automaticamente: ${casados}`);
  if (semCasar.length) console.log(`Sem casar (${semCasar.length}):`, semCasar.join(" | "));

  // 5) mapa final company -> client
  const { data: mapData } = await supabase
    .from("clients")
    .select("id, trilogo_company_id")
    .eq("tenant_id", A7_TENANT)
    .not("trilogo_company_id", "is", null);
  const clientePorCompany = new Map<number, string>();
  for (const c of (mapData ?? []) as { id: string; trilogo_company_id: number }[]) {
    clientePorCompany.set(c.trilogo_company_id, c.id);
  }

  // 6) dedup
  const { data: exist } = await supabase
    .from("service_orders")
    .select("external_ref")
    .eq("tenant_id", A7_TENANT)
    .eq("source", "trilogo")
    .not("external_ref", "is", null);
  const jaImportados = new Set(((exist ?? []) as { external_ref: string }[]).map((r) => r.external_ref));

  // 7) importa abertos
  const abertos = tickets.filter((t) => t.status === TRILOGO_STATUS.Open);
  console.log(`Chamados abertos: ${abertos.length}`);
  let criados = 0;
  let pulados = 0;
  let semMapa = 0;
  for (const t of abertos) {
    const ref = String(t.id);
    if (jaImportados.has(ref)) {
      pulados += 1;
      continue;
    }
    const clientId = t.company?.id != null ? clientePorCompany.get(t.company.id) : undefined;
    if (!clientId) {
      semMapa += 1;
      continue;
    }
    const { error } = await supabase.from("service_orders").insert({
      tenant_id: A7_TENANT,
      client_id: clientId,
      status: "agendada",
      source: "trilogo",
      external_ref: ref,
      external_url: `${PANEL_BASE}/tickets/${t.id}`,
      observacoes: observacoesDoChamado(t),
    });
    if (error) {
      console.error(`Erro OS chamado ${ref}:`, error.message);
    } else {
      criados += 1;
    }
  }

  console.log(`\n=== RESULTADO ===`);
  console.log(`OS criadas: ${criados}`);
  console.log(`Já existiam: ${pulados}`);
  console.log(`Sem unidade casada: ${semMapa}`);

  await supabase.from("trilogo_sync_runs").insert({
    tenant_id: A7_TENANT,
    finished_at: new Date().toISOString(),
    ok: true,
    origem: "manual",
    criados,
    pulados,
    sem_mapeamento: semMapa,
    erros: 0,
    mensagem: `Backfill: ${criados} criadas, ${casados} unidades casadas.`,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
