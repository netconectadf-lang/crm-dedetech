import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { requireTenant } from "@/lib/auth";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireTenant();

  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("tenant_id, tenants(razao_social, nome_fantasia)")
    .eq("user_id", ctx.userId);

  const tenants = (
    (data as
      | {
          tenant_id: string;
          tenants: { razao_social: string; nome_fantasia: string | null } | null;
        }[]
      | null) ?? []
  ).map((m) => ({
    id: m.tenant_id,
    nome: m.tenants?.nome_fantasia || m.tenants?.razao_social || "Empresa",
  }));

  return (
    <div className="flex flex-1">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl md:flex">
        <Link
          href="/dashboard"
          className="group flex h-14 items-center gap-2.5 border-b border-border/60 px-5"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-[0_0_18px_-2px_var(--color-primary)] transition-transform group-hover:scale-105">
            D
          </span>
          <span className="font-semibold tracking-tight">
            Dedetech
            <span className="ml-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              crm
            </span>
          </span>
        </Link>
        <div className="flex-1 overflow-y-auto">
          <Sidebar role={ctx.role} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          tenants={tenants}
          activeTenantId={ctx.tenantId}
          userName={ctx.fullName}
          userEmail={ctx.email}
          role={ctx.role}
        />
        <div id="conteudo" tabIndex={-1} className="flex-1 overflow-auto outline-none">
          {children}
        </div>
      </div>
    </div>
  );
}
