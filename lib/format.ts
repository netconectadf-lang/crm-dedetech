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
