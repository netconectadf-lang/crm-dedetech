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

export type AjudaTopico = { titulo: string; itens: string[] };

/**
 * Botão "Como funciona" reutilizável: abre um diálogo explicando a tela.
 * Cada item de tópico no formato "Termo — descrição" destaca o termo em negrito.
 */
export function AjudaTela({
  titulo,
  descricao,
  topicos,
  dica,
}: {
  titulo: string;
  descricao: string;
  topicos: AjudaTopico[];
  dica?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="size-4" /> Como funciona
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          {topicos.map((t) => (
            <section key={t.titulo}>
              <h3 className="mb-2 font-semibold">{t.titulo}</h3>
              <ul className="space-y-1.5">
                {t.itens.map((item, i) => {
                  const idx = item.indexOf(" — ");
                  const termo = idx >= 0 ? item.slice(0, idx) : null;
                  const resto = idx >= 0 ? item.slice(idx + 3) : item;
                  return (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                      <span className="text-muted-foreground">
                        {termo ? (
                          <>
                            <span className="font-medium text-foreground">{termo}</span> — {resto}
                          </>
                        ) : (
                          resto
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {dica && (
            <p className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              💡 {dica}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
