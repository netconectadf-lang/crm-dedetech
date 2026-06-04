"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { salvarFicha } from "@/app/(app)/os/actions";
import { adicionarPragaRapida } from "@/app/(app)/pragas/actions";
import { adicionarEstruturaRapida } from "@/app/(app)/estruturas/actions";
import type { SaveState } from "@/lib/crud-helpers";
import { METHOD_LABEL, type ApplicationMethod } from "@/lib/os";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Initial = {
  pragas: string[];
  estruturas: string[];
  metodo: ApplicationMethod | null;
  metragem_m2: number | null;
  periodo_reentrada_horas: number | null;
  garantia_meses: number | null;
  km_rodado?: number | null;
  tempo_execucao_min?: number | null;
  observacoes: string | null;
  recomendacoes: string | null;
};

const METHODS = Object.keys(METHOD_LABEL) as ApplicationMethod[];

export function FichaForm({
  osId,
  initial,
  pragaOptions,
  estruturaOptions,
}: {
  osId: string;
  initial: Initial;
  pragaOptions: string[];
  estruturaOptions: string[];
}) {
  const [pragas, setPragas] = useState<string[]>(initial.pragas ?? []);
  const [estruturas, setEstruturas] = useState<string[]>(initial.estruturas ?? []);
  const [pragaOpts, setPragaOpts] = useState<string[]>(pragaOptions);
  const [estrOpts, setEstrOpts] = useState<string[]>(estruturaOptions);

  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    salvarFicha.bind(null, osId),
    null,
  );

  useEffect(() => {
    if (state?.message) toast.success(state.message);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="pragas" value={JSON.stringify(pragas)} readOnly />
      <input
        type="hidden"
        name="estruturas"
        value={JSON.stringify(estruturas)}
        readOnly
      />

      <TagPicker
        label="Pragas combatidas"
        options={pragaOpts}
        selected={pragas}
        onToggle={(n) =>
          setPragas((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]))
        }
        onCreate={async (nome) => {
          const r = await adicionarPragaRapida(nome);
          if (r.ok && r.nome) {
            setPragaOpts((o) => (o.includes(r.nome!) ? o : [...o, r.nome!].sort()));
            setPragas((s) => (s.includes(r.nome!) ? s : [...s, r.nome!]));
          } else {
            toast.error(r.error ?? "Não foi possível adicionar.");
          }
        }}
        placeholder="nova praga…"
      />

      <TagPicker
        label="Estruturas / áreas tratadas"
        options={estrOpts}
        selected={estruturas}
        onToggle={(n) =>
          setEstruturas((s) =>
            s.includes(n) ? s.filter((x) => x !== n) : [...s, n],
          )
        }
        onCreate={async (nome) => {
          const r = await adicionarEstruturaRapida(nome);
          if (r.ok && r.nome) {
            setEstrOpts((o) => (o.includes(r.nome!) ? o : [...o, r.nome!].sort()));
            setEstruturas((s) => (s.includes(r.nome!) ? s : [...s, r.nome!]));
          } else {
            toast.error(r.error ?? "Não foi possível adicionar.");
          }
        }}
        placeholder="nova estrutura…"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="metodo">Método de aplicação</Label>
          <select
            id="metodo"
            name="metodo"
            defaultValue={initial.metodo ?? "pulverizacao"}
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABEL[m]}
              </option>
            ))}
          </select>
        </div>
        <Num name="metragem_m2" label="Metragem total (m²)" value={initial.metragem_m2} />
        <Num
          name="periodo_reentrada_horas"
          label="Período de reentrada (horas)"
          value={initial.periodo_reentrada_horas}
        />
        <Num name="garantia_meses" label="Garantia (meses)" value={initial.garantia_meses} />
        <Num name="km_rodado" label="Km rodado (combustível)" value={initial.km_rodado ?? null} />
        <Num
          name="tempo_execucao_min"
          label="Tempo de execução (min)"
          value={initial.tempo_execucao_min ?? null}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="observacoes">Observações técnicas</Label>
        <Textarea id="observacoes" name="observacoes" defaultValue={initial.observacoes ?? ""} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="recomendacoes">Recomendações ao cliente</Label>
        <Textarea id="recomendacoes" name="recomendacoes" defaultValue={initial.recomendacoes ?? ""} />
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar ficha"}
        </Button>
      </div>
    </form>
  );
}

function Num({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: number | null;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        step="any"
        defaultValue={value ?? ""}
      />
    </div>
  );
}

function TagPicker({
  label,
  options,
  selected,
  onToggle,
  onCreate,
  placeholder,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (nome: string) => void;
  onCreate: (nome: string) => Promise<void>;
  placeholder: string;
}) {
  const [novo, setNovo] = useState("");
  const [pending, startTransition] = useTransition();

  // opções a mostrar = catálogo + quaisquer selecionadas fora do catálogo
  const todas = Array.from(new Set([...options, ...selected]));

  function criar() {
    const nome = novo.trim();
    if (!nome) return;
    setNovo("");
    startTransition(() => {
      void onCreate(nome);
    });
  }

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {todas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {todas.map((nome) => {
            const on = selected.includes(nome);
            return (
              <button
                key={nome}
                type="button"
                onClick={() => onToggle(nome)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${
                  on
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-input text-muted-foreground hover:border-primary/40"
                }`}
              >
                {nome}
                {on && <X className="size-3" />}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              criar();
            }
          }}
          placeholder={placeholder}
          className="h-9 max-w-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={criar}
          disabled={pending || !novo.trim()}
        >
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>
    </div>
  );
}
