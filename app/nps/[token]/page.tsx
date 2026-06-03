import { notFound } from "next/navigation";
import { Star } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { responderNPS } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const metadata = { title: "Avaliação" };

type Nps = {
  score: number | null;
  respondido_em: string | null;
  tenants: { razao_social: string; nome_fantasia: string | null; cor_primaria: string | null } | null;
};

export default async function NpsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const db = createAdminClient();
  const { data } = await db
    .from("nps_responses")
    .select("score, respondido_em, tenants(razao_social, nome_fantasia, cor_primaria)")
    .eq("token", token)
    .maybeSingle();
  if (!data) notFound();
  const nps = data as unknown as Nps;

  const empresa = nps.tenants?.nome_fantasia || nps.tenants?.razao_social || "a empresa";
  const cor = nps.tenants?.cor_primaria || "#0F766E";
  const respondido = nps.respondido_em != null;

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-6 py-12 text-center">
      <Star className="mb-4 size-10" style={{ color: cor }} />
      {respondido ? (
        <>
          <h1 className="text-2xl font-bold">Obrigado pela avaliação! 🙌</h1>
          <p className="mt-2 text-muted-foreground">Sua resposta foi registrada.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Como foi o atendimento da {empresa}?</h1>
          <p className="mt-2 text-muted-foreground">
            De 0 a 10, o quanto você recomendaria nosso serviço?
          </p>
          <form action={responderNPS.bind(null, token)} className="mt-8 w-full space-y-6">
            <div className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: 11 }, (_, n) => (
                <label key={n} className="cursor-pointer">
                  <input type="radio" name="score" value={n} required className="peer sr-only" />
                  <span className="grid size-10 place-items-center rounded-lg border text-sm font-medium transition-colors peer-checked:border-transparent peer-checked:bg-teal-700 peer-checked:text-white">
                    {n}
                  </span>
                </label>
              ))}
            </div>
            <Textarea name="comentario" placeholder="Quer deixar um comentário? (opcional)" />
            <Button type="submit" size="lg" className="w-full" style={{ backgroundColor: cor }}>
              Enviar avaliação
            </Button>
          </form>
        </>
      )}
    </main>
  );
}
