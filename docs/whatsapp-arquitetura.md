# Dedetech — Arquitetura da camada de WhatsApp (multi-tenant)

> Planejamento (não implementado). Implementação prevista para a **Fase 9**
> (Cobrança + Comunicação), com ganchos já na **Fase 6** (envio de
> certificado/laudo ao finalizar a OS). Base: skill mega_zap.

## 1. Princípio central: multi-tenant

Cada dedetizadora (tenant) usa **o próprio número** de WhatsApp. Logo:

- Credenciais são **por tenant**, nunca globais.
- O envio sempre resolve `tenant_id → conta WhatsApp ativa → provider`.
- A RLS isola `messages`/`whatsapp_accounts` por tenant; **as credenciais
  ficam numa coluna/tabela que o cliente (browser) NÃO lê** — só o
  `service_role` em Server Actions e jobs.

## 2. Estratégia de provider (decisão recomendada)

Adapter **provider-agnostic** + começar simples, escalar para o oficial.

| Provider | Quando | Trade-off |
|---|---|---|
| **Evolution API** (self-hosted) | **Começo / cliente-âncora A7** | Usa o número atual via QR, sem aprovação de template, barato. Risco de ban e menos garantia de entrega — aceitável p/ 1 tenant. (Time já tem experiência no agencia-ia.) |
| **Meta Cloud API** (oficial) | **Escala / vários tenants** | Entrega garantida, sem ban, mas exige WABA + template aprovado p/ msg fora da janela 24h + onboarding (Embedded Signup) por tenant. |
| Z-API / BSP | Alternativa gerenciada | ~R$100–200/mês por número, sem self-host. |

**Recomendação:** construir o adapter abstrato (`WhatsAppProvider`), implementar
**Evolution primeiro** (A7 no ar rápido) e **Meta Cloud depois** para revenda —
sem reescrever quem chama o envio.

## 3. Modelo de dados (novas tabelas — todas tenant_id + RLS + auditoria)

- **`whatsapp_accounts`** — `tenant_id`, `provider` enum(`evolution`|`meta_cloud`|`zapi`),
  `phone_e164`, `status` (`disconnected`|`connecting`|`connected`),
  `instance_name` (Evolution) / `phone_number_id`+`waba_id` (Meta),
  `webhook_secret`. **Credenciais (token/apikey) em coluna separada
  criptografada** (Supabase Vault ou cripto na app com chave em env) — policy
  nega `select` ao papel `authenticated`; só `service_role` lê.
- **`message_templates`** — `tenant_id`, `name`, `category`
  (utility/marketing), `language`, `body`, `status` (Meta). Para Evolution é
  só texto livre.
- **`messages`** — `tenant_id`, `account_id`, `direction` (out/in),
  `to_e164`, `type` (text/document/template/interactive), `body`, `media_url`,
  `template_name`, `related_kind`+`related_id` (os/contrato/cobrança),
  `provider_message_id`, `status` (queued/sent/delivered/read/failed),
  `error`, timestamps. Rastreabilidade + régua + métricas.
- **`whatsapp_optout`** — `tenant_id`, `phone_e164`, `opted_out_at` (LGPD).

## 4. Camada de envio (provider-agnostic)

```
lib/whatsapp/
  types.ts                 # interface WhatsAppProvider + DTOs
  index.ts                 # getProviderForTenant(tenantId) + sendMessage()
  providers/evolution.ts   # implementa a interface (Evolution API)
  providers/meta.ts        # implementa a interface (Meta Cloud API)
```

`sendMessage()` (server-only): grava em `messages` (status `queued`) → chama o
provider resolvido pelo tenant → atualiza status/`provider_message_id`. Toda
chamada passa por aqui (nada chama provider direto).

## 5. Assíncrono + confiabilidade (Trigger.dev)

- **Envio** vira task durável: retry com backoff, rate-limit (Meta = 80 msg/s).
- **Crons:** régua de cobrança (lembrete antes/depois do vencimento), lembrete
  de visita 24h antes, revisão de garantia, NPS pós-serviço — leem
  contratos/OS/cobranças e enfileiram envios.

## 6. Webhooks (entrada + status)

`app/api/webhooks/whatsapp/[provider]/route.ts`:
- **Verifica assinatura** (Meta `X-Hub-Signature-256` / token do Evolution).
- Identifica o **tenant** pelo `phone_number_id` (Meta) / `instance` (Evolution).
- Registra inbound + atualiza `messages.status` (sent→delivered→read/failed).
- **Idempotente** por `provider_message_id`.
- Resposta de botão (confirmar agendamento) → atualiza status da OS.

## 7. Janela de 24h + templates

- Dentro de 24h da última msg do cliente → texto livre.
- **Proativo fora da janela** (lembrete, link de pagamento sem conversa prévia)
  → **template aprovado** (Meta). Evolution não exige, mas tem risco.
- `messages.type` distingue `template` vs `text` de sessão.

## 8. Onde pluga em cada fase

| Gancho | Fase | Mensagem |
|---|---|---|
| OS finalizada | F6 | Documento: Certificado + Laudo (PDF do Storage) |
| Orçamento aprovado | F3 | Texto/link de confirmação |
| Cobrança gerada (Asaas) | F9 | Link boleto/PIX + régua |
| 24h antes da visita | F6/F9 | Lembrete + botões (confirmar/remarcar) |
| Garantia a vencer | F9 | Lembrete de revisão |
| Pós-serviço | F9 | NPS (nota + comentário → grava no cliente) |

## 9. LGPD / boas práticas

- Checar `whatsapp_optout` **antes** de todo envio proativo; rodapé com opt-out.
- E.164 sempre (`55DDDNUMERO`).
- Credenciais só server-side, criptografadas; nunca em `NEXT_PUBLIC_`.
- Logs de webhook monitorados; segredos fora do código.

## 10. Rollout sugerido

1. **F9 (núcleo):** tabelas + adapter + **Evolution p/ A7** + task de envio +
   webhook + régua/NPS.
2. **Escala:** provider **Meta Cloud** + onboarding por tenant (Embedded Signup)
   + templates aprovados.
3. Opcional: **chatbot** por tenant (Claude) para triagem de atendimento.

## 11. Custos (referência)

- Evolution: custo do VPS (compartilhado com o Traccar do GPS).
- Meta Cloud: por conversa (utility/marketing), tiers; repassável ao tenant.
- Z-API/BSP: ~R$100–200/mês por número.
