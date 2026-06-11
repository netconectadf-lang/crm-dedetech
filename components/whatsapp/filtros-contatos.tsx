"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TEMPERATURAS: [string, string][] = [
  ["quente", "🔥 Quente"],
  ["morno", "🌤️ Morno"],
  ["frio", "🧊 Frio"],
];

const PRAGAS: [string, string][] = [
  ["barata", "Barata"], ["formiga", "Formiga"], ["cupim", "Cupim"], ["rato", "Rato"],
  ["escorpiao", "Escorpião"], ["aranha", "Aranha"], ["pombo", "Pombo"], ["morcego", "Morcego"],
  ["mosquito-dengue", "Mosquito/Dengue"], ["pulga-carrapato", "Pulga/Carrapato"],
  ["percevejo", "Percevejo"], ["mosca", "Mosca"], ["traca", "Traça"],
  ["caixa-d-agua", "Caixa d'água"], ["sanitizacao", "Sanitização"],
  ["impermeabilizacao", "Impermeabilização"], ["dedetizacao-geral", "Dedetização (geral)"],
  ["geral-sem-servico", "Geral (sem serviço)"],
];

const STATUS: [string, string][] = [
  ["novo", "Novo"], ["contatado", "Contatado"], ["interessado", "Interessado"],
  ["convertido", "Convertido"], ["descartado", "Descartado"], ["opt_out", "Descadastrado"],
];

const RECENCIA: [string, string][] = [
  ["ate-30d", "Até 30 dias"], ["31-60d", "31 a 60 dias"],
  ["61-90d", "61 a 90 dias"], ["90d-mais", "Mais de 90 dias"],
];

export function FiltrosContatos({
  temp,
  praga,
  status,
  rec,
  q,
}: {
  temp?: string;
  praga?: string;
  status?: string;
  rec?: string;
  q?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [busca, setBusca] = useState(q ?? "");

  function setParam(key: string, val: string) {
    const p = new URLSearchParams(sp.toString());
    if (!val || val === "todos") p.delete(key);
    else p.set(key, val);
    const qs = p.toString();
    router.push(qs ? `/whatsapp/contatos?${qs}` : "/whatsapp/contatos");
  }

  const temFiltro = Boolean(temp || praga || status || rec || q);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={temp ?? "todos"} onValueChange={(v) => setParam("temp", v)}>
        <SelectTrigger size="sm" className="w-40">
          <SelectValue placeholder="Temperatura" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas temperaturas</SelectItem>
          {TEMPERATURAS.map(([v, l]) => (
            <SelectItem key={v} value={v}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={praga ?? "todos"} onValueChange={(v) => setParam("praga", v)}>
        <SelectTrigger size="sm" className="w-48">
          <SelectValue placeholder="Praga / serviço" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as pragas</SelectItem>
          {PRAGAS.map(([v, l]) => (
            <SelectItem key={v} value={v}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={rec ?? "todos"} onValueChange={(v) => setParam("rec", v)}>
        <SelectTrigger size="sm" className="w-44">
          <SelectValue placeholder="Último contato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Qualquer data</SelectItem>
          {RECENCIA.map(([v, l]) => (
            <SelectItem key={v} value={v}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status ?? "todos"} onValueChange={(v) => setParam("status", v)}>
        <SelectTrigger size="sm" className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          {STATUS.map(([v, l]) => (
            <SelectItem key={v} value={v}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setParam("q", busca.trim())}
          placeholder="Buscar nome/telefone"
          className="h-8 w-48"
        />
        <Button size="sm" variant="outline" onClick={() => setParam("q", busca.trim())}>
          <Search className="size-4" />
        </Button>
      </div>

      {temFiltro && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setBusca("");
            router.push("/whatsapp/contatos");
          }}
        >
          <X className="size-4" /> Limpar
        </Button>
      )}
    </div>
  );
}
