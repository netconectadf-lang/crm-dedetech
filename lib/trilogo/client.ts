import "server-only";

import { TRILOGO_STATUS, type TrilogoSession, type TrilogoTicket } from "./types";
import { fetchWithTimeout } from "@/lib/http";

const BASE = "https://web.api.trilogo.app/api";

export class TrilogoError extends Error {}

/** Lê as credenciais do ambiente (configuradas só no servidor). */
function getCredentials(): { email: string; password: string } {
  const email = process.env.TRILOGO_EMAIL;
  const password = process.env.TRILOGO_PASSWORD;
  if (!email || !password) {
    throw new TrilogoError(
      "Credenciais do Trílogo ausentes (TRILOGO_EMAIL / TRILOGO_PASSWORD).",
    );
  }
  return { email, password };
}

/** Faz login no Trílogo e devolve o token de acesso (JWT de validade curta). */
export async function signIn(): Promise<TrilogoSession> {
  const { email, password } = getCredentials();
  const res = await fetchWithTimeout(`${BASE}/Login/SignIn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ UserEmail: email, UserPassword: password }),
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new TrilogoError(`Falha no login do Trílogo (${res.status}). ${msg}`.trim());
  }
  const data = (await res.json()) as {
    authenticated?: boolean;
    accessToken?: string;
    expiration?: string;
    sessionUser?: { supplier?: { name?: string } | null };
  };
  if (!data.authenticated || !data.accessToken) {
    throw new TrilogoError("Trílogo não autenticou. Confira e-mail e senha.");
  }
  return {
    accessToken: data.accessToken,
    expiration: data.expiration ?? null,
    supplierName: data.sessionUser?.supplier?.name ?? null,
  };
}

/** Lista chamados paginados. Sem filtro de status, traz todos. */
export async function listTickets(
  token: string,
  opts: { offset?: number; limit?: number; status?: number[] } = {},
): Promise<TrilogoTicket[]> {
  const body: Record<string, unknown> = {
    Offset: opts.offset ?? 0,
    Limit: opts.limit ?? 1000,
  };
  if (opts.status?.length) body.Status = opts.status;

  const res = await fetchWithTimeout(`${BASE}/Ticket/ListTicketsByUser`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new TrilogoError(`Falha ao listar chamados (${res.status}). ${msg}`.trim());
  }
  const data = (await res.json()) as { tickets?: TrilogoTicket[] };
  return data.tickets ?? [];
}

/** Lista apenas os chamados abertos (status = Open), paginando até o fim. */
export async function listOpenTickets(token: string): Promise<TrilogoTicket[]> {
  // A grid traz status misturados; filtramos por Open no nosso lado para
  // não depender do formato exato do filtro de status da API.
  const all = await listTickets(token, { limit: 1000 });
  return all.filter((t) => t.status === TRILOGO_STATUS.Open);
}

/** Deriva a lista de unidades (empresas) distintas a partir dos chamados. */
export async function listUnitsFromTickets(
  token: string,
): Promise<{ companyId: number; nome: string }[]> {
  const all = await listTickets(token, { limit: 1000 });
  const map = new Map<number, string>();
  for (const t of all) {
    const id = t.company?.id;
    if (id != null && !map.has(id)) {
      map.set(id, t.companyName ?? t.company?.name ?? `Unidade ${id}`);
    }
  }
  return [...map.entries()]
    .map(([companyId, nome]) => ({ companyId, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
