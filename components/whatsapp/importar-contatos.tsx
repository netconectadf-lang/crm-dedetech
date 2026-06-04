"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Users, MessageCircle, Loader2 } from "lucide-react";

import {
  importarLista,
  importarClientes,
  importarDoWhatsapp,
  type ImportResult,
} from "@/app/(app)/whatsapp/contatos/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function parseLista(texto: string): { nome?: string; telefone: string; variavel_1?: string }[] {
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((linha) => {
      const partes = linha.split(/[,;\t]/).map((p) => p.trim());
      if (partes.length === 1) return { telefone: partes[0] };
      // se o primeiro campo tem mais dígito que letra, assume telefone primeiro
      const primeiroEhTel = (partes[0].replace(/\D/g, "").length || 0) >= 10;
      return primeiroEhTel
        ? { telefone: partes[0], nome: partes[1], variavel_1: partes[2] }
        : { nome: partes[0], telefone: partes[1], variavel_1: partes[2] };
    });
}

function feedback(r: ImportResult) {
  if (r.erro) return toast.error(r.erro);
  toast.success(
    `${r.inseridos} contato(s) importado(s)${r.ignorados ? `, ${r.ignorados} já existia(m)` : ""}.`,
  );
}

export function ImportarContatos({ clientesComTelefone }: { clientesComTelefone: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<ImportResult>) {
    startTransition(async () => {
      const r = await fn();
      feedback(r);
      if (!r.erro) {
        setOpen(false);
        setTexto("");
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="size-4" /> Importar contatos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar contatos</DialogTitle>
          <DialogDescription>Telefones repetidos são ignorados automaticamente.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="lista">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lista">Colar lista</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-3">
            <Label htmlFor="lista">Um por linha: <code>nome, telefone</code> (ou só o telefone)</Label>
            <Textarea
              id="lista"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={7}
              placeholder={"Maria, 61999990000\nJoão, 61988887777\n61997776666"}
            />
            <Button
              className="w-full"
              disabled={pending || !texto.trim()}
              onClick={() => run(() => importarLista(parseLista(texto)))}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Importar lista
            </Button>
          </TabsContent>

          <TabsContent value="clientes" className="space-y-3">
            <p className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
              <Users className="mt-0.5 size-4 shrink-0" />
              Traz os clientes ativos do CRM que têm telefone cadastrado
              {clientesComTelefone > 0 ? ` (${clientesComTelefone} disponíveis)` : ""}.
            </p>
            <Button className="w-full" disabled={pending} onClick={() => run(importarClientes)}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Users className="size-4" />}
              Importar clientes do CRM
            </Button>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-3">
            <p className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
              <MessageCircle className="mt-0.5 size-4 shrink-0" />
              Busca os contatos salvos no número de WhatsApp conectado. Grupos são ignorados.
            </p>
            <Button className="w-full" disabled={pending} onClick={() => run(importarDoWhatsapp)}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
              Buscar do WhatsApp conectado
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
