/**
 * Consultas externas gratuitas para auto-preenchimento de cadastros.
 * ViaCEP (endereço por CEP) e BrasilAPI (dados por CNPJ).
 * Tolerantes a falha: retornam null em vez de lançar.
 */

export type CepResult = {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  codigo_ibge: string;
};

export async function buscarCep(cepRaw: string): Promise<CepResult | null> {
  const cep = cepRaw.replace(/\D/g, "");
  if (cep.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!res.ok) return null;
    const d = await res.json();
    if (d.erro) return null;
    return {
      logradouro: d.logradouro ?? "",
      bairro: d.bairro ?? "",
      cidade: d.localidade ?? "",
      uf: d.uf ?? "",
      codigo_ibge: d.ibge ?? "",
    };
  } catch {
    return null;
  }
}

export type CnpjResult = {
  razao_social: string;
  nome_fantasia: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export async function buscarCnpj(cnpjRaw: string): Promise<CnpjResult | null> {
  const cnpj = cnpjRaw.replace(/\D/g, "");
  if (cnpj.length !== 14) return null;
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return null;
    const d = await res.json();
    return {
      razao_social: d.razao_social ?? "",
      nome_fantasia: d.nome_fantasia ?? "",
      email: d.email ?? "",
      telefone: d.ddd_telefone_1 ?? "",
      cep: d.cep ?? "",
      logradouro: d.logradouro ?? "",
      numero: d.numero ?? "",
      bairro: d.bairro ?? "",
      cidade: d.municipio ?? "",
      uf: d.uf ?? "",
    };
  } catch {
    return null;
  }
}
