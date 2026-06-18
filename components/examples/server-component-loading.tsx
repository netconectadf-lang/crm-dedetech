/**
 * EXEMPLO 5: Server Component com Suspense e TransitionBoundary
 *
 * Útil para componentes que fazem fetch de dados no servidor
 * A animação acontece automaticamente durante o carregamento
 */

import { TransitionBoundary, SkeletonCard } from "@/components/animations"

// Simula um Server Component que faz fetch
async function DashboardContent() {
  // Em produção, isso seria um fetch/query real
  await new Promise((resolve) => setTimeout(resolve, 2000))

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-2">Card {i}</h3>
          <p className="text-muted-foreground">Carregado do servidor</p>
        </div>
      ))}
    </div>
  )
}

export function ServerComponentLoading() {
  return (
    <TransitionBoundary
      skeletonVariant="card"
      skeletonCount={3}
    >
      <DashboardContent />
    </TransitionBoundary>
  )
}

// USO EM page.tsx:
// import { ServerComponentLoading } from "@/components/examples/server-component-loading"
//
// export default function Page() {
//   return (
//     <div className="space-y-6">
//       <h1>Dashboard</h1>
//       <ServerComponentLoading />
//     </div>
//   )
// }
