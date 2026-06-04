import type { Metadata } from "next";
import Link from "next/link";

import { getPortalContext } from "@/lib/portal";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const portal = await getPortalContext();

  if (!portal) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold">Acesso não encontrado</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Esta conta não está vinculada a nenhum cliente. Peça à empresa para
          enviar seu convite de acesso ao portal.
        </p>
        <form action={logoutAction}>
          <Button type="submit" variant="outline">
            Sair
          </Button>
        </form>
      </main>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/70 px-6 backdrop-blur-xl">
        <Link href="/portal" className="group flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-[0_0_18px_-2px_var(--color-primary)] transition-transform group-hover:scale-105">
            D
          </span>
          <span className="font-semibold tracking-tight">
            Portal
            <span className="ml-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              do cliente
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {portal.clientName}
          </span>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
