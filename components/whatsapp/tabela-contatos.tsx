"use client";

import { useState, useTransition } from "react";
import { UserPlus, Megaphone, X } from "lucide-react";
import { toast } from "sonner";

import { formatPhone } from "@/lib/format";
import { excluirContato, converterContatosEmClientes } from "@/app/(app)/whatsapp/contatos/actions";
import { criarCampanhaComContatos } from "@/app/(app)/whatsapp/campanhas/actions";
import { StatusContato } from "@/components/whatsapp/status-contato";
import { DeleteButton } from "@/components/app/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ORIGEM_LABEL: Record<string, string> = {
  manual: "Manual",
  csv: "Lista",
  cliente: "Cliente",
  whatsapp: "WhatsApp",
};

type Contato = {
  id: string;
  nome: string;
  telefone: string;
  status: string;
  origem: string;
  tags: string[] | null;
};

export function TabelaContatos({ contatos }: { contatos: Contato[] }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [criando, setCriando] = useState(false);
  const [nomeCampanha, setNomeCampanha] = useState("");
  const todosSel = contatos.length > 0 && sel.size === contatos.length;

  function toggle(id: string) {
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleTodos() {
    setSel(todosSel ? new Set() : new Set(contatos.map((c) => c.id)));
  }

  function converter() {
    const ids = [...sel];
    start(async () => {
      const r = await converterContatosEmClientes(ids);
      if (r.erro) {
        toast.error(r.erro);
      } else {
        toast.success(
          `${r.criados} cliente(s) criado(s)` +
            (r.ignorados ? `, ${r.ignorados} já eram clientes.` : "."),
        );
        setSel(new Set());
      }
    });
  }

  function criarCampanha() {
    const ids = [...sel];
    if (!nomeCampanha.trim()) {
      toast.error("Dê um nome à campanha.");
      return;
    }
    start(async () => {
      // em caso de sucesso a action redireciona pra campanha; só tratamos erro aqui
      const r = await criarCampanhaComContatos(nomeCampanha.trim(), ids);
      if (r?.error) toast.error(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {sel.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium">{sel.size} contato(s) selecionado(s)</span>
          {criando ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                autoFocus
                value={nomeCampanha}
                onChange={(e) => setNomeCampanha(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && criarCampanha()}
                placeholder="Nome da campanha (ex.: Frios — Escorpião)"
                className="h-8 w-64"
              />
              <Button size="sm" onClick={criarCampanha} disabled={pending}>
                {pending ? "Criando…" : "Criar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCriando(false)} disabled={pending}>
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => setCriando(true)} disabled={pending}>
                <Megaphone className="size-4" /> Criar campanha com a seleção
              </Button>
              <Button size="sm" variant="outline" onClick={converter} disabled={pending}>
                <UserPlus className="size-4" /> {pending ? "Convertendo…" : "Virar clientes"}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  aria-label="Selecionar todos"
                  checked={todosSel}
                  onChange={toggleTodos}
                  className="size-4 accent-primary"
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contatos.map((c) => (
              <TableRow key={c.id} data-state={sel.has(c.id) ? "selected" : undefined}>
                <TableCell>
                  <input
                    type="checkbox"
                    aria-label={`Selecionar ${c.nome}`}
                    checked={sel.has(c.id)}
                    onChange={() => toggle(c.id)}
                    className="size-4 accent-primary"
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {c.nome}
                  {c.tags && c.tags.length > 0 && (
                    <span className="ml-2 inline-flex gap-1">
                      {c.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {formatPhone(c.telefone)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {ORIGEM_LABEL[c.origem] ?? c.origem}
                </TableCell>
                <TableCell>
                  <StatusContato id={c.id} status={c.status} />
                </TableCell>
                <TableCell className="text-right">
                  <DeleteButton nome={c.nome} action={excluirContato.bind(null, c.id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
