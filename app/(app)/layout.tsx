import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Shell do app protegido. A sidebar por papel e a topbar entram na Fase 1.
 * Por ora garante apenas que há sessão (defesa em profundidade — o middleware
 * já redireciona, e a RLS é a rede de segurança final).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <div className="flex flex-1 flex-col">{children}</div>;
}
