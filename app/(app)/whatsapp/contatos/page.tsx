import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatPhone } from "@/lib/format";
import { excluirContato } from "./actions";
import { ImportarContatos } from "@/components/whatsapp/importar-contatos";
import { StatusContato } from "@/components/whatsapp/status-contato";
import { AjudaTela } from "@/components/app/ajuda-tela";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { DeleteButton } from "@/components/app/delete-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Contatos · WhatsApp" };

const ORIGEM_LABEL: Record<string, string> = {
  manual: "Manual",
  csv: "Lista",
  cliente: "Cliente",
  whatsapp: "WhatsApp",
};

type Contato = {
  id: string;
  nome: string;
  telefone: string;
  status: string;
  origem: string;
  tags: string[] | null;
};

export default async function ContatosPage() {
  await requireRole(["owner", "comercial", "financeiro"]);
  const supabase = await createClient();

  const [{ data, count }, { count: clientesComTel }] = await Promise.all([
    supabase
      .from("wa_contatos")
      .select("id, nome, telefone, status, origem, tags", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("ativo", true)
      .not("telefone", "is", null),
  ]);
  const contatos = (data as Contato[] | null) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Contatos"
        description="Quem vai receber as campanhas de WhatsApp."
        count={count ?? contatos.length}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AjudaTela
              titulo="Como funcionam os Contatos"
              descricao="É a base de quem pode receber suas campanhas de WhatsApp."
              topicos={[
                {
                  titulo: "Importar contatos",
                  itens: [
                    "Clique em 'Importar' e escolha a origem.",
                    "De uma lista (CSV): suba um arquivo com nome e telefone.",
                    "Dos clientes do CRM: traz os clientes ativos que têm telefone.",
                    "Do WhatsApp conectado: importa contatos da conta ligada.",
                  ],
                },
                {
                  titulo: "Entender a tabela",
                  itens: [
                    "Origem indica de onde o contato veio (Lista, Cliente, WhatsApp, Manual).",
                    "Tags ajudam a segmentar quem recebe cada campanha.",
                    "Telefone aparece formatado; é o número usado no disparo.",
                  ],
                },
                {
                  titulo: "Status e limpeza",
                  itens: [
                    "Ajuste o status de cada contato (ex.: ativo, descadastrado) no seletor da linha.",
                    "Quem pede para sair deve ficar descadastrado e não entra nas campanhas.",
                    "A lixeira remove o contato da base.",
                  ],
                },
              ]}
              dica="Respeite quem pediu para sair: manter a lista limpa protege seu número de bloqueios."
            />
            <ImportarContatos clientesComTelefone={clientesComTel ?? 0} />
          </div>
        }
      />

      {contatos.length === 0 ? (
        <EmptyState
          title="Nenhum contato ainda"
          description="Importe de uma lista, dos clientes do CRM ou do WhatsApp conectado."
        />
      ) : (
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contatos.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.nome}
                    {c.tags && c.tags.length > 0 && (
                      <span className="ml-2 inline-flex gap-1">
                        {c.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                        ))}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{formatPhone(c.telefone)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ORIGEM_LABEL[c.origem] ?? c.origem}</TableCell>
                  <TableCell>
                    <StatusContato id={c.id} status={c.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteButton nome={c.nome} action={excluirContato.bind(null, c.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
