# Dedetech — Spec do Dashboard Executivo (Fase 14)

> Planejamento (não implementado). Aplica a skill **mega_desh**: dashboards por
> papel (RBAC), catálogo de KPIs com fonte/fase, charts por intenção, e a
> checklist das 100 regras de interface. Construir na **F14**, quando os dados
> de F3–F9 existirem (cada KPI declara a fase que o destrava).

## 1. Objetivo e público

Apoiar **decisão por papel** — cada perfil vê o painel da sua área (a sidebar e
a RLS já restringem por papel). O dashboard NÃO é um só: é **um por papel**,
montado a partir de um catálogo comum de widgets.

## 2. Dashboards por papel

### Owner / Admin (visão executiva)
- KPIs: **MRR de contratos**, Receita do mês, OS do dia, **Conversão do funil**,
  Inadimplência %, Clientes ativos, Ticket médio.
- Charts: Receita mensal (área), Evolução do MRR (linha), Funil por estágio
  (barra), Receita por tipo de serviço (barra), OS por status (donut).
- Alertas: estoque crítico, contratos a renovar, documentos de veículo vencendo.

### Financeiro
- KPIs: A receber (a vencer / vencido), A pagar (próx. 7/30d), Saldo em caixa,
  Inadimplência %, Comissões a pagar.
- Charts: Fluxo realizado × projetado (linha 30/60/90d), Despesa por categoria
  (barra), Receita recorrente — MRR (linha).
- Tabelas: CR vencidas (ranking de inadimplência), CP a aprovar.

### Comercial
- KPIs: Leads novos (período), Conversão %, Orçamentos pendentes, Ticket médio,
  Ciclo de venda (dias).
- Charts: Funil (barras por estágio), Conversão por vendedor (barra),
  Motivo de perda (donut).
- Tabela: follow-ups do dia.

### Operacional
- KPIs: OS do dia por status, OS atrasadas, Estoque crítico (itens), Pontos MIP
  críticos.
- Charts: OS por status (donut), OS por técnico (barra), Consumo teórico ×
  real (barra).
- Alertas: lotes a vencer (30/60/90d), veículos com revisão/doc vencendo.

### RH
- KPIs: Funcionários ativos, ASO a vencer, EPI pendente, Anuidade RT a vencer.
- Alertas: exames ocupacionais vencendo, técnico sem EPI (bloqueia OS),
  aniversariantes.

### Técnico (painel próprio)
- **Minhas OS do dia** (lista), rota do dia, próximas visitas, meu ponto.

## 3. Catálogo de KPIs (definição · fonte · fase que destrava)

| KPI | Cálculo | Fonte | Fase |
|---|---|---|---|
| MRR de contratos | Σ valor mensal de contratos ativos | `contracts` | F4 |
| Receita do mês | Σ recebido no mês | `accounts_receivable` | F8 |
| OS do dia | count OS agendadas/hoje | `service_orders` | F6 |
| Conversão do funil | ganhos / total no período | `leads`/`deals` | F3 |
| Inadimplência % | vencido / total a receber | `accounts_receivable` | F8 |
| Ticket médio | receita / nº de OS (ou contratos) | F6/F8 | F6 |
| Estoque crítico | count produtos < estoque_mínimo | `products`+`stock` | F5 |
| Lotes a vencer | lotes com validade ≤ 90d | `stock_batches` | F5 |
| Clientes ativos | count clients ativos | **`clients`** | **F2 (já existe)** |
| Cadastros | counts por entidade | tabelas F2 | **F2 (já existe)** |
| ASO/anuidade a vencer | datas ≤ 30/60d | `employees` | F2/F13 |
| Doc. de veículo vencendo | venc_* ≤ 30d | **`vehicles`** | **F2 (já existe)** |

> Hoje (pós-F2) só os marcados "F2" têm dado real — por isso decidimos
> **planejar** e construir o painel cheio na F14.

## 4. Charts por intenção (mega_desh M4)

| Intenção | Gráfico |
|---|---|
| Evolução no tempo (receita, MRR) | Linha / Área |
| Comparar categorias (serviço, vendedor, técnico) | Barra |
| Parte do todo (OS por status, motivo de perda) | Donut (≤5) |
| Métrica única + tendência | KPI grande + **sparkline** |
| Densidade temporal (visitas/mês) | Heatmap |

Regras: eixo Y no zero, paleta color-blind-friendly + legenda, **tabular-nums**,
formatação **pt-BR** (R$/milhar/%), animação só na entrada (≤400ms,
respeitando `prefers-reduced-motion`), estado "sem dados no período".

## 5. Layout e design (M1/M3)

- Shell já existe (sidebar por seção + topbar com troca de empresa).
- Conteúdo: **grid de KPI cards** no topo → **charts** → **tabelas/alertas**.
- KPI card: label discreta, número grande tabular-nums, sparkline, variação %
  (verde/vermelho com ícone — pista redundante, não só cor).
- Tokens: esmeralda/teal do tenant (`tenants.cor_primaria`), densidade média,
  raio consistente, sombra em camadas. Dark mode com `color-scheme`.

## 6. Camada de dados (M1 + RLS)

- **Server Components** buscam os agregados (queries em `lib/data/dashboard.ts`,
  server-only). Nada de KPI calculado no cliente.
- Cada query é **escopada por tenant** (RLS) e pelo papel (já garantido pelo
  `requireRole`); agregações via SQL (count/sum/group by) ou **RPC/views**
  para os KPIs pesados (ex.: `dashboard_owner_kpis(tenant)`).
- **Cache**: `revalidateTag` por entidade; KPIs com `revalidate` curto
  (ex.: 60s) — dados de admin não precisam ser tempo-real (exceto OS do dia).
- Streaming com **Suspense** por widget (skeleton que espelha o card).

## 7. Estados e 100 regras (M2) — checklist por widget

- [ ] Estados **loading (skeleton) / vazio (com CTA) / erro / denso** em todo card e tabela.
- [ ] **tabular-nums** + alinhamento à direita em números; datas/moeda pt-BR.
- [ ] Tabelas > 50 linhas **virtualizadas**; filtros/paginação **deep-linkados** na URL.
- [ ] Charts acessíveis (paleta + legenda, não só cor); `aria-label` em ícones.
- [ ] Sem `transition: all`; animar só `transform/opacity`; honrar reduced-motion.
- [ ] Mutações < 500ms; sem CLS (dimensões fixas nos charts).

## 8. Dependência de fases (o que cada fase destrava no painel)

```
F2 (feito) → cards de cadastros + alertas de veículo/RT
F3 → funil, conversão, leads, orçamentos pendentes
F4 → MRR, contratos a renovar
F5 → estoque crítico, lotes a vencer, consumo teórico×real
F6 → OS do dia/atrasadas, ticket médio, painel do técnico
F7 → pontos MIP críticos
F8 → receita, inadimplência, fluxo realizado×projetado, DRE, comissões
```

## 9. Rollout

1. **Agora (F2):** se quiser valor imediato, dá pra subir um dashboard enxuto
   (cards de cadastros + alertas de veículo/RT) — fica como base do widget grid.
2. **Incremental:** cada fase F3→F8 adiciona seus widgets ao catálogo.
3. **F14:** monta os dashboards por papel completos, charts, exportação
   (CSV/PDF) e refino de UX + validação no navegador (M7) + revisão 3 lentes (M6).
