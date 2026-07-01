import { describe, expect, it } from "vitest";

import {
  clientSchema,
  serviceSchema,
  supplierSchema,
  productSchema,
  employeeSchema,
  vehicleSchema,
  accountSchema,
} from "@/lib/validators/cadastros";
import { bankAccountSchema, costCenterSchema } from "@/lib/validators/financeiro";
import { deviceSchema } from "@/lib/validators/mip";

/**
 * Regressão do bug do switch "ativo" (z.coerce.boolean fazia Boolean("false")
 * === true → impossível INATIVAR qualquer cadastro). Agora usam switchBool.
 * O hidden input do ResourceForm envia a STRING "true"/"false".
 */

// Campos mínimos válidos por schema, para isolar o parse do campo booleano.
const base = {
  client: { tipo: "PF", razao_social: "Fulano" },
  service: { nome: "Dedetização", unidade_cobranca: "visita" },
  supplier: { razao_social: "Fornecedor X" },
  product: { nome_comercial: "Veneno X", registro_anvisa: "123", tipo: "concentrado" },
  employee: { nome: "Beltrano", tipo_contrato: "clt" },
  vehicle: { placa: "ABC1D23", tipo: "carro" },
  account: { nome: "Receita de Serviços", tipo: "receita" },
  bankAccount: { nome: "Conta Corrente", tipo: "corrente" },
  costCenter: { nome: "Operação" },
  device: { unit_id: "11111111-1111-4111-8111-111111111111", tipo: "porta_isca", numero: "P-01" },
} as const;

const casos = [
  ["clientSchema", clientSchema, base.client],
  ["serviceSchema", serviceSchema, base.service],
  ["supplierSchema", supplierSchema, base.supplier],
  ["productSchema", productSchema, base.product],
  ["employeeSchema", employeeSchema, base.employee],
  ["vehicleSchema", vehicleSchema, base.vehicle],
  ["accountSchema", accountSchema, base.account],
  ["bankAccountSchema", bankAccountSchema, base.bankAccount],
  ["costCenterSchema", costCenterSchema, base.costCenter],
  ["deviceSchema", deviceSchema, base.device],
] as const;

describe('switch "ativo" — string "false" DEVE virar false', () => {
  for (const [nome, schema, campos] of casos) {
    it(`${nome}: ativo:"false" → false`, () => {
      const r = schema.parse({ ...campos, ativo: "false" });
      expect(r.ativo).toBe(false);
    });

    it(`${nome}: ativo:"true" → true`, () => {
      const r = schema.parse({ ...campos, ativo: "true" });
      expect(r.ativo).toBe(true);
    });

    it(`${nome}: ativo:"on" (checkbox marcado) → true`, () => {
      const r = schema.parse({ ...campos, ativo: "on" });
      expect(r.ativo).toBe(true);
    });
  }

  it('employeeSchema: responsavel_tecnico "false" → false', () => {
    const r = employeeSchema.parse({ ...base.employee, responsavel_tecnico: "false" });
    expect(r.responsavel_tecnico).toBe(false);
  });
});
