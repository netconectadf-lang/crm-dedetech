export type MipDeviceType =
  | "porta_isca"
  | "armadilha_luminosa"
  | "estacao_monitoramento"
  | "armadilha_roedor"
  | "outro";

export type MipReadingStatus =
  | "sem_atividade"
  | "consumo_baixo"
  | "consumo_alto"
  | "captura"
  | "danificado"
  | "reposto";

export const DEVICE_TYPE_LABEL: Record<MipDeviceType, string> = {
  porta_isca: "Porta-isca (PPI)",
  armadilha_luminosa: "Armadilha luminosa",
  estacao_monitoramento: "Estação de monitoramento",
  armadilha_roedor: "Armadilha p/ roedor",
  outro: "Outro",
};

export const READING_STATUS_LABEL: Record<MipReadingStatus, string> = {
  sem_atividade: "Sem atividade",
  consumo_baixo: "Consumo baixo",
  consumo_alto: "Consumo alto",
  captura: "Captura",
  danificado: "Danificado",
  reposto: "Reposto",
};

export const READING_STATUS_TONE: Record<MipReadingStatus, string> = {
  sem_atividade: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25",
  consumo_baixo: "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/25",
  consumo_alto: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/25",
  captura: "bg-orange-500/15 text-orange-300 ring-1 ring-inset ring-orange-500/25",
  danificado: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25",
  reposto: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
};

/** Ponto crítico: última leitura indica infestação ativa. */
export function isCritical(status: MipReadingStatus | null): boolean {
  return status === "consumo_alto" || status === "captura";
}
