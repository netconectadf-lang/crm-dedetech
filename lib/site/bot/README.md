# Chatbot de WhatsApp + Agendamento

Atendente virtual da Dedetech no WhatsApp: tira dúvidas e agenda visitas,
criando a Ordem de Serviço direto no Supabase. Cérebro: Claude **Haiku 4.5**.

## Arquitetura

```
Cliente → WhatsApp Cloud API → /api/whatsapp (route.ts)
         → brain.ts (loop de tool use, Haiku 4.5)
           ├─ buscar_cliente        (clients)
           ├─ horarios_disponiveis  (service_orders)
           └─ agendar_servico       (clients + service_orders)
         → resposta enviada no WhatsApp
         → histórico salvo em conversas_whatsapp
```

Arquivos:
- `lib/anthropic.ts` — cliente Anthropic + modelo
- `lib/whatsapp.ts` — enviar texto / parsear webhook
- `lib/supabase-admin.ts` — cliente Supabase service-role (server, lazy via `supabaseAdmin()`)
- `lib/bot/conversa.ts` — memória da conversa (Supabase)
- `lib/bot/tools.ts` — as 3 ferramentas
- `lib/bot/brain.ts` — o cérebro (tool use loop)
- `app/api/whatsapp/route.ts` — webhook (GET verificação + POST mensagens)

## Variáveis de ambiente

No `.env.local` (local) e no painel da Vercel (Production):

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # Supabase → Settings → API → service_role
WHATSAPP_TOKEN=EAAG...                     # Meta → WhatsApp → API Setup (token)
WHATSAPP_PHONE_NUMBER_ID=123456789         # Meta → WhatsApp → Phone number ID
WHATSAPP_VERIFY_TOKEN=algumtexto-secreto   # você inventa; usado no handshake
WHATSAPP_TENANT_ID=<uuid da dedetizadora>  # tenant que este número atende (MVP: 1)
```

(`NEXT_PUBLIC_SUPABASE_URL` já existe no projeto.)

## Passos para colocar no ar

1. **Banco**: rodar `supabase/conversas_whatsapp.sql` no SQL Editor do Supabase.
2. **Envs**: preencher as variáveis acima (local + Vercel).
3. **Deploy**: `./deploy.sh` → a rota fica em `https://dedetech.com.br/api/whatsapp`.
4. **Meta**: no painel do app (WhatsApp → Configuration), cadastrar o webhook:
   - Callback URL: `https://dedetech.com.br/api/whatsapp`
   - Verify token: o mesmo de `WHATSAPP_VERIFY_TOKEN`
   - Assinar o campo **messages**.
5. Mandar "oi" do seu celular para o número de teste → o bot responde.

## Notas / a verificar no schema

- A tool `agendar_servico` grava o detalhe da praga em `service_orders.observacoes`.
  Se sua coluna tiver outro nome (ex: `notes`, `obs`), ajuste em `lib/bot/tools.ts`.
- Os horários oferecidos são fixos (`SLOTS` em `tools.ts`) — ajuste conforme a operação.
- MVP atende **um tenant** por número. Multi-número/multi-tenant é evolução futura.

## Segurança

- A rota usa a **service key** (server-side, nunca no bundle do cliente).
- Recomendado (Fase 4): validar a assinatura `X-Hub-Signature-256` do webhook com
  o App Secret da Meta, e rate limit por telefone.
