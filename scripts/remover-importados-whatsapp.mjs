// Exporta os clientes importados do WhatsApp para ~/Downloads e depois os REMOVE do CRM.
// Filtra SOMENTE origem='whatsapp' — os clientes originais não são tocados.
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const T = "3aa56352-4ce8-4835-a85b-8ee0f0dd7c0e"; // A7 Dedetizadora
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const { data, error } = await sb
  .from("clients")
  .select("razao_social,telefone,tipo,segmento,origem,tags,observacoes,created_at")
  .eq("tenant_id", T)
  .eq("origem", "whatsapp");
if (error) { console.error("erro buscando:", error.message); process.exit(1); }
console.log("Encontrados pra remover:", data.length);

const cab = "razao_social,telefone,tipo,segmento,origem,tags,observacoes,created_at";
const linhas = data.map((r) =>
  [r.razao_social, r.telefone, r.tipo, r.segmento, r.origem, (r.tags || []).join(" "), r.observacoes, r.created_at]
    .map(esc).join(",")
);
const destino = join(homedir(), "Downloads", "contatos-whatsapp-importados-2026-06-09.csv");
writeFileSync(destino, [cab, ...linhas].join("\n"), "utf8");
console.log("Backup salvo em:", destino);

const { error: delErr, count } = await sb
  .from("clients")
  .delete({ count: "exact" })
  .eq("tenant_id", T)
  .eq("origem", "whatsapp");
if (delErr) { console.error("erro removendo:", delErr.message); process.exit(1); }
console.log("Removidos do CRM:", count);

const { count: total } = await sb.from("clients").select("*", { count: "exact", head: true }).eq("tenant_id", T);
console.log("Total de clientes A7 agora:", total, "(esperado: 258)");
