"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
 *
 * Em caso de sucesso mostra um toast. Se a action faz `redirect()`, o
 * `unstable_rethrow` deixa o Next tratar a navegação (sem vazar o código
 * interno `NEXT_REDIRECT` como se fosse erro). Para navegar pelo cliente
 * com toast, use `redirectTo`.
 */
export function DeleteButton({
  action,
  nome,
  successMessage,
  redirectTo,
}: {
  action: () => Promise<void>;
  nome?: string;
  successMessage?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    setErro(null);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        unstable_rethrow(e); // redirect()/notFound() não são erros — deixa o Next tratar
        setErro(
          e instanceof Error ? e.message : "Não foi possível excluir. Tente novamente.",
        );
        return;
      }
      toast.success(successMessage ?? "Excluído com sucesso");
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
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
