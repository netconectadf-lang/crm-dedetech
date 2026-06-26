/**
 * Verificações pré-produção da camada de entitlements (read-only).
 * Uso: pnpm dlx tsx --env-file=.env.local scripts/verify-entitlements.mts
 * Service role — bypassa RLS, só rodar local. NÃO escreve nada.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env.local");
const sb = createClient(url, key, { auth: { persistSession: false } });

// ── TAREFA 1a: tenants sem subscription (órfãos) ──────────────────────────────
const { data: tenants, error: tErr } = await sb.from("tenants").select("id, razao_social");
if (tErr) throw tErr;
const { data: subs, error: sErr } = await sb.from("subscriptions").select("id, tenant_id");
if (sErr) throw sErr;
const subTenantIds = new Set((subs ?? []).map((s) => s.tenant_id));
const orphans = (tenants ?? []).filter((t) => !subTenantIds.has(t.id));

console.log("\n========== TAREFA 1a — tenants SEM subscription ==========");
console.log(`tenants totais: ${tenants?.length ?? 0} | subscriptions: ${subs?.length ?? 0}`);
console.log(`órfãos: ${orphans.length}`);
for (const o of orphans) console.log(`  - ${o.id}  ${o.razao_social}`);
if (orphans.length === 0) console.log("  (nenhum órfão — backfill será no-op)");

// ── TAREFA 2: plans ativos vs catálogo ────────────────────────────────────────
const CATALOG = ["os","funil","agenda","nfse","estoque","cobranca","whatsapp","contratos","financeiro","rh","gps","mip","portal"];
const { data: plans, error: pErr } = await sb
  .from("plans")
  .select("nome, ativo, preco_mensal_cents, features, limite_usuarios, limite_os_mes, limite_storage_gb")
  .eq("ativo", true)
  .order("preco_mensal_cents", { ascending: true });
if (pErr) throw pErr;

console.log("\n========== TAREFA 2 — plans ativos vs .cortex/features.catalog.json ==========");
console.log(`catálogo (${CATALOG.length} keys): ${CATALOG.join(", ")}`);
const allUnknown = new Set<string>();
for (const p of plans ?? []) {
  const raw = p.features;
  const keys = Array.isArray(raw)
    ? (raw as unknown[]).filter((k) => typeof k === "string") as string[]
    : raw && typeof raw === "object"
      ? Object.entries(raw as Record<string, unknown>).filter(([, v]) => v === true).map(([k]) => k)
      : [];
  const unknown = keys.filter((k) => !CATALOG.includes(k));
  unknown.forEach((k) => allUnknown.add(k));
  console.log(`\n  • ${p.nome}  (R$ ${(p.preco_mensal_cents/100).toFixed(2)})  lim u/os/gb = ${p.limite_usuarios}/${p.limite_os_mes}/${p.limite_storage_gb}`);
  console.log(`    formato features: ${Array.isArray(raw) ? "array" : typeof raw}`);
  console.log(`    keys: ${keys.join(", ") || "(vazio)"}`);
  if (unknown.length) console.log(`    ⚠️ DIVERGENTES (fora do catálogo, can() nunca acha): ${unknown.join(", ")}`);
}
console.log(allUnknown.size === 0
  ? "\n  ✅ Todas as keys do seed batem com o catálogo."
  : `\n  ⚠️ Keys divergentes no total: ${[...allUnknown].join(", ")} — exigem migration de correção.`);

// ── TAREFA 4: feature_flags em uso? ───────────────────────────────────────────
const { count: ffTotal, error: fErr } = await sb.from("feature_flags").select("*", { count: "exact", head: true });
if (fErr) throw fErr;
const { data: ffRows } = await sb.from("feature_flags").select("tenant_id");
const ffTenants = new Set((ffRows ?? []).map((r) => r.tenant_id)).size;
console.log("\n========== TAREFA 4 — feature_flags ==========");
console.log(`total: ${ffTotal ?? 0} | tenants distintos: ${ffTenants}`);
console.log((ffTotal ?? 0) === 0
  ? "  → tabela VAZIA."
  : "  → tabela EM USO (reconciliação relevante).");

console.log("\n(verificação read-only concluída — nada foi escrito)\n");
