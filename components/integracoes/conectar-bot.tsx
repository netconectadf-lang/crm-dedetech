"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { conectarBot } from "@/app/(app)/integracoes/telegram/actions";
import { AjudaTelegram } from "@/components/integracoes/ajuda-telegram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SaveState } from "@/lib/crud-helpers";

export function ConectarBot() {
  const [state, action, pending] = useActionState<SaveState, FormData>(conectarBot, null);

  useEffect(() => {
    if (state?.message) toast.success(state.message);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="max-w-md space-y-3">
      <div className="grid gap-2">
        <Label htmlFor="bot_token">Token do bot (do @BotFather)</Label>
        <Input
          id="bot_token"
          name="bot_token"
          placeholder="123456789:AAH..."
          autoComplete="off"
          required
        />
      </div>
      <div className="flex items-center gap-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Conectando…" : "Conectar bot"}
        </Button>
        <AjudaTelegram />
      </div>
    </form>
  );
}
