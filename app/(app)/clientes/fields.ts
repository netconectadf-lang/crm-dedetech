import type { Field } from "@/components/app/resource-form";

export const clienteFields: Field[] = [
  {
    name: "tipo",
    label: "Tipo",
    type: "select",
    options: [
      { value: "PJ", label: "Pessoa Jurídica" },
      { value: "PF", label: "Pessoa Física" },
    ],
  },
  { name: "documento", label: "CPF / CNPJ", type: "cnpj", placeholder: "Só números" },
  { name: "razao_social", label: "Nome / Razão social", required: true, full: true },
  { name: "nome_fantasia", label: "Nome fantasia" },
  { name: "telefone", label: "Telefone" },
  { name: "email", label: "E-mail", type: "email" },
  {
    name: "segmento",
    label: "Segmento",
    type: "select",
    options: [
      { value: "residencial", label: "Residencial" },
      { value: "comercial", label: "Comercial" },
      { value: "industria", label: "Indústria alimentícia" },
      { value: "saude", label: "Saúde" },
      { value: "condominio", label: "Condomínio" },
    ],
  },
  { name: "origem", label: "Origem (como chegou)" },
  { name: "cep", label: "CEP", type: "cep", placeholder: "Só números" },
  { name: "logradouro", label: "Logradouro" },
  { name: "numero", label: "Número" },
  { name: "complemento", label: "Complemento" },
  { name: "bairro", label: "Bairro" },
  { name: "cidade", label: "Cidade" },
  { name: "uf", label: "UF" },
  { name: "contato_responsavel", label: "Contato responsável" },
  { name: "inscricao_estadual", label: "Inscrição estadual" },
  { name: "inscricao_municipal", label: "Inscrição municipal" },
  { name: "observacoes", label: "Observações", type: "textarea" },
  { name: "ativo", label: "Ativo", type: "switch" },
];
