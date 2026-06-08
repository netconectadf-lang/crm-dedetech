"use client";

import { useState } from "react";

import type { SaveState } from "@/lib/crud-helpers";
import { ResourceForm, type Field } from "@/components/app/resource-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ResourceDialog({
  trigger,
  title,
  description,
  fields,
  action,
  defaultValues,
  submitLabel,
  docOcr,
  autoOpen = false,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  fields: Field[];
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>;
  defaultValues?: Record<string, unknown>;
  submitLabel?: string;
  docOcr?: boolean;
  /** Abre o dialog automaticamente (ex.: atalho do dashboard ?nova=1). */
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ResourceForm
          fields={fields}
          action={action}
          defaultValues={defaultValues}
          submitLabel={submitLabel}
          onSuccess={() => setOpen(false)}
          docOcr={docOcr}
        />
      </DialogContent>
    </Dialog>
  );
}
