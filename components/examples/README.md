# 📚 Exemplos de Feedback Visual

Aqui estão 5 exemplos práticos de como implementar feedback visual em diferentes contextos.

## 1️⃣ Page Transition
**Arquivo:** `page-with-transition.tsx`

Transição suave ao entrar em uma página. Adicione `PageTransition` no seu `page.tsx`.

```tsx
<PageTransition variant="slide-up">
  {/* Conteúdo */}
</PageTransition>
```

---

## 2️⃣ Table com Skeleton Loading
**Arquivo:** `table-with-loading.tsx`

Tabela que mostra skeleton enquanto carrega dados. Usa `useLoading()` para gerenciar estado.

**Elementos:**
- SkeletonTableRow durante carregamento
- Dados aparecem com transição suave
- useLoading() gerencia o estado

---

## 3️⃣ Filtros com Loading
**Arquivo:** `filters-with-loading.tsx`

Sistema de abas/filtros com:
- Indicador de carregamento individual por aba
- Cross-fade entre conteúdos
- Underline animado no tab ativo
- useMultipleLoading() para múltiplos estados

**Caso de uso:**
- Mudança de filtros em dashboards
- Tabs em páginas de detalhes
- Múltiplas ações simultâneas

---

## 4️⃣ Grid de Cards com Stagger
**Arquivo:** `card-grid-loading.tsx`

Grid de cards com:
- Skeleton cards durante carregamento
- Entrada animada em sequência (stagger)
- Hover effect sutil
- Animação de valor (número crescente)

**Caso de uso:**
- Dashboards de métricas
- Listagem de produtos/serviços
- Cards informativos

---

## 5️⃣ Server Component + Suspense
**Arquivo:** `server-component-loading.tsx`

Componente servidor com `TransitionBoundary`:
- Suspense automático
- Skeleton configurável
- Sem JavaScript necessário para o fallback

```tsx
<TransitionBoundary skeletonVariant="card">
  <AsyncServerComponent />
</TransitionBoundary>
```

---

## 🎯 Como Usar

1. Copie o padrão que mais se adequa
2. Adapte para sua estrutura de dados
3. Customize cores/tamanhos conforme necessário
4. Valide em `prefers-reduced-motion`

---

## ⚙️ Configuração Centralizada

Todas as durações e easings vêm de `lib/animations.config.ts`.

Para customizar globalmente, edite:
```tsx
export const animationConfig = {
  durations: { /* ... */ },
  easings: { /* ... */ },
}
```

---

## 📖 Documentação Completa

Veja `FEEDBACK_VISUAL_GUIDE.md` na raiz do projeto.
