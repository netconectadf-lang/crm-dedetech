# Dedetech — Cobrança/Comunicação (F9): o que ficou e o que falta ligar

## Entregue (inerte sem credencial)
- **lib/notify** (Evolution WhatsApp + Resend e-mail) + **lib/notify/dispatch** (envia E grava em `messages`).
- **lib/asaas** (cobrança boleto/PIX) — `criarCobrancaAsaas` faz o POST real só com `ASAAS_API_KEY` + customer; sem isso, registra cobrança **manual**.
- **charges** + ação **gerarCobranca** (PIX/Boleto na Conta a Receber) + notifica o cliente.
- **Webhook** `/api/webhooks/asaas` → marca cobrança paga e quita a CR (valida `ASAAS_WEBHOOK_TOKEN`).
- **NPS 100% funcional**: enviar (OS) → `/nps/[token]` público (0-10 + comentário) → resultados em `/comunicacao` (NPS, média, comentários, log de mensagens).

## Ligar quando tiver credenciais (env)
```
EVOLUTION_URL= EVOLUTION_KEY= EVOLUTION_INSTANCE=    # WhatsApp
RESEND_API_KEY= RESEND_FROM=                          # e-mail
ASAAS_API_KEY= ASAAS_ENV=production ASAAS_WEBHOOK_TOKEN=
```
> Multi-tenant definitivo (credenciais por tenant cifradas) em docs/whatsapp-arquitetura.md.

## Camada seguinte (cron Trigger.dev — deferida)
1. **Régua de cobrança**: cron diário que, por CR em aberto, envia lembrete
   (antes do vencimento) e cobrança (após atraso) via `dispatch`.
2. **Assinatura recorrente Asaas**: para contratos, criar `subscription` no Asaas
   e gerar as cobranças automaticamente (em vez de uma a uma).
3. **Sync de customer Asaas**: criar/mapear o cliente no Asaas (necessário para o
   `criarCobrancaAsaas` rodar de verdade) — guardar `asaas_customer_id` no cliente.
4. **Conciliação OFX** (extrato bancário) e **comissões** (vendedor/técnico) — F8.
