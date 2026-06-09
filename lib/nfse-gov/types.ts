import "server-only";

/**
 * Tipos da integração DIRETA com o Sistema Nacional NFS-e (gov.br).
 * Padrão de leiaute v1.01 (DPS/NFS-e). Sem provedor intermediário.
 */

/** 1 = Produção (validade jurídica); 2 = Homologação / Produção Restrita (testes). */
export type Ambiente = 1 | 2;

/** Situação do prestador perante o Simples Nacional. */
export type OpSimplesNacional = 1 | 2 | 3; // 1=Não optante; 2=MEI; 3=ME/EPP

/** Regime especial de tributação (0 = nenhum). */
export type RegimeEspecial = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 9;

/** Tributação do ISSQN. */
export type TribISSQN = 1 | 2 | 3 | 4; // 1=tributável; 2=imunidade; 3=exportação; 4=não incidência

/** Tipo de retenção do ISSQN. */
export type RetISSQN = 1 | 2 | 3; // 1=não retido; 2=retido tomador; 3=retido intermediário

/** Dados fiscais do prestador (vêm do tenant / configurações da empresa). */
export type Prestador = {
  cnpj: string; // 14 dígitos
  inscricaoMunicipal?: string;
  opSimplesNacional: OpSimplesNacional;
  regimeEspecial: RegimeEspecial;
};

/** Endereço nacional do tomador. */
export type EnderecoNacional = {
  codMunicipio: string; // IBGE (7 dígitos)
  cep: string; // 8 dígitos
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
};

/** Tomador do serviço (cliente). */
export type Tomador = {
  documento: string; // CPF (11) ou CNPJ (14)
  nome: string;
  email?: string;
  endereco?: EnderecoNacional;
};

/** Dados do serviço prestado. */
export type Servico = {
  /** Código de tributação nacional do ISSQN — 6 dígitos (item+subitem+desdobro da LC 116). */
  codTribNacional: string;
  /** Código de tributação municipal do ISSQN (obrigatório no leiaute do DF/ISSnet). */
  codTribMunicipal?: string;
  /** Descrição completa do serviço (até 2000 caracteres). */
  descricao: string;
  /** Município onde o serviço foi prestado (IBGE 7 dígitos). */
  codMunicipioPrestacao: string;
  /** Código NBS (opcional). */
  nbs?: string;
};

/**
 * Grupo IBS/CBS da Reforma Tributária (obrigatório no leiaute v1.01 do DF).
 * Os códigos saem da tabela de correlação oficial (cTribNac → cClassTrib/CST/cIndOp).
 */
export type IbsCbs = {
  /** Finalidade da NFS-e: "0" = regular. */
  finNFSe: string;
  /** Código indicador da operação (6 díg.). Ex.: "020201" = serviço sobre bem imóvel. */
  cIndOp: string;
  /** Indicador do destinatário: "0" = destinatário é o próprio tomador. */
  indDest: string;
  /** Código de Situação Tributária IBS/CBS (3 díg.). Ex.: "000" = tributação integral. */
  cst: string;
  /** Código de Classificação Tributária (6 díg.). Ex.: "000001" = tributação integral. */
  cClassTrib: string;
};

/** Valores e tributação. */
export type Valores = {
  valorServico: number;
  /** Alíquota do ISS em % (ex.: 5 = 5%). */
  aliquotaIss: number;
  tribISSQN?: TribISSQN; // default 1
  retISSQN?: RetISSQN; // default 1
};

/** Tudo que é necessário para montar e assinar uma DPS. */
export type DadosEmissao = {
  ambiente: Ambiente;
  serie: string; // até 5 dígitos
  numero: string | number; // até 15 dígitos
  dataCompetencia: string; // AAAA-MM-DD
  municipioEmissor: string; // IBGE (7 dígitos) — município do prestador
  prestador: Prestador;
  tomador: Tomador;
  servico: Servico;
  valores: Valores;
  /** Versão do aplicativo emissor (vai em verAplic). */
  versaoAplicativo?: string;
  /** Grupo IBS/CBS da Reforma Tributária — exigido pelo leiaute do DF/ISSnet. */
  ibsCbs?: IbsCbs;
};

/** Certificado digital A1 (PKCS#12). */
export type Certificado = {
  /** Conteúdo do arquivo .pfx/.p12. */
  pfx: Buffer;
  senha: string;
};

/** Status interno normalizado de uma NFS-e. */
export type StatusNfse = "processando" | "autorizada" | "erro" | "cancelada";

/** Resultado de uma operação contra o Ambiente Nacional. */
export type ResultadoNfse = {
  ok: boolean;
  status?: StatusNfse;
  /** Chave de acesso da NFS-e (50 dígitos) quando autorizada. */
  chaveAcesso?: string;
  /** Id da DPS enviada (para rastreio/idempotência). */
  idDps?: string;
  numero?: string;
  /** XML da NFS-e autorizada (decodificado). */
  xmlNfse?: string;
  mensagem?: string;
  error?: string;
};
