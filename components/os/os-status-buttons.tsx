"use client";

import { mudarStatusOS } from "@/app/(app)/os/actions";
import { NEXT_STATUS, OS_STATUS_LABEL, type OsStatus } from "@/lib/os";
import { Button } from "@/components/ui/button";

export function OsStatusButtons({
  id,
  status,
}: {
  id: string;
  status: OsStatus;
}) {
  const next = NEXT_STATUS[status];
  if (next.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {next.map((s) => (
        <Button
          key={s}
          variant={s === "cancelada" ? "outline" : "default"}
          className={s === "cancelada" ? "text-destructive" : ""}
          onClick={() => mudarStatusOS(id, s)}
        >
          {s === "cancelada" ? "Cancelar" : OS_STATUS_LABEL[s]}
        </Button>
      ))}
    </div>
  );
}
