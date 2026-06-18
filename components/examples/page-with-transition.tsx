"use client"

/**
 * EXEMPLO 1: Página com transição suave
 *
 * Use em qualquer page.tsx para adicionar transição ao entrar na rota
 */

import { PageTransition } from "@/components/animations"

export function PageWithTransition() {
  return (
    <PageTransition variant="slide-up">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Seu Conteúdo Aqui</h1>
        {/* ... resto do conteúdo ... */}
      </div>
    </PageTransition>
  )
}

// USO EM page.tsx:
// import { PageWithTransition } from "@/components/examples/page-with-transition"
//
// export default function Page() {
//   return <PageWithTransition />
// }
