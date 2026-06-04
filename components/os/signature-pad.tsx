"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Eraser, Check } from "lucide-react";

import { salvarAssinatura } from "@/app/(app)/os/[id]/certificado/actions";
import { Button } from "@/components/ui/button";

export function SignaturePad({ osId, jaAssinado }: { osId: string; jaAssinado: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [vazio, setVazio] = useState(true);
  const [pending, start] = useTransition();

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (c.width / r.width),
      y: (e.clientY - r.top) * (c.height / r.height),
    };
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    drawing.current = true;
    c.setPointerCapture(e.pointerId);
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (vazio) setVazio(false);
  }

  function onUp() {
    drawing.current = false;
  }

  function limpar() {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setVazio(true);
  }

  function salvar() {
    if (vazio) {
      toast.error("Peça ao cliente para assinar antes de salvar.");
      return;
    }
    const dataUrl = canvasRef.current!.toDataURL("image/png");
    start(async () => {
      const r = await salvarAssinatura(osId, dataUrl);
      if (r.error) toast.error(r.error);
      else {
        toast.success(r.message ?? "Assinatura salva.");
        limpar();
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        Assinatura do cliente
        {jaAssinado && (
          <span className="ml-2 text-xs font-normal text-primary">· já assinado (assine de novo para substituir)</span>
        )}
      </p>
      <canvas
        ref={canvasRef}
        width={560}
        height={200}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        className="h-44 w-full touch-none rounded-lg border border-border bg-card"
      />
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={limpar} disabled={pending}>
          <Eraser className="size-4" /> Limpar
        </Button>
        <Button type="button" size="sm" onClick={salvar} disabled={pending}>
          <Check className="size-4" /> {pending ? "Salvando…" : "Salvar assinatura"}
        </Button>
      </div>
    </div>
  );
}
