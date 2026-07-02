import "server-only";

import { fetchWithTimeout } from "@/lib/http";

/**
 * Cliente da Meta Marketing API (Graph v21.0) para o dashboard de Tráfego.
 * Somente leitura. Token de usuário de longa duração (renovar a cada ~60 dias
 * via fb_exchange_token — ver marketing/campanha no projeto a7-site).
 */

const GRAPH = "https://graph.facebook.com/v21.0";

// action_type que o Meta usa para "conversa de mensagem iniciada" (WhatsApp)
const CONVERSA = "onsite_conversion.messaging_conversation_started_7d";

export type MetaConfig = {
  token: string;
  adAccountId: string;
  campaignId: string;
};

export function getMetaConfig(): MetaConfig | null {
  const token = process.env.META_ADS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const campaignId = process.env.META_CAMPAIGN_ID;
  if (!token || !adAccountId || !campaignId) return null;
  return { token, adAccountId, campaignId };
}

export type MetaAdRow = {
  adsetName: string;
  adName: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  frequency: number;
  conversas: number;
  custoConversa: number | null;
};

export type MetaDailyPoint = {
  /** YYYY-MM-DD */
  date: string;
  spend: number;
  conversas: number;
};

export type MetaAdStatus = { name: string; effectiveStatus: string };

export type MetaTrafego = {
  ads: MetaAdStatus[];
  hoje: MetaAdRow[];
  acumulado: MetaAdRow[];
  serie30d: MetaDailyPoint[];
  erro: string | null;
};

type InsightAction = { action_type: string; value: string };
type InsightRow = {
  adset_name?: string;
  ad_name?: string;
  date_start?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpm?: string;
  frequency?: string;
  actions?: InsightAction[];
  cost_per_action_type?: InsightAction[];
};

function conversasDe(row: InsightRow): number {
  const a = row.actions?.find((x) => x.action_type === CONVERSA);
  return a ? Number(a.value) : 0;
}

function custoConversaDe(row: InsightRow): number | null {
  const a = row.cost_per_action_type?.find((x) => x.action_type === CONVERSA);
  return a ? Number(a.value) : null;
}

function toAdRow(row: InsightRow): MetaAdRow {
  return {
    adsetName: row.adset_name ?? "—",
    adName: row.ad_name ?? "—",
    spend: Number(row.spend ?? 0),
    impressions: Number(row.impressions ?? 0),
    clicks: Number(row.clicks ?? 0),
    ctr: Number(row.ctr ?? 0),
    cpm: Number(row.cpm ?? 0),
    frequency: Number(row.frequency ?? 0),
    conversas: conversasDe(row),
    custoConversa: custoConversaDe(row),
  };
}

async function graphGet<T>(
  path: string,
  params: Record<string, string>,
  token: string,
): Promise<{ data?: T; error?: { message: string; code?: number } }> {
  const qs = new URLSearchParams({ ...params, access_token: token });
  const res = await fetchWithTimeout(`${GRAPH}/${path}?${qs}`, {
    // painel sempre fresco, mas tolera 60s de cache p/ navegação entre abas
    next: { revalidate: 60 },
  });
  const json = await res.json();
  if (json.error) return { error: json.error };
  return { data: (json.data ?? json) as T };
}

const INSIGHT_FIELDS =
  "adset_name,ad_name,spend,impressions,clicks,ctr,cpm,frequency,actions,cost_per_action_type";

export async function getMetaTrafego(cfg: MetaConfig): Promise<MetaTrafego> {
  const vazio: MetaTrafego = {
    ads: [],
    hoje: [],
    acumulado: [],
    serie30d: [],
    erro: null,
  };

  const [status, hoje, acumulado, serie] = await Promise.all([
    graphGet<{ name: string; effective_status: string }[]>(
      `${cfg.campaignId}/ads`,
      { fields: "name,effective_status" },
      cfg.token,
    ),
    graphGet<InsightRow[]>(
      `${cfg.campaignId}/insights`,
      { level: "ad", date_preset: "today", fields: INSIGHT_FIELDS },
      cfg.token,
    ),
    graphGet<InsightRow[]>(
      `${cfg.campaignId}/insights`,
      { level: "ad", date_preset: "maximum", fields: INSIGHT_FIELDS },
      cfg.token,
    ),
    graphGet<InsightRow[]>(
      `${cfg.campaignId}/insights`,
      {
        level: "campaign",
        date_preset: "last_30d",
        time_increment: "1",
        fields: "spend,actions,date_start",
      },
      cfg.token,
    ),
  ]);

  const erro =
    status.error ?? hoje.error ?? acumulado.error ?? serie.error ?? null;
  if (erro) {
    const expirado = erro.code === 190;
    return {
      ...vazio,
      erro: expirado
        ? "Token do Meta expirado — gerar um novo token de longa duração e atualizar META_ADS_TOKEN."
        : `Erro na API do Meta: ${erro.message}`,
    };
  }

  return {
    ads: (status.data ?? []).map((a) => ({
      name: a.name,
      effectiveStatus: a.effective_status,
    })),
    hoje: (hoje.data ?? []).map(toAdRow),
    acumulado: (acumulado.data ?? []).map(toAdRow),
    serie30d: (serie.data ?? []).map((r) => ({
      date: r.date_start ?? "",
      spend: Number(r.spend ?? 0),
      conversas: conversasDe(r),
    })),
    erro: null,
  };
}
