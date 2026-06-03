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
