import { Plus, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { excluirScript } from "./actions";
import { ScriptEditor } from "@/components/whatsapp/script-editor";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { DeleteButton } from "@/components/app/delete-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Scripts · WhatsApp" };

type Script = { id: string; nome: string; corpo: string; ativo: boolean };

export default async function ScriptsPage() {
  await requireRole(["owner", "comercial"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("wa_scripts")
    .select("id, nome, corpo, ativo")
    .order("nome");
  const scripts = (data as Script[] | null) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Scripts"
        description="Mensagens prontas com variáveis ({{nome}}, {{empresa}}…) para usar nas campanhas."
        count={scripts.length}
        action={
          <ScriptEditor
            trigger={
              <Button size="sm">
                <Plus className="size-4" /> Novo script
              </Button>
            }
          />
        }
      />

      {scripts.length === 0 ? (
        <EmptyState
          title="Nenhum script ainda"
          description="Crie mensagens prontas para reaproveitar nas campanhas de WhatsApp."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {scripts.map((s) => (
            <Card key={s.id} className={s.ativo ? undefined : "opacity-55"}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{s.nome}</CardTitle>
                  {!s.ativo && <Badge variant="secondary">Inativo</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">{s.corpo}</p>
                <div className="flex justify-end gap-1">
                  <ScriptEditor
                    script={s}
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Pencil className="size-4" /> Editar
                      </Button>
                    }
                  />
                  <DeleteButton nome={s.nome} action={excluirScript.bind(null, s.id)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
