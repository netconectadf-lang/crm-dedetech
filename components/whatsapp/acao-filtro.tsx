"use client";

import { useState, useTransition } from "react";
import { Megaphone, X } from "lucide-react";
import { toast } from "sonner";

import { criarCampanhaPorFiltro } from "@/app/(app)/whatsapp/campanhas/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Filtros = { temp?: string; praga?: string; status?: string; busca?: string };

/** Botão que cria uma campanha com TODOS os contatos do filtro atual (sem teto de 500). */
export function AcaoFiltro({ filtros, count }: { filtros: Filtros; count: number }) {
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState("");
  const [pending, start] = useTransition();

  if (!count) return null;

  function criar() {
    if (!nome.trim()) {
      toast.error("Dê um nome à campanha.");
      return;
    }
    start(async () => {
      const r = await criarCampanhaPorFiltro(nome.trim(), filtros);
      if (r?.error) toast.error(r.error); // sucesso → a action redireciona pra campanha
    });
  }

  if (criando) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Input
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && criar()}
          placeholder="Nome da campanha"
          className="h-8 w-56"
        />
        <Button size="sm" onClick={criar} disabled={pending}>
          {pending ? "Criando…" : `Criar com ${count}`}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setCriando(false)} disabled={pending}>
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" onClick={() => setCriando(true)}>
      <Megaphone className="size-4" /> Criar campanha com todos os {count}
    </Button>
  );
}
