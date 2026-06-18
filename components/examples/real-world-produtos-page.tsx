/**
 * EXEMPLO REAL: Página de Produtos com DataTableBoundary
 *
 * Antes: Click → carrega → aparece tabela
 * Depois: Click → skeleton → fade da tabela
 *
 * Esta é uma estrutura simplificada de app/(app)/produtos/page.tsx
 * mostrando como integrar DataTableBoundary
 */

import { createClient } from "@/lib/supabase/server"
import { DataTableBoundary } from "@/components/animations"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Extract para server component
async function ProdutosTable() {
  const supabase = await createClient()

  const { data: produtos } = await supabase
    .from("products")
    .select("id, nome_comercial, registro_anvisa, categoria, preco_venda, ativo")
    .order("nome_comercial")

  const items = (produtos as any[]) || []

  if (items.length === 0) {
    return <div className="text-center py-8">Nenhum produto cadastrado</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produto</TableHead>
          <TableHead>Registro ANVISA</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Preço</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.nome_comercial}</TableCell>
            <TableCell className="font-mono text-sm">{p.registro_anvisa || "—"}</TableCell>
            <TableCell className="capitalize">{p.categoria || "—"}</TableCell>
            <TableCell>{p.preco_venda}</TableCell>
            <TableCell>{p.ativo ? "Ativo" : "Inativo"}</TableCell>
            <TableCell className="text-right">
              {/* Botões de editar/deletar aqui */}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// Main component
export function ProdutosPageExample() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Produtos / Saneantes</h1>
        <p className="text-muted-foreground mt-1">Cadastro de produtos com registro ANVISA</p>
      </div>

      {/*
        AQUI É A MÁGICA!

        Ao navegar para esta página, você vê:
        1. Page transition (fade + slide) — vem do template.tsx
        2. Enquanto ProdutosTable carrega → skeleton de tabela
        3. Quando pronto → fade do conteúdo
      */}
      <DataTableBoundary count={8}>
        <ProdutosTable />
      </DataTableBoundary>
    </main>
  )
}

/**
 * COMO APLICAR NA SUA PÁGINA REAL:
 *
 * 1. Extraia a lógica de fetch em um componente async separado (ProdutosTable)
 * 2. Envolva com <DataTableBoundary count={8}>
 * 3. Pronto! Sua página terá feedback visual
 *
 * ANTES (app/(app)/produtos/page.tsx):
 * ────────────────────────────────────
 * export default async function ProdutosPage() {
 *   const supabase = await createClient()
 *   const { data: produtos } = await supabase.from("products").select("*")
 *
 *   return (
 *     <div>
 *       <Table>
 *         {produtos.map(...)}
 *       </Table>
 *     </div>
 *   )
 * }
 *
 * DEPOIS (com DataTableBoundary):
 * ─────────────────────────────────
 * async function ProdutosTable() {
 *   const supabase = await createClient()
 *   const { data: produtos } = await supabase.from("products").select("*")
 *
 *   return (
 *     <Table>
 *       {produtos.map(...)}
 *     </Table>
 *   )
 * }
 *
 * export default function ProdutosPage() {
 *   return (
 *     <DataTableBoundary count={8}>
 *       <ProdutosTable />
 *     </DataTableBoundary>
 *   )
 * }
 *
 * A mudança é mínima, mas o impacto visual é grande!
 */
