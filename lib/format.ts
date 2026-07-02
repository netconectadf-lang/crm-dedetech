/** Helpers de formatação BR (exibição). Armazenamos sempre só dígitos. */

export const onlyDigits = (v: string) => v.replace(/\D/g, "");

export function formatCpfCnpj(v: string | null | undefined): string {
  if (!v) return "—";
  const d = onlyDigits(v);
  if (d.length === 11)
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14)
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return v;
}

export function formatCep(v: string | null | undefined): string {
  if (!v) return "—";
  const d = onlyDigits(v);
  return d.length === 8 ? d.replace(/(\d{5})(\d{3})/, "$1-$2") : v;
}

export function formatPhone(v: string | null | undefined): string {
  if (!v) return "—";
  const d = onlyDigits(v);
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return v;
}

/**
 * Monta o link wa.me a partir de um telefone BR (garante o 55).
 * Retorna null se não houver número válido (aí o botão não aparece).
 * `msg` opcional pré-preenche a mensagem.
 */
export function waLink(
  telefone: string | null | undefined,
  msg?: string,
): string | null {
  if (!telefone) return null;
  const n = onlyDigits(telefone).replace(/^0+/, "");
  const num =
    n.startsWith("55") && (n.length === 12 || n.length === 13)
      ? n
      : n.length === 10 || n.length === 11
        ? `55${n}`
        : n;
  if (num.length < 12) return null;
  const base = `https://wa.me/${num}`;
  return msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
}

export function formatBRL(v: number | null | undefined): string {
  return (v ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(v: string | null | undefined): string {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

// ─── Máscaras ao vivo (entrada de formulário) ────────────────────────
// Recebem o que o usuário digitou e devolvem o texto formatado; o valor CRU
// (só dígitos) é o que os schemas normalizam no submit.

/** Máscara progressiva de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00). */
export function maskCpfCnpj(v: string): string {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/** Máscara progressiva de telefone BR — (00) 0000-0000 / (00) 00000-0000. */
export function maskPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

/** Máscara de moeda BR a partir dos dígitos (centavos). "12345" → "1.234,50" não; → "123,45". */
export function maskCurrency(v: string): string {
  const cents = onlyDigits(v);
  if (!cents) return "";
  const n = Number(cents) / 100;
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Converte "1.234,56" (ou dígitos) para número. Vazio → null. */
export function parseCurrency(v: string): number | null {
  const cents = onlyDigits(v);
  if (!cents) return null;
  return Number(cents) / 100;
}
