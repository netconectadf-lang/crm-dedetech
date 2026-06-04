"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";

export function ClientesFiltros({
  ufs,
  redes,
}: {
  ufs: string[];
  redes: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.replace(`${pathname}?${p.toString()}`);
  }

  const selectClass =
    "h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        name="q"
        placeholder="Buscar por nome…"
        defaultValue={params.get("q") ?? ""}
        onChange={(e) => set("q", e.target.value)}
        className="max-w-xs"
      />
      <select
        className={selectClass}
        value={params.get("uf") ?? ""}
        onChange={(e) => set("uf", e.target.value)}
        aria-label="Filtrar por estado"
      >
        <option value="">Todos os estados</option>
        {ufs.map((uf) => (
          <option key={uf} value={uf}>
            {uf}
          </option>
        ))}
      </select>
      <select
        className={selectClass}
        value={params.get("rede") ?? ""}
        onChange={(e) => set("rede", e.target.value)}
        aria-label="Filtrar por rede"
      >
        <option value="">Todas as redes</option>
        {redes.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
        <option value="__sem">Sem rede</option>
      </select>
    </div>
  );
}
