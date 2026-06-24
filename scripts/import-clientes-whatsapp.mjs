// Importa os clientes filtrados do WhatsApp (CSV do zap-classificador) para a tabela clients.
//
// Uso:
//   node scripts/import-clientes-whatsapp.mjs            -> SIMULAÇÃO (não grava nada)
//   node scripts/import-clientes-whatsapp.mjs --apply    -> grava de verdade no Supabase
//
// Lê o CSV de ~/Projetos/zap-classificador/clientes-dedetizacao.csv por padrão
// (ou passe outro caminho com --csv=/caminho/arquivo.csv).

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const TENANT_ID = "3aa56352-4ce8-4835-a85b-8ee0f0dd7c0e"; // A7 Dedetizadora
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const csvArg = args.find((a) => a.startsWith("--csv="));
const CSV_PATH = csvArg
  ? csvArg.slice(6)
  : join(homedir(), "Projetos", "zap-classificador", "clientes-dedetizacao.csv");

// --- carrega .env.local ---
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// --- parser de CSV simples (lida com aspas) ---
function parseCsv(texto) {
  const linhas = [];
  let campo = "", linha = [], dentroAspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (dentroAspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') dentroAspas = false;
      else campo += c;
    } else {
      if (c === '"') dentroAspas = true;
      else if (c === ",") { linha.push(campo); campo = ""; }
      else if (c === "\n") { linha.push(campo); linhas.push(linha); linha = []; campo = ""; }
      else if (c === "\r") { /* ignora */ }
      else campo += c;
    }
  }
  if (campo.length || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

// telefone só dígitos; chave de dedupe = últimos 11 dígitos (DDD + número)
const soDigitos = (s) => (s || "").replace(/\D/g, "");
const chaveTel = (s) => { const d = soDigitos(s); return d.slice(-11); };
const ehBrValido = (tel) => /^55\d{10,11}$/.test(tel);

async function main() {
  const linhas = parseCsv(readFileSync(CSV_PATH, "utf8"));
  const cab = linhas.shift().map((h) => h.trim());
  const idx = (nome) => cab.indexOf(nome);
  const iTel = idx("telefone"), iNome = idx("nome"), iScore = idx("score");
  const iPalavras = idx("palavras_encontradas"), iTrecho = idx("trecho");

  // 1) filtra válidos + dedupe interno
  const vistos = new Set();
  const candidatos = [];
  let ignoradosFormato = 0, dupInterno = 0;
  for (const l of linhas) {
    if (!l[iTel]) continue;
    const tel = soDigitos(l[iTel]);
    if (!ehBrValido(tel)) { ignoradosFormato++; continue; }
    const k = chaveTel(tel);
    if (vistos.has(k)) { dupInterno++; continue; }
    vistos.add(k);
    candidatos.push({
      telefone: tel,
      nome: (l[iNome] || "").trim(),
      score: l[iScore] || "",
      palavras: (l[iPalavras] || "").trim(),
      trecho: (l[iTrecho] || "").trim(),
    });
  }

  // 2) busca telefones já existentes nesse tenant pra não duplicar
  const existentes = new Set();
  let from = 0;
  for (;;) {
    const { data, error } = await sb
      .from("clients")
      .select("telefone")
      .eq("tenant_id", TENANT_ID)
      .range(from, from + 999);
    if (error) throw new Error("erro lendo clients: " + error.message);
    data.forEach((c) => c.telefone && existentes.add(chaveTel(c.telefone)));
    if (data.length < 1000) break;
    from += 1000;
  }

  const novos = candidatos.filter((c) => !existentes.has(chaveTel(c.telefone)));
  const jaExistem = candidatos.length - novos.length;

  // 3) monta os registros
  const registros = novos.map((c) => ({
    tenant_id: TENANT_ID,
    tipo: "PF",
    razao_social: c.nome || `WhatsApp ${c.telefone}`,
    telefone: c.telefone,
    origem: "whatsapp",
    segmento: "residencial",
    tags: ["lead", "importado-whatsapp"],
    observacoes:
      `Importado do WhatsApp (varredura por nicho). ` +
      `Palavras: ${c.palavras}.` + (c.trecho ? ` Trecho: "${c.trecho}"` : ""),
    ativo: true,
  }));

  // --- relatório ---
  console.log("====================================================");
  console.log("CSV:                 ", CSV_PATH);
  console.log("Linhas no CSV:       ", linhas.length);
  console.log("Ignorados (formato): ", ignoradosFormato, "(não eram telefone BR válido)");
  console.log("Duplicados no CSV:   ", dupInterno);
  console.log("Candidatos únicos:   ", candidatos.length);
  console.log("Já existem no CRM:   ", jaExistem, "(serão pulados)");
  console.log("NOVOS a inserir:     ", registros.length);
  console.log("====================================================");
  console.log("Amostra (3 primeiros):");
  registros.slice(0, 3).forEach((r) => console.log("  •", r.razao_social, "| tel:", r.telefone));

  if (!APPLY) {
    console.log("\n[SIMULAÇÃO] nada foi gravado. Rode com --apply pra inserir de verdade.\n");
    return;
  }

  // 4) insere em lotes de 200
  let inseridos = 0;
  for (let i = 0; i < registros.length; i += 200) {
    const lote = registros.slice(i, i + 200);
    const { error } = await sb.from("clients").insert(lote);
    if (error) throw new Error(`erro inserindo lote ${i}: ${error.message}`);
    inseridos += lote.length;
    console.log(`inseridos ${inseridos}/${registros.length}...`);
  }
  console.log(`\n✅ Pronto! ${inseridos} clientes importados para A7 Dedetizadora.`);
  console.log(`Filtre por tag "importado-whatsapp" ou origem "whatsapp" no CRM pra revisar.\n`);
}

main().catch((e) => { console.error("FALHOU:", e.message); process.exit(1); });
