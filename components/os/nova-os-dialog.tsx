"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { criarOS } from "@/app/(app)/os/actions";
import type { SaveState } from "@/lib/crud-helpers";
import {
  TIPOS_IMOVEL_PRINCIPAIS,
  TIPOS_IMOVEL_MAIS,
  PRAGAS_PRINCIPAIS,
  ESTRUTURAS_PRINCIPAIS,
  ehDedetizacao,
} from "@/lib/os-opcoes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Opt = { value: string; label: string };

const norm = (s: string) => s.trim().toLowerCase();
const semPrincipais = (catalogo: string[], principais: string[]) =>
  catalogo.filter((c) => !principais.some((p) => norm(p) === norm(c)));

export function NovaOSDialog({
  clientes,
  tecnicos,
  veiculos,
  servicos,
  pragas,
  estruturas,
  autoOpen = false,
}: {
  clientes: Opt[];
  tecnicos: Opt[];
  veiculos: Opt[];
  servicos: { id: string; nome: string }[];
  pragas: string[];
  estruturas: string[];
  /** Abre o dialog automaticamente (ex.: vindo do atalho do dashboard /os?nova=1). */
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [state, formAction, pending] = useActionState<SaveState, FormData>(criarOS, null);

  const [serviceId, setServiceId] = useState("");
  const [tipoImovel, setTipoImovel] = useState("");
  const [pragasSel, setPragasSel] = useState<string[]>([]);
  const [estrutSel, setEstrutSel] = useState<string[]>([]);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    // sucesso faz redirect p/ a OS criada (server action) — nada a fechar aqui.
  }, [state]);

  const servicoNome = servicos.find((s) => s.id === serviceId)?.nome ?? null;
  const mostrarPragas = ehDedetizacao(servicoNome);

  const maisPragas = useMemo(() => semPrincipais(pragas, PRAGAS_PRINCIPAIS), [pragas]);
  const maisEstrut = useMemo(() => semPrincipais(estruturas, ESTRUTURAS_PRINCIPAIS), [estruturas]);

  const toggle = (arr: string[], n: string) =>
    arr.includes(n) ? arr.filter((x) => x !== n) : [...arr, n];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Nova OS
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova ordem de serviço</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-5">
          {/* valores controlados → enviados via hidden inputs */}
          <input type="hidden" name="pragas" value={JSON.stringify(pragasSel)} readOnly />
          <input type="hidden" name="estruturas" value={JSON.stringify(estrutSel)} readOnly />
          <input type="hidden" name="tipo_imovel" value={tipoImovel} readOnly />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>
                Cliente <span className="text-destructive">*</span>
              </Label>
              <Select name="client_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="scheduled_at">Agendamento</Label>
              <Input id="scheduled_at" name="scheduled_at" type="date" />
            </div>

            <div className="grid gap-2">
              <Label>Tipo de serviço</Label>
              <Select name="service_id" onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicos.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Técnico</Label>
              <Select name="tecnico_id">
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {tecnicos.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Veículo</Label>
              <Select name="vehicle_id">
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {veiculos.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ChipPicker
            label="Tipo de imóvel"
            principais={TIPOS_IMOVEL_PRINCIPAIS}
            mais={TIPOS_IMOVEL_MAIS}
            selected={tipoImovel ? [tipoImovel] : []}
            onToggle={(n) => setTipoImovel((prev) => (prev === n ? "" : n))}
          />

          {mostrarPragas && (
            <ChipPicker
              label="Pragas-alvo"
              principais={PRAGAS_PRINCIPAIS}
              mais={maisPragas}
              selected={pragasSel}
              onToggle={(n) => setPragasSel((s) => toggle(s, n))}
            />
          )}

          <ChipPicker
            label="Estruturas / áreas"
            principais={ESTRUTURAS_PRINCIPAIS}
            mais={maisEstrut}
            selected={estrutSel}
            onToggle={(n) => setEstrutSel((s) => toggle(s, n))}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Criando…" : "Criar OS"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Chips: mostra as "principais" e, sob "ver mais", o resto do catálogo. */
function ChipPicker({
  label,
  principais,
  mais,
  selected,
  onToggle,
}: {
  label: string;
  principais: string[];
  mais: string[];
  selected: string[];
  onToggle: (nome: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const lista = expanded ? [...principais, ...mais] : principais;

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {lista.map((nome) => {
          const on = selected.includes(nome);
          return (
            <button
              key={nome}
              type="button"
              onClick={() => onToggle(nome)}
              className={`rounded-full border px-2.5 py-1 text-xs transition ${
                on
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-input text-muted-foreground hover:border-primary/40"
              }`}
            >
              {nome}
            </button>
          );
        })}
        {mais.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="rounded-full border border-dashed border-input px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/40"
          >
            {expanded ? "ver menos" : `+ ver mais (${mais.length})`}
          </button>
        )}
      </div>
    </div>
  );
}
