"use client";

import { HelpCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PASSOS = [
  {
    t: "Abra o Telegram e procure o @BotFather",
    d: "Na busca (lupa no topo), digite @BotFather e toque no resultado com o selo azul de verificado.",
  },
  {
    t: "Inicie e mande /newbot",
    d: "Toque em Iniciar (Start) e envie o comando /newbot para criar um robô novo.",
  },
  {
    t: "Dê um nome ao bot",
    d: "Pode ser qualquer um, ex.: Despesas Minha Empresa.",
  },
  {
    t: "Escolha um usuário terminando em 'bot'",
    d: "Ex.: despesas_minhaempresa_bot. Se já existir, ele avisa — tente outro.",
  },
  {
    t: "Copie o TOKEN",
    d: "O BotFather responde com um código grande, tipo 123456789:AAH-xxxxxxxx. Esse é o token.",
  },
  {
    t: "Cole o token aqui e clique em 'Conectar bot'",
    d: "O sistema valida e conecta o bot automaticamente — você não precisa configurar mais nada técnico.",
  },
  {
    t: "Sua equipe se cadastra com /start",
    d: "Cada pessoa abre o seu bot no Telegram e manda /start. Ela aparece nesta tela como 'pendente'.",
  },
  {
    t: "Aprove a equipe com 1 clique",
    d: "Toque em 'Aprovar' ao lado de cada pessoa. Pronto — ela já pode lançar.",
  },
  {
    t: "Use no dia a dia",
    d: "Despesa: mande 'gasolina 150' (vira conta a pagar). Pedido de compra: envie o PDF que o bot lê e importa.",
  },
];

export function AjudaTelegram() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <HelpCircle className="size-4" /> Como criar o bot?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Como conectar o Telegram — passo a passo</DialogTitle>
          <DialogDescription>
            Leva uns 2 minutos no seu celular. Faça uma vez por empresa.
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-4">
          {PASSOS.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-medium leading-snug">{p.t}</p>
                <p className="text-sm text-muted-foreground">{p.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          💡 O token é como uma senha do bot — guarde com cuidado. Dá para trocar a
          qualquer momento no @BotFather (comando <code>/revoke</code>).
        </div>
      </DialogContent>
    </Dialog>
  );
}
