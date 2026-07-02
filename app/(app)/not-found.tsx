import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Compass className="size-6" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground">
          O registro pode ter sido removido ou o link está incorreto.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Voltar ao início</Link>
      </Button>
    </main>
  );
}
