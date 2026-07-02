import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading padrão do app (fallback de streaming p/ qualquer rota do grupo sem
 * loading.tsx próprio). Header + grade de cartões + bloco de lista — genérico o
 * bastante pra caber em telas de KPI e de tabela.
 */
export default function AppLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-border/60 bg-card/80 p-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </main>
  );
}
