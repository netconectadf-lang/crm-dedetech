/**
 * DataBoundary — Suspense automático com skeleton loading
 *
 * Use para envolver componentes Server que fazem fetch/query
 * Mostra skeleton enquanto carrega, depois fade do conteúdo
 *
 * Uso:
 * <DataBoundary skeletonVariant="card" count={3}>
 *   <YourAsyncComponent />
 * </DataBoundary>
 */

import { Suspense, ReactNode } from "react"
import { SkeletonLoader } from "./skeleton-loader"

type SkeletonVariant = "card" | "table-row" | "table-cell" | "line" | "circle" | "avatar"

interface DataBoundaryProps {
  children: ReactNode
  variant?: SkeletonVariant
  count?: number
  className?: string
  /**
   * Fallback customizado
   * Se não passado, usa SkeletonLoader com variant/count
   */
  fallback?: ReactNode
}

export function DataBoundary({
  children,
  variant = "card",
  count = 1,
  className,
  fallback,
}: DataBoundaryProps) {
  const defaultFallback = (
    <SkeletonLoader
      variant={variant as any}
      count={count}
      className={className}
    />
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  )
}

/**
 * Variante específica para listas/tabelas
 */
export function DataTableBoundary({
  children,
  count = 5,
}: {
  children: ReactNode
  count?: number
}) {
  return (
    <DataBoundary variant="table-row" count={count}>
      {children}
    </DataBoundary>
  )
}

/**
 * Variante específica para cards em grid
 */
export function DataCardBoundary({
  children,
  count = 3,
}: {
  children: ReactNode
  count?: number
}) {
  return (
    <DataBoundary variant="card" count={count}>
      {children}
    </DataBoundary>
  )
}
