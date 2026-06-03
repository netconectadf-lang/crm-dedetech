/**
 * Esqueleto de migração de dados do sistema atual da empresa-âncora (A7) → Dedetech.
 *
 * Estratégia: ler CSVs exportados do sistema legado, validar com Zod, e inserir
 * em STAGING (mesma estrutura, prefixo legacy_) antes de promover para as tabelas
 * de produção já com tenant_id. Idempotente por chave natural (CPF/CNPJ, placa...).
 *
 * Uso (Fase 0 = só o esqueleto; preenchido quando os CSVs chegarem):
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... \
 *   pnpm tsx scripts/migrate-legacy.ts --tenant <tenant_id> --dir ./legacy-csv
 */

type LegacyEntity = "clientes" | "produtos" | "funcionarios" | "veiculos";

const ORDER: LegacyEntity[] = [
  "clientes",
  "produtos",
  "funcionarios",
  "veiculos",
];

async function main() {
  console.log("[migrate-legacy] esqueleto — pendente dos CSVs do sistema atual");
  console.log("Ordem de importação prevista:", ORDER.join(" → "));
  // TODO(Fase 2+): parse CSV → Zod → upsert com tenant_id por chave natural.
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
