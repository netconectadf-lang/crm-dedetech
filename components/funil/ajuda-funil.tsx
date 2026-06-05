"use client";

import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ESTAGIOS: { nome: string; cor: string; desc: string }[] = [
  { nome: "Lead", cor: "bg-muted-foreground", desc: "Contato novo que acabou de entrar (indicação, Google, Instagram, site…)." },
  { nome: "Contato", cor: "bg-sky-400", desc: "Você já fez o primeiro contato com a pessoa." },
  { nome: "Diagnóstico", cor: "bg-indigo-400", desc: "Visita ou avaliação técnica realizada no local." },
  { nome: "Orçamento", cor: "bg-amber-400", desc: "Proposta/orçamento elaborado e enviado ao cliente." },
  { nome: "Negociação", cor: "bg-purple-400", desc: "Ajustando valores, prazos e condições." },
  { nome: "Ganho", cor: "bg-emerald-400", desc: "Fechou! O negócio vira contrato/ordem de serviço." },
  { nome: "Perdido", cor: "bg-rose-400", desc: "Não fechou — você registra o motivo da perda." },
];

export function AjudaFunil() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="size-4" /> Como funciona
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Como funciona o Funil comercial</DialogTitle>
          <DialogDescription>
            Um quadro (kanban) onde cada cartão é uma oportunidade de venda que avança da esquerda
            para a direita até virar cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <section>
            <h3 className="mb-2 font-semibold">As etapas (colunas)</h3>
            <ul className="space-y-2">
              {ESTAGIOS.map((e) => (
                <li key={e.nome} className="flex gap-2.5">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${e.cor}`} />
                  <span>
                    <span className="font-medium">{e.nome}</span>{" "}
                    <span className="text-muted-foreground">— {e.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-2 font-semibold">Os números no topo</h3>
            <ul className="space-y-1.5 text-muted-foreground">
              <li><span className="font-medium text-foreground">Em aberto</span> — soma dos valores dos negócios ainda no funil.</li>
              <li><span className="font-medium text-foreground">Conversão</span> — % de negócios ganhos sobre o total de fechados (ganhos + perdidos).</li>
              <li><span className="font-medium text-foreground">Ticket médio</span> — valor médio por negócio ganho.</li>
              <li><span className="font-medium text-foreground">Ganhos</span> — quantos negócios você fechou.</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 font-semibold">Como usar no dia a dia</h3>
            <ol className="list-decimal space-y-1.5 pl-4 text-muted-foreground">
              <li>Clique em <span className="font-medium text-foreground">“Novo lead”</span> para cadastrar a oportunidade (contato, origem, valor estimado).</li>
              <li><span className="font-medium text-foreground">Arraste o cartão</span> entre as colunas conforme a negociação avança.</li>
              <li>Clique no cartão para abrir o <span className="font-medium text-foreground">detalhe</span>: tarefas, observações e orçamento (com link de proposta para enviar ao cliente).</li>
              <li>Fechou? Mova para <span className="font-medium text-foreground">Ganho</span> — vira contrato/OS. Não fechou? <span className="font-medium text-foreground">Perdido</span> com o motivo.</li>
            </ol>
          </section>

          <p className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            💡 Dica: registre a <span className="font-medium text-foreground">origem</span> de cada lead — assim você descobre de onde vêm seus melhores clientes.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
