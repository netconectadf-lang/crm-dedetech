import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { requireTenant } from "@/lib/auth";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";

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
      <aside className="hidden w-60 shrink-0 flex-col border-r md:flex">
        <Link
          href="/dashboard"
          className="flex h-14 items-center gap-2 border-b px-5"
        >
          <span className="grid size-7 place-items-center rounded-md bg-teal-700 text-sm font-bold text-white">
            D
          </span>
          <span className="font-semibold tracking-tight">Dedetech</span>
        </Link>
        <Sidebar role={ctx.role} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          tenants={tenants}
          activeTenantId={ctx.tenantId}
          userName={ctx.fullName}
          userEmail={ctx.email}
          role={ctx.role}
        />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
