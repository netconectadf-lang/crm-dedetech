import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { LogOut } from "lucide-react";

import { getColaboradorContext } from "@/lib/colaborador";
import { logoutAction } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Portal do Colaborador",
  robots: { index: false, follow: false },
};

export default async function ColaboradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getColaboradorContext();
  if (!ctx) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl">
        <span className="flex items-center gap-2">
          <Image src="/logo/dedetech-simbolo-cor.png" alt="Dedetech" width={28} height={28} className="size-7" />
          <span className="text-sm font-semibold tracking-tight">Olá, {ctx.nome.split(" ")[0]}</span>
        </span>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
            <LogOut className="size-4" /> Sair
          </Button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 p-4">{children}</main>
    </div>
  );
}
