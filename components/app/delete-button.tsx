"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Botão de exclusão com confirmação. Recebe uma server action já vinculada
 * ao id (ex.: `excluirCliente.bind(null, id)`).
 *
 * A action roda dentro de uma transition com o diálogo CONTROLADO: ele só
 * fecha depois que a action termina. Isso evita o bug em que o
 * `AlertDialogAction` fechava (desmontava) o diálogo no mesmo clique e
 * abortava a server action antes de ela disparar — fazia "nada acontecer".
 */
export function DeleteButton({
  action,
  nome,
}: {
  action: () => Promise<void>;
  nome?: string;
}) {
  const [open, setOpen] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    setErro(null);
    startTransition(async () => {
      try {
        // Se a action faz redirect(), o Next intercepta e navega — o catch
        // abaixo só pega erros reais (ex.: falha no banco).
        await action();
        setOpen(false);
      } catch (e) {
        setErro(
          e instanceof Error ? e.message : "Não foi possível excluir. Tente novamente.",
        );
      }
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (pending) return; // não deixa fechar durante a exclusão
        setOpen(o);
        if (!o) setErro(null);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive">
          <Trash2 className="size-4" />
          <span className="sr-only">Excluir</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {nome ?? "registro"}?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {erro ? (
          <p className="text-sm text-destructive" role="alert">
            {erro}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={confirmar}
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Excluindo…
              </>
            ) : (
              "Excluir"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
