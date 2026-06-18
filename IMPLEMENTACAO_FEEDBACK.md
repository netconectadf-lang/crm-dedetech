# 🚀 Implementação do Feedback Visual — Guia Prático

Agora que o sistema está pronto, aqui está como integrar em suas páginas reais.

---

## ✅ O que Já Está Funcionando

### 1️⃣ Page Transitions (Automático)
- ✓ Quando você clica em um link, a página faz **fade + slide up**
- ✓ Funciona em TODAS as rotas (app, auth, colaborador, portal, marketing)
- ✓ Arquivo: `app/*/template.tsx`

### 2️⃣ Dashboard Loading (Já Existe)
- ✓ Dashboard mostra skeleton enquanto carrega
- ✓ Arquivo: `app/(app)/dashboard/loading.tsx`

---

## 🔧 Próximo Passo — Adicionar em Outras Páginas

### Padrão 1: Página Simples com Fetch

**ANTES:**
```tsx
// app/(app)/clientes/page.tsx
export default async function ClientesPage() {
  const clientes = await fetchClientes()
  
  return (
    <div>
      <h1>Clientes</h1>
      {/* lista de clientes */}
    </div>
  )
}
```

**DEPOIS:**
```tsx
// app/(app)/clientes/page.tsx
import { DataBoundary } from "@/components/animations"

async function ClientesList() {
  const clientes = await fetchClientes()
  return (
    <div>
      {clientes.map(c => <div key={c.id}>{c.nome}</div>)}
    </div>
  )
}

export default function ClientesPage() {
  return (
    <div>
      <h1>Clientes</h1>
      <DataBoundary variant="line" count={5}>
        <ClientesList />
      </DataBoundary>
    </div>
  )
}
```

**O que acontece:**
- Enquanto ClientesList carrega → mostra skeleton de linhas
- Quando pronto → fade automático do conteúdo
- Você não precisa criar loading.tsx!

---

### Padrão 2: Página com Tabela

```tsx
// app/(app)/whatsapp/campanhas/page.tsx
import { DataTableBoundary } from "@/components/animations"

async function CampanhasList() {
  const campanhas = await fetchCampanhas()
  return (
    <table>
      <tbody>
        {campanhas.map(c => (
          <tr key={c.id}>
            <td>{c.nome}</td>
            <td>{c.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function CampanhasPage() {
  return (
    <div className="space-y-4">
      <h1>Campanhas WhatsApp</h1>
      <DataTableBoundary count={8}>
        <CampanhasList />
      </DataTableBoundary>
    </div>
  )
}
```

---

### Padrão 3: Página com Grid de Cards

```tsx
// app/(app)/dashboard/page.tsx
import { DataCardBoundary } from "@/components/animations"

async function MetricsCards() {
  const metrics = await getDashboardMetrics()
  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard value={metrics.revenue} label="Receita" />
      <MetricCard value={metrics.contracts} label="Contratos" />
      <MetricCard value={metrics.clients} label="Clientes" />
    </div>
  )
}

export default function Dashboard() {
  return (
    <main>
      <h1>Dashboard</h1>
      <DataCardBoundary count={3}>
        <MetricsCards />
      </DataCardBoundary>
    </main>
  )
}
```

---

### Padrão 4: Página com Múltiplas Seções

```tsx
// app/(app)/whatsapp/page.tsx
import { DataBoundary } from "@/components/animations"

async function ScriptsList() {
  const scripts = await fetchScripts()
  return scripts.map(s => <div key={s.id}>{s.name}</div>)
}

async function CampaignsList() {
  const campaigns = await fetchCampaigns()
  return campaigns.map(c => <div key={c.id}>{c.name}</div>)
}

export default function WhatsappPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2>Scripts</h2>
        <DataBoundary variant="card" count={2}>
          <ScriptsList />
        </DataBoundary>
      </section>

      <section>
        <h2>Campanhas Ativas</h2>
        <DataBoundary variant="card" count={4}>
          <CampaignsList />
        </DataBoundary>
      </section>
    </div>
  )
}
```

---

## 📊 Skeleton Variants — Qual Usar?

