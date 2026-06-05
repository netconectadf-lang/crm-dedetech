import Link from "next/link";
import { CircleCheck, Circle, ArrowRight, Rocket } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getOnboardingStatus } from "@/lib/data/onboarding";
import { Card, CardContent } from "@/components/ui/card";

/** Checklist de primeiros passos — some quando tudo está concluído. */
export async function OnboardingChecklist({ tenantId }: { tenantId: string }) {
  const supabase = await createClient();
  const { passos, feitos, total } = await getOnboardingStatus(supabase, tenantId);
  if (feitos >= total) return null;

  const pct = Math.round((feitos / total) * 100);

  return (
    <Card className="border-primary/30 bg-primary/[0.03]">
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-inset ring-primary/30">
              <Rocket className="size-4.5" />
            </span>
            <div>
              <p className="font-semibold leading-tight">Primeiros passos</p>
              <p className="text-xs text-muted-foreground">
                Configure o essencial para começar a usar o Dedetech.
              </p>
            </div>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {feitos} de {total} concluídos
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>

        <ul className="divide-y divide-border/60">
          {passos.map((p) => (
            <li key={p.key}>
              <Link
                href={p.href}
                className="group flex items-center gap-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                {p.done ? (
                  <CircleCheck className="size-5 shrink-0 text-primary" />
                ) : (
                  <Circle className="size-5 shrink-0 text-muted-foreground/50" />
                )}
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-medium ${p.done ? "text-muted-foreground line-through" : ""}`}>
                    {p.label}
                  </span>
                  {!p.done && <span className="block text-xs text-muted-foreground">{p.desc}</span>}
                </span>
                {!p.done && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors group-hover:border-primary/40 group-hover:bg-muted/60">
                    Fazer <ArrowRight className="size-3.5" />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
