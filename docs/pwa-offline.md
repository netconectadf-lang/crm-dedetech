# Dedetech — PWA offline da ficha de campo (camada final da F6)

> A F6 já entregou: app **instalável** (manifest + service worker em `public/sw.js`
> + ícone), modelo de dados da OS/ficha completo, e o **finalize idempotente com
> baixa de estoque validada no servidor** (FEFO) — que é o requisito para sync
> seguro. Falta a **fila offline real** e o **calendário drag-drop**, que só se
> validam num dispositivo. Documentados aqui para não se perderem.

## 1. Fila offline (IndexedDB + Background Sync)

Objetivo: o técnico preenche a ficha **sem sinal** e sincroniza ao voltar a rede.

- **Dexie (IndexedDB)**: guardar rascunho da ficha por `os_id` (campos, produtos,
  fotos como Blob, assinaturas como dataURL, geo, timestamps).
- **Service worker + Background Sync**: ao salvar offline, enfileirar; quando online,
  POST para uma rota/Server Action de sync.
- **Resolução de conflito**: last-write-wins por OS + flag `pendente_sync`.
- **Validação no servidor ao sincronizar**: o `finalizarOS` já valida estoque/FEFO
  tudo-ou-nada — basta o sync chamá-lo. Reaproveitar como está.
- **Fotos e assinaturas**: subir para Supabase Storage (bucket por tenant) na sync;
  guardar URL em `service_orders.assinatura_*_url` e numa tabela `os_photos`.

## 2. Captura no campo (precisa de device)

- **Câmera**: `<input type="file" accept="image/*" capture="environment">` (simples)
  ou MediaDevices.
- **Assinatura**: canvas (lib `signature_pad`) → dataURL/Blob.
- **Geolocalização**: `navigator.geolocation` no check-in (grava lat/lng + chegada_em).

## 3. Calendário de agendamento (drag-drop)

- Visão de calendário (semana/dia) das OS por técnico, com arrastar para reagendar.
- Sugestão: FullCalendar ou um grid próprio + dnd-kit (já usado no funil).
- Disponibilidade do técnico + cruzar com OS do dia.

## 4. Cron de geração de OS por contrato (agora destravado)

Com `service_orders` existindo, o cron documentado em
`docs/contratos-os-scheduler.md` já pode ser implementado: instalar
`@trigger.dev/sdk`, criar `trigger/contract-os.ts` e gerar as OS programadas
(idempotente por contrato+data) + atualizar `contracts.proxima_visita_em`.
Por ora há o botão manual **"Gerar visita (OS)"** no contrato.

## 5. Ícones PNG de produção

O manifest usa `icon.svg`. Para instalabilidade ampla (Android/Chrome), gerar
`icon-192.png` e `icon-512.png` e adicioná-los ao `app/manifest.ts`.