```tsx
// Para linhas de texto/lista simples
<DataBoundary variant="line" count={5}>
  <YourContent />
</DataBoundary>

// Para tabelas (melhor)
<DataTableBoundary count={8}>
  <YourTableContent />
</DataTableBoundary>

// Para cards em grid (melhor)
<DataCardBoundary count={6}>
  <YourCardsContent />
</DataCardBoundary>

// Para avatares + nome
<DataBoundary variant="avatar" count={3}>
  <YourAvatarsList />
</DataBoundary>

// Customizado
<DataBoundary variant="card" count={3} className="custom-class">
  <YourContent />
</DataBoundary>
```

---

## 🎯 Checklist para Cada Página

Ao trabalhar em uma página:

- [ ] Página tem `DataBoundary`/`DataTableBoundary`/`DataCardBoundary`?
- [ ] Componente async está dentro do boundary?
- [ ] Skeleton variant bate com o tipo de conteúdo?
- [ ] Count combina com quantos items você espera?

---

## 🔄 Para Componentes Client-Side (Filtros, Abas)

Quando o usuário clica em um filtro/aba e dados são recarregados:

```tsx
"use client"

import { useMultipleLoading } from "@/hooks/use-loading"
import { LoadingSpinner, SkeletonCard } from "@/components/animations"

export function FilteredCards() {
  const [content, setContent] = useState(null)
  const { isLoading, runAsync } = useMultipleLoading()

  const handleFilter = async (filterId: string) => {
    await runAsync(filterId, async () => {
      const res = await fetch(`/api/filter?id=${filterId}`)
      setContent(await res.json())
    })
  }

  return (
    <div>
      <button onClick={() => handleFilter("active")}>
        Ativos
        {isLoading("active") && <LoadingSpinner size="sm" />}
      </button>

      {isLoading("active") ? (
        <SkeletonCard count={3} />
      ) : (
        <div>{/* seu conteúdo */}</div>
      )}
    </div>
  )
}
```

---

## 📁 Estrutura de Exemplo — Antes vs Depois

### ANTES (sem feedback visual)
```
app/(app)/clientes/
  └─ page.tsx        ← clica, demora, aparece
```

### DEPOIS (com feedback visual)
```
app/(app)/clientes/
  └─ page.tsx        ← clica, SKELETON aparece,
                        depois conteúdo com fade
```

---

## ⚡ Performance

DataBoundary usa **Suspense nativo**, que é:
- ✓ Sem JavaScript adicional
- ✓ Server-first (funciona sem JS)
- ✓ Otimizado automaticamente
- ✓ Zero overhead

---

## 🎨 Customização

Quer mudar a duração? Edite:

```tsx
// lib/animations.config.ts
export const animationConfig = {
  durations: {
    normal: 0.2,  // mais rápido (era 0.35)
  }
}
```

Toda transição se adapta!

---

## 🚨 Problemas Comuns

### "Skeleton não apareceu"
- Seu componente **não é async**?
- Use `useLoading()` em vez de `DataBoundary`

### "Página carrega muito rápido, skeleton não visível"
- Isso é bom! Significa que é rápido.
- Se quiser ver o skeleton, adicione delay em dev:
```tsx
async function YourComponent() {
  await new Promise(resolve => setTimeout(resolve, 1000))
  // seu código...
}
```

### "Quero um fallback customizado"
```tsx
<DataBoundary fallback={<CustomLoadingUI />}>
  <YourAsyncComponent />
</DataBoundary>
```

---

## 📚 Exemplos Completos

Veja a pasta `components/examples/`:
- `table-with-loading.tsx` — Tabela
- `card-grid-loading.tsx` — Cards em grid
- `filters-with-loading.tsx` — Filtros/abas

Copie o padrão!

---

## 🔗 Referência Rápida

| Situação | Solução |
|----------|---------|
| Página com fetch | `<DataBoundary>` |
| Tabela carregando | `<DataTableBoundary>` |
| Grid de cards | `<DataCardBoundary>` |
| Filtro/aba (client) | `useMultipleLoading()` |
| Spinner simples | `<LoadingSpinner>` |
| Transição de página | Automático (template.tsx) |

---

## 🎯 Próximos Passos

1. **Escolha 3 páginas principais** que têm fetch
2. **Envolva com DataBoundary**
3. **Teste navegando** (clique em links)
4. **Veja o feedback visual funcionando**

Comece pequeno, depois aplique em todo o app!

---

## 💬 Perguntas?

Tudo está em:
- `FEEDBACK_VISUAL_GUIDE.md` — Referência completa
- `FEEDBACK_VISUAL_QUICKSTART.md` — Começo rápido
- `components/animations/` — Código fonte
