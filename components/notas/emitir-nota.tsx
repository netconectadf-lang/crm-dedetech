"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ScrollText } from "lucide-react";

import { emitirNotaDaCobranca } from "@/app/(app)/notas/actions";
import { Button } from "@/components/ui/button";

type Props = {
  arId: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  label?: string;
};

export function EmitirNotaButton({ arId, variant = "ghost", size = "sm", label = "NFS-e" }: Props) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      title="Emitir NFS-e"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await emitirNotaDaCobranca(arId);
          if (r.error) toast.error(r.error);
          else toast.success(r.message ?? "NFS-e enviada.");
        })
      }
    >
      <ScrollText className="size-4" /> {pending ? "Emitindo…" : label}
    </Button>
  );
}
