import { Check, X } from "lucide-react";

import { DEAL_FLOW, STAGE_LABEL, type DealStage } from "@/lib/funil";
import { cn } from "@/lib/utils";

/** Trilha visual do estágio do negócio no funil. */
export function StageStepper({ stage }: { stage: DealStage }) {
  if (stage === "perdido") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
        <X className="size-4" /> Negócio perdido
      </div>
    );
  }

  const current = DEAL_FLOW.indexOf(stage);

  return (
    <ol className="flex w-full items-center">
      {DEAL_FLOW.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1 transition-colors",
                  done && "bg-primary/20 text-primary ring-primary/40",
                  active &&
                    "bg-primary text-primary-foreground ring-primary shadow-[0_0_12px_-2px_var(--color-primary)]",
                  !done && !active && "bg-muted text-muted-foreground ring-border",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-[11px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {STAGE_LABEL[s]}
              </span>
            </div>
            {i < DEAL_FLOW.length - 1 && (
              <span
                className={cn(
                  "mx-1 h-0.5 flex-1 rounded-full transition-colors",
                  i < current ? "bg-primary/50" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
