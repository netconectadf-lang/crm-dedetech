/**
 * Lista usuários do Supabase Auth e seus papéis (memberships).
 * Uso: pnpm dlx tsx --env-file=.env.local scripts/listar-usuarios-owner.mts
 * Lê chaves de .env.local. Service role — só rodar local/servidor.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env.local");

const sb = createClient(url, key, { auth: { persistSession: false } });

// papéis por usuário
const { data: memberships, error: mErr } = await sb
  .from("memberships")
  .select("user_id, role, tenant_id");
if (mErr) throw mErr;
const roleByUser = new Map<string, string[]>();
for (const m of memberships ?? []) {
  const arr = roleByUser.get(m.user_id) ?? [];
  arr.push(m.role);
  roleByUser.set(m.user_id, arr);
}

const { data, error } = await sb.auth.admin.listUsers({ perPage: 1000 });
if (error) throw error;

console.log(`\n${data.users.length} usuário(s):\n`);
for (const u of data.users) {
  const roles = roleByUser.get(u.id) ?? [];
  const isOwner = roles.includes("owner") ? "  ⭐ OWNER" : "";
  console.log(`• ${u.email ?? "(sem email)"}  [${roles.join(", ") || "sem membership"}]${isOwner}`);
  console.log(`    id=${u.id}  criado=${u.created_at?.slice(0, 10)}  último login=${u.last_sign_in_at?.slice(0, 10) ?? "nunca"}`);
}
console.log("");
