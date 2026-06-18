"use client"

import { Suspense, ReactNode } from "react"
import { SkeletonLoader } from "./skeleton-loader"

interface TransitionBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  skeletonVariant?: "card" | "table-row" | "line" | "avatar" | "circle" | "table-cell"
  skeletonCount?: number
}

/**
 * Componente que envolve conteúdo com Suspense
 * Mostra skeleton/fallback enquanto o conteúdo carrega
 *
 * Uso:
 * <TransitionBoundary skeletonVariant="card">
 *   <SomeAsyncComponent />
 * </TransitionBoundary>
 */
export function TransitionBoundary({
  children,
  fallback,
  skeletonVariant = "card",
  skeletonCount = 1,
}: TransitionBoundaryProps) {
  return (
    <Suspense
      fallback={
        fallback || <SkeletonLoader variant={skeletonVariant} count={skeletonCount} />
      }
    >
      {children}
    </Suspense>
  )
}
