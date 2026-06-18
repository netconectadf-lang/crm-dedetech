# 🚀 Quick Start — Sistema de Feedback Visual

Tudo pronto para usar! Aqui está o caminho mais rápido para começar.

---

## ✅ O que foi criado

```
✓ lib/animations.config.ts              — Configuração centralizada
✓ components/animations/                — 5 componentes reutilizáveis
  ├─ loading-spinner.tsx
  ├─ skeleton-loader.tsx
  ├─ page-transition.tsx
  ├─ fade-in-out.tsx
  └─ transition-boundary.tsx
✓ hooks/use-loading.ts                  — Gerenciamento de loading
✓ components/examples/                  — 6 exemplos práticos
✓ components/providers/animation-provider.tsx — Provider global (opcional)
✓ app/globals.css                       — CSS variables para skeleton
```

---

## 🎯 Casos de Uso Rápidos

### 1️⃣ Sua página inteira precisa de transição?

```tsx
// app/dashboard/page.tsx
import { PageTransition } from "@/components/animations"

export default function Dashboard() {
  return (
    <PageTransition>
      {/* seu conteúdo */}
    </PageTransition>
  )
}
```

### 2️⃣ Está carregando dados?

```tsx
import { SkeletonCard } from "@/components/animations"
import { useLoading } from "@/hooks/use-loading"

export function MyComponent() {
  const [data, setData] = useState([])
  const { isLoading, runAsync } = useLoading()

  useEffect(() => {
    runAsync(async () => {
      const res = await fetch("/api/data")
      setData(await res.json())
    })
  }, [runAsync])

  return isLoading ? <SkeletonCard count={3} /> : <div>{/* dados */}</div>
}
```

### 3️⃣ Tem filtros/tabs que mudam conteúdo?

```tsx
import { useMultipleLoading } from "@/hooks/use-loading"

export function FilterButtons() {
  const { isLoading, runAsync } = useMultipleLoading()

  const handleFilter = async (filterId: string) => {
    await runAsync(filterId, async () => {
      await applyFilter(filterId)
    })
  }

  return (
    <button
      onClick={() => handleFilter("active")}
      disabled={isLoading("active")}
    >
      {isLoading("active") && <LoadingSpinner size="sm" />}
      Filtro Ativo
    </button>
  )
}
```

### 4️⃣ Tem um Server Component que faz fetch?

```tsx
import { TransitionBoundary } from "@/components/animations"

export default function Page() {
  return (
    <TransitionBoundary skeletonVariant="card" skeletonCount={3}>
      <MyAsyncServerComponent />
    </TransitionBoundary>
  )
}
```

### 5️⃣ Grid de cards que carrega?

```tsx
import { SkeletonCard } from "@/components/animations"
import { motion } from "motion/react"

export function CardGrid() {
  const [cards, setCards] = useState([])
  const { isLoading, runAsync } = useLoading()

  useEffect(() => {
    runAsync(async () => {
      const res = await fetch("/api/cards")
      setCards(await res.json())
    })
  }, [runAsync])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return isLoading ? (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  ) : (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 gap-4">
      {cards.map(card => (
        <motion.div key={card.id} variants={item}>
          {/* card */}
        </motion.div>
      ))}
    </motion.div>
  )
}
```

---

## 🎨 Skeleton Variants

Escolha o variant certo para seu conteúdo:

```tsx
// Para cards
<SkeletonCard count={3} />

// Para linhas de texto
<SkeletonLine count={5} />

// Para linhas de tabela
<SkeletonTableRow count={5} />

// Para avatares + nome/descrição
<SkeletonAvatar count={3} />

// Para imagens redondas
<SkeletonLoader variant="circle" count={2} />
```

---

## ⚡ Ajustes Globais

Todas as animações vêm de `lib/animations.config.ts`:

