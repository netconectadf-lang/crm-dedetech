"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { inviteMember, type ActionState } from "@/app/(app)/equipe/actions";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InviteForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    inviteMember,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message) {
      toast.success(state.message);
      formRef.current?.reset();
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <Input
        name="email"
        type="email"
        placeholder="email@empresa.com"
        required
        className="sm:flex-1"
      />
      <Select name="role" defaultValue="operacional">
        <SelectTrigger className="sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ASSIGNABLE_ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {ROLE_LABELS[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" disabled={pending}>
        Convidar
      </Button>
    </form>
  );
}
