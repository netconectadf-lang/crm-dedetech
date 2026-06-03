"use client";

import { Printer, Check, X } from "lucide-react";

import { aceitarProposta, recusarProposta } from "@/app/proposta/[token]/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ProposalActions({ token }: { token: string }) {
  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <form action={aceitarProposta.bind(null, token)}>
        <Button type="submit" size="lg" className="bg-emerald-600 hover:bg-emerald-700">
          <Check className="size-4" /> Aceitar proposta
        </Button>
      </form>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="lg">
            <X className="size-4" /> Recusar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recusar esta proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Você poderá entrar em contato com a empresa para renegociar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <form action={recusarProposta.bind(null, token)}>
              <AlertDialogAction type="submit">Recusar</AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button
        type="button"
        variant="ghost"
        size="lg"
        onClick={() => window.print()}
      >
        <Printer className="size-4" /> Imprimir / PDF
      </Button>
    </div>
  );
}
