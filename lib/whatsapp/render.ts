/** Variáveis disponíveis para os scripts de WhatsApp. */
export type ScriptVars = {
  nome?: string | null;
  empresa?: string | null;
  variavel_1?: string | null;
  variavel_2?: string | null;
  variavel_3?: string | null;
};

/**
 * Substitui as variáveis do script pelo conteúdo do contato.
 * Aceita {{nome}}, {{empresa}}, {{var1}}/{{var2}}/{{var3}}.
 */
export function renderScript(corpo: string, vars: ScriptVars): string {
  return (corpo ?? "")
    .replace(/\{\{\s*nome\s*\}\}/gi, vars.nome?.trim() || "")
    .replace(/\{\{\s*empresa\s*\}\}/gi, vars.empresa?.trim() || "")
    .replace(/\{\{\s*var(?:iavel)?_?1\s*\}\}/gi, vars.variavel_1 ?? "")
    .replace(/\{\{\s*var(?:iavel)?_?2\s*\}\}/gi, vars.variavel_2 ?? "")
    .replace(/\{\{\s*var(?:iavel)?_?3\s*\}\}/gi, vars.variavel_3 ?? "");
}

/** Lista as variáveis usadas num corpo de script (para preview/ajuda). */
export const VARIAVEIS_DISPONIVEIS = [
  { token: "{{nome}}", desc: "Nome do contato" },
  { token: "{{empresa}}", desc: "Nome da sua empresa" },
  { token: "{{var1}}", desc: "Variável 1 (livre)" },
  { token: "{{var2}}", desc: "Variável 2 (livre)" },
  { token: "{{var3}}", desc: "Variável 3 (livre)" },
] as const;
