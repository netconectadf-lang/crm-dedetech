"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Percent } from "lucide-react";

import { adicionarComissao } from "@/app/(app)/comissoes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

type Func = { id: string; nome: string };

const selectCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function AddComissaoButton({ arId, funcionarios }: { arId: string; funcionarios: Func[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [tipo, setTipo] = useState<"vendedor" | "tecnico">("tecnico");
  const [modo, setModo] = useState<"percentual" | "fixo">("percentual");
  const [valorCampo, setValorCampo] = useState("");

  function lancar() {
    const num = Number(valorCampo.replace(",", "."));
    if (!employeeId) return toast.error("Selecione o funcionário.");
    if (!num || num <= 0) return toast.error("Informe o percentual ou valor.");
    start(async () => {
      const r = await adicionarComissao({
        arId,
        employeeId,
        tipo,
        percentual: modo === "percentual" ? num : null,
        valorFixo: modo === "fixo" ? num : null,
      });
      if (r.error) toast.error(r.error);
      else {
        toast.success(r.message ?? "Comissão lançada.");
        setOpen(false);
        setEmployeeId("");
        setValorCampo("");
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Lançar comissão">
          <Percent className="size-4" /> Comissão
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lançar comissão</DialogTitle>
          <DialogDescription>
            A comissão é liberada para pagamento quando o cliente quitar esta conta.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="func">Funcionário</Label>
            <select id="func" className={selectCls} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Selecione…</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tipo">Tipo</Label>
            <select id="tipo" className={selectCls} value={tipo} onChange={(e) => setTipo(e.target.value as "vendedor" | "tecnico")}>
              <option value="vendedor">Vendedor</option>
              <option value="tecnico">Técnico</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="modo">Base</Label>
              <select id="modo" className={selectCls} value={modo} onChange={(e) => setModo(e.target.value as "percentual" | "fixo")}>
                <option value="percentual">Percentual (%)</option>
                <option value="fixo">Valor fixo (R$)</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="valor">{modo === "percentual" ? "Percentual" : "Valor (R$)"}</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={valorCampo}
                onChange={(e) => setValorCampo(e.target.value)}
                placeholder={modo === "percentual" ? "5" : "100,00"}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={lancar} disabled={pending}>{pending ? "Lançando…" : "Lançar comissão"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
