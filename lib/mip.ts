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
  sem_atividade: "bg-emerald-100 text-emerald-700",
  consumo_baixo: "bg-sky-100 text-sky-700",
  consumo_alto: "bg-rose-100 text-rose-700",
  captura: "bg-orange-100 text-orange-700",
  danificado: "bg-amber-100 text-amber-700",
  reposto: "bg-slate-100 text-slate-700",
};

/** Ponto crítico: última leitura indica infestação ativa. */
export function isCritical(status: MipReadingStatus | null): boolean {
  return status === "consumo_alto" || status === "captura";
}
