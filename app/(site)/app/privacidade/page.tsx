import type { Metadata } from "next";
import { site } from "@/lib/site/site";

export const metadata: Metadata = {
  title: "Política de Privacidade — App Dedetech",
  description:
    "Política de Privacidade do aplicativo móvel Dedetech: quais dados tratamos, como usamos e seus direitos sob a LGPD.",
  alternates: { canonical: `${site.url}/app/privacidade` },
  robots: { index: true, follow: true },
};

const updated = "5 de junho de 2026";

export default function PrivacidadeApp() {
  return (
    <section className="relative border-b border-line">
      <div className="dot-grid absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald">Aplicativo Dedetech</p>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Política de Privacidade</h1>
        <p className="mt-4 text-fog">Última atualização: {updated}</p>

        <div className="prose-dedetech mt-10 space-y-8 text-fog">
          <Bloco titulo="1. Quem somos">
            O aplicativo <strong className="text-cream">Dedetech</strong> é o app de campo do sistema de gestão
            Dedetech, destinado a empresas de controle de pragas (dedetizadoras) e seus colaboradores. O app é
            operado por Dedetech ({site.email}). Esta política descreve como tratamos dados no aplicativo móvel,
            em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018).
          </Bloco>

          <Bloco titulo="2. Dados que tratamos">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-cream">Dados de conta:</strong> e-mail e senha (autenticação) e o nome
                informado no cadastro, para identificar você no sistema.
              </li>
              <li>
                <strong className="text-cream">Dados operacionais da empresa:</strong> ao entrar, o app exibe
                informações da dedetizadora à qual você está vinculado — clientes, ordens de serviço, agenda e
                afins. Esses dados pertencem à empresa contratante e são acessados conforme seu nível de permissão.
              </li>
              <li>
                <strong className="text-cream">Dados de uso/dispositivo:</strong> informações técnicas mínimas
                para funcionamento e estabilidade (ex.: versão do app e do sistema operacional).
              </li>
            </ul>
            <p className="mt-3">
              O app <strong className="text-cream">não</strong> coleta sua localização em segundo plano, contatos,
              fotos da galeria ou dados de terceiros sem ação explícita sua.
            </p>
          </Bloco>

          <Bloco titulo="3. Como usamos os dados">
            <ul className="list-disc space-y-2 pl-5">
              <li>Autenticar seu acesso e manter sua sessão.</li>
              <li>Exibir e gerenciar ordens de serviço, clientes e agenda da sua empresa.</li>
              <li>Registrar a execução de serviços (ex.: concluir uma ordem de serviço).</li>
              <li>Garantir segurança, prevenir fraudes e melhorar a estabilidade do app.</li>
            </ul>
            <p className="mt-3">
              Não vendemos seus dados e não usamos seus dados pessoais para publicidade.
            </p>
          </Bloco>

          <Bloco titulo="4. Compartilhamento e processadores">
            Utilizamos provedores de tecnologia que atuam como operadores de dados, sob contrato e padrões de
            segurança, exclusivamente para viabilizar o serviço — em especial{" "}
            <strong className="text-cream">Supabase</strong> (autenticação e banco de dados) e a infraestrutura de
            distribuição do app (Apple App Store / Google Play). O acesso aos dados é isolado por empresa
            (multi-tenant) e protegido por regras de segurança em nível de linha (RLS).
          </Bloco>

          <Bloco titulo="5. Armazenamento e segurança">
            Os dados são armazenados em servidores seguros e trafegam por conexões criptografadas (HTTPS/TLS).
            A sessão fica guardada de forma segura no seu dispositivo apenas para manter você conectado. Aplicamos
            controles de acesso por papel (técnico, gestor, etc.).
          </Bloco>

          <Bloco titulo="6. Retenção e exclusão">
            Mantemos os dados enquanto sua conta estiver ativa ou conforme necessário para cumprir obrigações
            legais da empresa contratante. Você pode solicitar a exclusão da sua conta e dos seus dados pessoais a
            qualquer momento pelo e-mail <a className="text-emerald underline" href={`mailto:${site.email}`}>{site.email}</a>.
          </Bloco>

          <Bloco titulo="7. Seus direitos (LGPD)">
            Você pode solicitar acesso, correção, portabilidade, anonimização ou exclusão dos seus dados pessoais,
            além de revogar consentimentos. Basta entrar em contato pelo e-mail abaixo; responderemos dentro dos
            prazos legais.
          </Bloco>

          <Bloco titulo="8. Crianças">
            O Dedetech é uma ferramenta profissional e não se destina a menores de 18 anos.
          </Bloco>

          <Bloco titulo="9. Alterações">
            Podemos atualizar esta política para refletir melhorias ou mudanças legais. A data de “última
            atualização” no topo indica a versão vigente.
          </Bloco>

          <Bloco titulo="10. Contato">
            Dúvidas sobre privacidade ou exercício de direitos:{" "}
            <a className="text-emerald underline" href={`mailto:${site.email}`}>{site.email}</a> · {site.phone}.
          </Bloco>
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <a href="/" className="text-sm font-semibold text-emerald hover:underline">
            ← Voltar para o site
          </a>
        </div>
      </div>
    </section>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-cream">{titulo}</h2>
      <div className="mt-2 leading-relaxed">{children}</div>
    </div>
  );
}