```tsx
// Quer mais rápido?
durations: {
  fast: 0.1,
  normal: 0.2,
  slow: 0.4,
}

// Quer timing diferente?
easings: {
  spring: [0.16, 1, 0.3, 1],  // padrão - spring feel
  linear: [0, 0, 1, 1],        // constante (spinners)
  inOut: [0.4, 0, 0.2, 1],     // suave
}

// Quer menos stagger?
stagger: {
  itemDelay: 0.05,
  containerDelay: 0.05,
}
```

**Edite ali e toda animação do app se adapta.**

---

## 📚 Exemplos Completos

Veja pasta `components/examples/`:

1. **page-with-transition.tsx** — Página simples com transição
2. **table-with-loading.tsx** — Tabela com skeleton
3. **filters-with-loading.tsx** — Filtros/tabs com loading individual
4. **card-grid-loading.tsx** — Grid de cards com stagger
5. **server-component-loading.tsx** — Server component + Suspense
6. **whatsapp-campaign-editor.tsx** — Exemplo real (campanha WhatsApp)

Copie, adapte, coloque no seu componente!

---

## 🔧 TypeScript

Tudo é tipado:

```tsx
// useLoading retorna:
const { isLoading, startLoading, stopLoading, runAsync } = useLoading()
//      ^boolean  ^() => void    ^() => void   ^<T>(fn) => Promise<T>

// useMultipleLoading retorna:
const { isLoading, startLoading, stopLoading, runAsync } = useMultipleLoading()
//      ^(key: string) => boolean
```

---

## ♿ Acessibilidade

O sistema respeita `prefers-reduced-motion` automaticamente:

```css
@media (prefers-reduced-motion: reduce) {
  /* durações viram 0.01ms */
  /* teste em: DevTools → Rendering → Emulate CSS media */
}
```

---

## 🎯 Checklist Mínimo

Para adicionar feedback visual em qualquer feature:

- [ ] Página tem `<PageTransition>`?
- [ ] Fetch de dados mostra skeleton/spinner?
- [ ] Abas/filtros usam `useMultipleLoading()`?
- [ ] Grid de cards tem stagger?

---

## 🚨 NÃO FAÇA

```tsx
// ❌ Não animar width/height
animate={{ width: 100, height: 100 }}

// ✅ Use scale/scaleX/scaleY
animate={{ scale: 1 }}

// ❌ Não animar top/left
animate={{ top: 0, left: 0 }}

// ✅ Use x/y
animate={{ x: 0, y: 0 }}

// ❌ Não adicionar durations sem motivo
transition={{ duration: 10 }}

// ✅ Use as configurado
import { animationConfig } from "@/lib/animations.config"
transition={{ duration: animationConfig.durations.normal }}
```

---

## 🌐 Importações Rápidas

```tsx
// Componentes
import { PageTransition, LoadingSpinner, SkeletonCard } from "@/components/animations"

// Hooks
import { useLoading, useMultipleLoading } from "@/hooks/use-loading"

// Config
import { animationConfig, slideUpVariants } from "@/lib/animations.config"

// Motion (quando precisar algo custom)
import { motion, AnimatePresence } from "motion/react"
```

---

## 📖 Documentação Completa

Para tudo: `FEEDBACK_VISUAL_GUIDE.md`

Para exemplos específicos: `components/examples/README.md`

---

## 💡 Dicas

1. **Skeleton ao invés de spinner** — Mantém layout estável
2. **useMultipleLoading para abas** — Feedback individual é melhor
3. **Stagger em listas** — Sensação de progresso
4. **Cross-fade em mudanças** — Mais suave que simplesmente aparecer
5. **Hover states subtis** — `whileHover={{ y: -4 }}` é suficiente

---

## ❓ Dúvidas?

Cheque:
1. `FEEDBACK_VISUAL_GUIDE.md` — Referência completa
2. `components/examples/` — Código pronto para copiar
3. `lib/animations.config.ts` — Ajustes globais
4. [Motion Docs](https://motion.dev) — Documentação oficial

---

**Pronto para começar?** Copie um exemplo acima em seu componente! 🎉
