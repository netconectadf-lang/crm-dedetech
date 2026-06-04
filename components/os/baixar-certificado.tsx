"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BaixarCertificado({ numero }: { numero: number }) {
  const [loading, setLoading] = useState(false);

  async function baixar() {
    const el = document.getElementById("certificado");
    if (!el) return;
    setLoading(true);
    try {
      // libs carregadas sob demanda (não pesam o bundle do app)
      const [{ default: html2canvas }, jspdf] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const img = canvas.toDataURL("image/png");

      const pdf = new jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const margin = 8;
      const w = pdf.internal.pageSize.getWidth() - margin * 2;
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(img, "PNG", margin, margin, w, h);
      pdf.save(`certificado-os-${numero}.pdf`);
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" onClick={baixar} disabled={loading}>
      <Download className="size-4" /> {loading ? "Gerando…" : "Baixar PDF"}
    </Button>
  );
}
