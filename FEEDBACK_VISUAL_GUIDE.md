# 🎬 Sistema Global de Feedback Visual

Guia completo de animações, transições e loading states para o Dedetech CRM.

---

## 📦 Instalação

Já instalado: `npm install motion`

---

## 🎯 Componentes Disponíveis

### 1. **PageTransition** — Transições entre rotas

```tsx
import { PageTransition } from "@/components/animations"

export default function Page() {
  return (
    <PageTransition variant="slide-up">
      <h1>Conteúdo da página</h1>
    </PageTransition>
  )
}
```

**Variantes:** `"slide-up"` | `"fade"` | `"scale"`

---

### 2. **LoadingSpinner** — Spinner animado

```tsx
import { LoadingSpinner } from "@/components/animations"

<button disabled={isLoading}>
  {isLoading && <LoadingSpinner size="sm" />}
  Enviar
</button>
```

**Tamanhos:** `"sm"` | `"md"` | `"lg"`

---

### 3. **SkeletonLoader** — Carregamentos estruturados

```tsx
import { SkeletonLoader } from "@/components/animations"

// Skeleton genérico
<SkeletonLoader variant="card" count={3} />

// Variantes específicas (mais semânticas)
<SkeletonCard count={3} />
<SkeletonTableRow count={5} />
<SkeletonLine count={2} />
<SkeletonAvatar count={1} />
```

**Variantes:** `"card"` | `"table-row"` | `"line"` | `"avatar"` | `"circle"` | `"table-cell"`

---

### 4. **FadeInOut** — Cross-fade simples

```tsx
import { FadeInOut } from "@/components/animations"

<FadeInOut isVisible={showContent}>
  {/* Conteúdo que aparece/desaparece */}
</FadeInOut>
```

---

### 5. **TransitionBoundary** — Server Components + Suspense

```tsx
import { TransitionBoundary } from "@/components/animations"

<TransitionBoundary skeletonVariant="card" skeletonCount={3}>
  <AsyncServerComponent />
</TransitionBoundary>
```

---

## 🎣 Hooks para Loading States

### useLoading — Single loading state

```tsx
import { useLoading } from "@/hooks/use-loading"

export function MyComponent() {
  const { isLoading, runAsync } = useLoading()

  const handleClick = async () => {
    await runAsync(async () => {
      await fetch("/api/data")
    })
  }

  return (
    <button onClick={handleClick} disabled={isLoading}>
      {isLoading ? <LoadingSpinner size="sm" /> : "Enviar"}
    </button>
  )
}
```

### useMultipleLoading — Múltiplos loading states

Útil para abas, filtros, ou múltiplas ações simultâneas:

```tsx
import { useMultipleLoading } from "@/hooks/use-loading"

export function FilterTabs() {
  const { isLoading, runAsync } = useMultipleLoading()

  const handleTabChange = async (tabId: string) => {
    await runAsync(tabId, async () => {
      await fetch(`/api/tab/${tabId}`)
    })
  }

  return (
    <div>
      <button
        disabled={isLoading("tab-1")}
        onClick={() => handleTabChange("tab-1")}
      >
        {isLoading("tab-1") && <LoadingSpinner size="sm" />}
        Tab 1
      </button>
      <button
        disabled={isLoading("tab-2")}
        onClick={() => handleTabChange("tab-2")}
      >
        {isLoading("tab-2") && <LoadingSpinner size="sm" />}
        Tab 2
      </button>
    </div>
  )
}
```

---

## ⚙️ Configuração Centralizada

Arquivo: `lib/animations.config.ts`

```tsx
export const animationConfig = {
  durations: {
    fast: 0.15,      // Spinners, ícones
    normal: 0.35,    // Transições padrão
    slow: 0.6,       // Page transitions
    skeleton: 1.5,   // Shimmer
  },
  easings: {
    spring: [0.16, 1, 0.3, 1],  // Padrão recomendado
    linear: [0, 0, 1, 1],
    inOut: [0.4, 0, 0.2, 1],
  },
  stagger: {
    itemDelay: 0.08,
    containerDelay: 0.1,
  },
}
```

**Para customizar durações/easings globalmente, edite este arquivo.**

---

## 🎨 Exemplos de Uso Real

### Exemplo 1: Página simples com transição

```tsx
// app/dashboard/page.tsx
import { PageTransition } from "@/components/animations"

export default function Dashboard() {
  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        {/* Conteúdo */}
      </div>
    </PageTransition>
  )
}
```

### Exemplo 2: Tabela com skeleton

