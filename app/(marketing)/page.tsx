import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingHome() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-widest text-teal-600">
          Dedetech
        </p>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          Gestão sem pragas
        </h1>
        <p className="mx-auto max-w-xl text-balance text-lg text-muted-foreground">
          A plataforma completa para empresas de controle de pragas: funil
          comercial, contratos recorrentes, ordens de serviço de campo, estoque
          com rastreabilidade e financeiro — tudo num lugar só.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/signup">Começar agora</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Entrar</Link>
        </Button>
      </div>
    </main>
  );
}
