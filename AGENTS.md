# Dedetech — CRM/ERP para dedetizadoras (SaaS multi-tenant)

Plataforma de gestão para empresas de controle de pragas. **SaaS multi-tenant**
(banco único + RLS por `tenant_id`). 1º cliente = A7 Dedetizadora (Brasília/DF).

## Stack

- **Next.js 16** (App Router, Server Components/Actions, Turbopack) + TypeScript
- **Supabase** (Postgres + Auth + Storage + Realtime + **RLS**)
- **Tailwind v4 + shadcn/ui** (base `radix`, pacote unificado `radix-ui`)
- **Zod + React Hook Form** · **Trigger.dev** (jobs, fases futuras)
- **Sentry + PostHog** (observabilidade, inertes sem env) · **Resend** (e-mail)
- Deploy: **Vercel** · banco: **Supabase**

## Convenções

- **Toda tabela de negócio nasce com `tenant_id` + RLS + trigger de auditoria.** Sem exceção.
- RLS é a rede de segurança real; `requireRole` (server) e UI condicional são camadas extras.
- Arquivo de proxy/edge é **`proxy.ts`** (convenção Next 16, não `middleware.ts`).
- Clients Supabase: `lib/supabase/{server,client,middleware,admin}.ts`.
  `admin.ts` usa service_role e **bypassa RLS** — só no servidor.
- Tipos do banco: `lib/database.types.ts` (regenerar com `pnpm gen:types`).
- pnpm 11: builds nativos (sharp/unrs-resolver) em `pnpm-workspace.yaml`
  (`onlyBuiltDependencies` + `verifyDepsBeforeRun: false`).

## Route groups

- `app/(marketing)` — site público / vitrine (Fase 15)
- `app/(auth)` — login, signup, recuperar, convite/[token]
- `app/(app)` — SaaS interno (protegido pelo proxy + layout)
- `app/(portal)` — Portal do Cliente (Fase 11)

## Deploy

- **Conta Vercel: `dedeteck-s-projects`** (time da Dedetech).
  `vercel --prod --yes --scope dedeteck-s-projects`
  ⚠️ Esse time já teve oscilação de login — usar **token** quando disponível.

## Scripts

- `pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm test`
- `pnpm gen:types` — regenera tipos do banco (precisa `SUPABASE_PROJECT_ID`)

## Roadmap

16 fases (F0→F15). Base: `~/Downloads/crm-dedetizadora-escopo-v2.json` +
`crm-dedetizadora-plano-mestre.md`. **F0 (fundação) concluída.** Próxima: F1
(migration multi-tenant + auth/RBAC + auditoria + LGPD).