```tsx
import { SkeletonTableRow } from "@/components/animations"
import { useLoading } from "@/hooks/use-loading"

export function DataTable() {
  const [data, setData] = useState([])
  const { isLoading, runAsync } = useLoading()

  useEffect(() => {
    runAsync(async () => {
      const res = await fetch("/api/data")
      setData(await res.json())
    })
  }, [runAsync])

  return (
    <table>
      <tbody>
        {isLoading ? (
          <SkeletonTableRow count={5} />
        ) : (
          data.map(row => <tr key={row.id}>{/* ... */}</tr>)
        )}
      </tbody>
    </table>
  )
}
```

### Exemplo 3: Filtros com cross-fade

```tsx
import { motion, AnimatePresence } from "motion/react"
import { LoadingSpinner, CrossFade } from "@/components/animations"
import { useMultipleLoading } from "@/hooks/use-loading"
import { animationConfig } from "@/lib/animations.config"

export function FilteredContent() {
  const [activeTab, setActiveTab] = useState("all")
  const [content, setContent] = useState(null)
  const { isLoading, runAsync } = useMultipleLoading()

  const handleTabChange = async (tabId: string) => {
    setActiveTab(tabId)
    await runAsync(tabId, async () => {
      const res = await fetch(`/api/filter?type=${tabId}`)
      setContent(await res.json())
    })
  }

  return (
    <div>
      <div className="flex gap-2">
        {["all", "active", "inactive"].map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            disabled={isLoading(tab)}
          >
            {isLoading(tab) && <LoadingSpinner size="sm" />}
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: animationConfig.durations.normal,
            ease: animationConfig.easings.spring,
          }}
        >
          {isLoading(activeTab) ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            content && <div>{/* Conteúdo */}</div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
```

### Exemplo 4: Cards em grid com stagger

```tsx
import { motion } from "motion/react"
import { animationConfig } from "@/lib/animations.config"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: animationConfig.stagger.itemDelay,
      delayChildren: animationConfig.stagger.containerDelay,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animationConfig.durations.normal,
      ease: animationConfig.easings.spring,
    },
  },
}

export function CardGrid({ cards }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {cards.map(card => (
        <motion.div
          key={card.id}
          variants={item}
          whileHover={{ y: -4 }}
          className="p-6 rounded-lg border"
        >
          {card.title}
        </motion.div>
      ))}
    </motion.div>
  )
}
```

---

## 🔧 Padrões Recomendados

### Para Page Transitions
- Use `PageTransition` com variant `"slide-up"` (mais elegante)
- Duração: `0.35s`

### Para Loading de Dados
- **Tabelas:** `SkeletonTableRow`
- **Cards:** `SkeletonCard` com stagger
- **Listas:** `SkeletonLine` com stagger
- **Avatares:** `SkeletonAvatar`

### Para Mudanças de Estado
- Use `AnimatePresence` + `motion.div` com `opacity` (mais rápido)
- Para tabs/filtros: use `useMultipleLoading()` para feedback individual

### Para Server Components
- Envolva com `TransitionBoundary`
- Deixa a animação automática

---

## ♿ Acessibilidade

O sistema respeita `prefers-reduced-motion`:

```tsx
import { useReducedMotion } from "motion/react"

const reduceMotion = useReducedMotion()

// Desativa animações se o usuário preferir
<motion.div
  initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: reduceMotion ? 0.01 : 0.5 }}
/>
```

**A maioria dos componentes já lida com isso automaticamente.**

---

## 📊 Durations Recomendadas

| Caso | Duração | Easing |
|------|---------|--------|
| Spinner/Ícone | 0.15s | linear |
| Fade/Slide | 0.35s | spring |
| Page Transition | 0.35s | spring |
| Skeleton Shimmer | 1.5s | linear |
| Stagger entre itens | 0.08s | spring |

---

## 🚀 Performance

✅ **Seguro animar:**
- `opacity`
- `transform` (x, y, scale, rotate)
- `filter` (blur, brightness)

❌ **Evitar:**
- `width`, `height` (use `scaleX`, `scaleY`)
- `top`, `left` (use `x`, `y`)
- `margin`, `padding`, `fontSize`

Motion otimiza automaticamente — use a propriedade correta e deixa o framework cuidar.

---

## 📝 Checklist de Implementação

Ao adicionar feedback visual a um novo componente/página:

- [ ] Página tem `PageTransition`?
- [ ] Fetch de dados usa `useLoading()` ou `TransitionBoundary`?
- [ ] Skeleton appropriado para tipo de conteúdo?
- [ ] Filtros/Tabs usam `useMultipleLoading()`?
- [ ] Animações de entrada em cards/listas?
- [ ] Durations estão em `animationConfig`?
- [ ] Testou em `prefers-reduced-motion`?

---

## 🔗 Referências

- [Motion Documentation](https://motion.dev)
- Arquivo: `lib/animations.config.ts`
- Exemplos: `components/examples/`
