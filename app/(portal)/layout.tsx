import Link from "next/link";

import { getPortalContext } from "@/lib/portal";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

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
      <header className="flex h-14 items-center justify-between border-b px-6">
        <Link href="/portal" className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-teal-700 text-sm font-bold text-white">
            D
          </span>
          <span className="font-semibold">Portal do Cliente</span>
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
