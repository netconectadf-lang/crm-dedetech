# NFS-e Nacional (gov.br) — integração direta

Emissão de NFS-e direto pelo **Sistema Nacional NFS-e** (gov.br), sem provedor pago.

## Estado
- ✅ Emissão (DPS v1.01 + assinatura XMLDSIG + mTLS), DANFSe e cancelamento (e101101)
- ✅ Validado contra o ambiente real (produção restrita): certificado aceito, DPS processada
- ⏸️ **Aguardando Brasília/DF aderir ao Ambiente Nacional** (até 30/06/2026; obrigatório 01/09/2026).
  O governo retorna `E0037` (município não conveniado) até lá.

## Componentes (`lib/nfse-gov/`)
- `dps.ts` — builder do XML da DPS (Id `DPS`+42 díg)
- `sign.ts` — assinatura XMLDSIG envelopada (`infDPS` / `infPedReg`)
- `cert.ts` / `crypto.ts` — leitura do A1 (.pfx) e cripto AES-256-GCM
- `transport.ts` — mTLS (pfx direto) + GZip+Base64; endpoint `/SefinNacional` (sem `/API/`)
- `evento.ts` — pedido de cancelamento (e101101)
- `store.ts` — certificado por empresa (tabela `nfse_certificado`, service role)
- `index.ts` — `emitirNfse` / `consultarNfse` / `baixarDanfse` / `cancelarNfse`

## Configuração
- Upload do certificado A1 + dados fiscais: **Integrações → NFS-e Nacional** (`/integracoes/nfse`)
- Env: `NFSE_CERT_KEY` (32 bytes hex) criptografa o `.pfx` no banco
- Código de tributação nacional da dedetização: família `0713` (use `071300`; confirmar com contador)

## Testes
`pnpm test:nfse-gov` — valida DPS e evento de cancelamento contra os XSD oficiais (em `schemas/`).
