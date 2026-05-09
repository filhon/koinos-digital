import Link from "next/link";
import { CURRENT_TERMS_VERSION } from "@/lib/constants/legal";
import { LegalLayout } from "@/app/termos/legal-layout";

const SECTIONS = [
  { id: "controlador", title: "1. Controlador de Dados" },
  { id: "dados-coletados", title: "2. Dados Coletados" },
  { id: "finalidade", title: "3. Finalidade do Tratamento" },
  { id: "base-legal", title: "4. Base Legal" },
  { id: "compartilhamento", title: "5. Compartilhamento" },
  { id: "seguranca", title: "6. Segurança e Criptografia" },
  { id: "retencao", title: "7. Retenção de Dados" },
  { id: "direitos", title: "8. Direitos do Titular" },
  { id: "cookies", title: "9. Cookies e Armazenamento Local" },
  { id: "transferencia", title: "10. Transferência Internacional" },
  { id: "dpo", title: "11. Encarregado de Dados (DPO)" },
  { id: "atualizacoes", title: "12. Atualizações desta Política" },
];

export const metadata = {
  title: "Política de Privacidade — Koinos",
  description:
    "Política de Privacidade LGPD-compliant do SaaS Koinos para gestão de igrejas.",
};

export default function PrivacidadePage() {
  return (
    <LegalLayout
      title="Política de Privacidade"
      effectiveDate={CURRENT_TERMS_VERSION}
      sections={SECTIONS}
    >
      <Section id="controlador" title="1. Controlador de Dados">
        <p>
          O <strong>controlador</strong> dos dados pessoais tratados pela
          plataforma Koinos é a <strong>Koinos Digital</strong>, empresa
          brasileira, com sede no Brasil, responsável por determinar as
          finalidades e os meios do tratamento dos dados, nos termos da Lei
          Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
        </p>
        <p>
          Para contato sobre privacidade, consulte a{" "}
          <a href="#dpo">Seção 11 (Encarregado de Dados)</a>.
        </p>
      </Section>

      <Section id="dados-coletados" title="2. Dados Coletados">
        <h3>2.1 Dados pessoais</h3>
        <ul>
          <li>Nome completo;</li>
          <li>CPF (armazenado criptografado com AES-256-GCM);</li>
          <li>RG (armazenado criptografado com AES-256-GCM);</li>
          <li>Endereço de e-mail;</li>
          <li>Telefone;</li>
          <li>Data de nascimento;</li>
          <li>
            Endereço residencial (logradouro, bairro, cidade, estado, CEP);
          </li>
          <li>Foto de perfil (armazenada no serviço de storage Supabase).</li>
        </ul>

        <h3>2.2 Dados eclesiásticos</h3>
        <ul>
          <li>Papel na Igreja (pastor, líder, membro, visitante etc.);</li>
          <li>Data de recebimento e batismo;</li>
          <li>Ministérios e grupos musicais a que pertence;</li>
          <li>Escalas de serviço atribuídas;</li>
          <li>Tags de atribuição pastoral.</li>
        </ul>

        <h3>2.3 Dados financeiros</h3>
        <ul>
          <li>
            Transações financeiras registradas pela liderança (dízimos, ofertas,
            despesas);
          </li>
          <li>
            Número de conta bancária da Igreja (armazenado criptografado com
            AES-256-GCM).
          </li>
        </ul>

        <h3>2.4 Dados comportamentais</h3>
        <ul>
          <li>
            Registros de check-in em eventos (data, hora, método, geolocalização
            opcional);
          </li>
          <li>Histórico de leitura bíblica diária e streaks de devoção;</li>
          <li>Pontuação e conquistas na gamificação;</li>
          <li>Posts, comentários e reações no mural comunitário;</li>
          <li>
            Votos em eleições de assembleia (armazenados de forma anonimizada
            via hash SHA-256).
          </li>
        </ul>

        <h3>2.5 Dados técnicos</h3>
        <ul>
          <li>
            Endereço IP (registrado nos logs de auditoria de operações
            sensíveis);
          </li>
          <li>
            Informações de sessão (token JWT gerenciado pelo Supabase Auth);
          </li>
          <li>
            Dados de autenticação multifator (TOTP via Supabase Auth MFA).
          </li>
        </ul>
      </Section>

      <Section id="finalidade" title="3. Finalidade do Tratamento">
        <h3>Cadastro e gestão de membros</h3>
        <p>
          Identificar, autenticar e gerenciar os membros da Igreja, incluindo
          controle de acesso por papéis (RBAC) e comunicação interna.
        </p>

        <h3>Prestação do serviço contratado</h3>
        <p>
          Operar todos os módulos contratados pela Igreja: agenda, eventos,
          ministérios, escalas, liturgia, repertório, recursos, financeiro,
          mural, gamificação, check-in, assembleias e landing page.
        </p>

        <h3>Conformidade legal e auditoria</h3>
        <p>
          Manter logs de auditoria de operações sensíveis (quem fez o quê,
          quando e de qual IP) para fins de rastreabilidade e cumprimento de
          obrigações legais, incluindo registros financeiros exigidos pela
          legislação tributária.
        </p>

        <h3>Segurança e prevenção de fraudes</h3>
        <p>
          Detectar e prevenir acessos não autorizados, tentativas de fraude e
          uso indevido da plataforma.
        </p>

        <h3>Engajamento comunitário (com consentimento)</h3>
        <p>
          Envio de notificações por e-mail sobre escalas, eventos e atividades
          da Igreja, mediante consentimento específico do Usuário.
        </p>

        <h3>Gamificação e devoção (com consentimento)</h3>
        <p>
          Registrar pontuações, conquistas e streaks de leitura para promover o
          engajamento espiritual, mediante consentimento do Usuário.
        </p>

        <h3>Melhoria do serviço</h3>
        <p>
          Análise agregada e anonimizada de uso da plataforma para identificar
          oportunidades de melhoria, sem identificação individual.
        </p>
      </Section>

      <Section id="base-legal" title="4. Base Legal">
        <p>
          O tratamento de dados pessoais pelo Koinos fundamenta-se nas seguintes
          bases legais previstas na LGPD (art. 7º e art. 11):
        </p>
        <ul>
          <li>
            <strong>Consentimento (art. 7º, I):</strong> para notificações por
            e-mail, gamificação, engajamento e compartilhamento opcional de
            dados. O consentimento é registrado com timestamp, IP e versão dos
            termos, podendo ser revogado a qualquer momento em{" "}
            <em>Perfil → Privacidade</em>.
          </li>
          <li>
            <strong>Execução de contrato (art. 7º, V):</strong> para dados
            necessários à prestação do serviço contratado pela Igreja, como
            identificação, autenticação, escalas e eventos.
          </li>
          <li>
            <strong>Cumprimento de obrigação legal (art. 7º, II):</strong> para
            manutenção de registros financeiros e logs de auditoria exigidos
            pela legislação brasileira.
          </li>
          <li>
            <strong>Legítimo interesse (art. 7º, IX):</strong> para segurança da
            plataforma, prevenção de fraudes e melhoria do serviço, desde que
            não prevaleçam sobre os direitos e liberdades do Usuário.
          </li>
        </ul>
      </Section>

      <Section
        id="compartilhamento"
        title="5. Compartilhamento e Processadores"
      >
        <p>
          O Koinos não vende dados pessoais. O compartilhamento ocorre
          exclusivamente com os seguintes subprocessadores, todos vinculados por
          acordos de proteção de dados:
        </p>

        <h3>Supabase, Inc. (EUA)</h3>
        <p>
          Banco de dados PostgreSQL, autenticação e armazenamento de arquivos.
          Dados armazenados na região <strong>us-east-1</strong> (podendo ser
          migrados para região brasileira quando disponível). Privacy Policy:{" "}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            supabase.com/privacy
          </a>
          .
        </p>

        <h3>Stripe, Inc. (EUA)</h3>
        <p>
          Processamento de pagamentos de assinaturas. O Koinos não armazena
          dados de cartão de crédito. Privacy Policy:{" "}
          <a
            href="https://stripe.com/br/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            stripe.com/br/privacy
          </a>
          .
        </p>

        <h3>Resend, Inc. (EUA)</h3>
        <p>
          Envio de e-mails transacionais (boas-vindas, convite, redefinição de
          senha, código de votação, falha de pagamento). Privacy Policy:{" "}
          <a
            href="https://resend.com/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            resend.com/legal/privacy-policy
          </a>
          .
        </p>

        <h3>Vercel, Inc. (EUA)</h3>
        <p>
          Hospedagem e entrega da aplicação web, incluindo edge network global.
          Privacy Policy:{" "}
          <a
            href="https://vercel.com/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            vercel.com/legal/privacy-policy
          </a>
          .
        </p>

        <h3>Upstash, Inc. (EUA)</h3>
        <p>
          Serviço Redis para rate limiting e cache de tokens de check-in. Não
          armazena dados pessoais de forma persistente.
        </p>

        <h3>Cloudflare, Inc. (EUA)</h3>
        <p>
          Serviço Turnstile para validação anti-bot nos formulários de cadastro.
          Privacy Policy:{" "}
          <a
            href="https://www.cloudflare.com/privacypolicy/"
            target="_blank"
            rel="noopener noreferrer"
          >
            cloudflare.com/privacypolicy
          </a>
          .
        </p>

        <h3>OpenAI, L.L.C. / Google LLC (EUA)</h3>
        <p>
          Modelos de Inteligência Artificial utilizados para sugestões de
          liturgia (add-on). Apenas o contexto necessário (objetivo do culto,
          lista de músicas do repertório, versículos bíblicos) é enviado, sem
          dados pessoais identificáveis.
        </p>

        <p>
          O compartilhamento com autoridades públicas ocorre apenas quando
          exigido por lei ou determinação judicial.
        </p>
      </Section>

      <Section id="seguranca" title="6. Segurança e Criptografia">
        <h3>6.1 Criptografia em repouso</h3>
        <p>
          Os seguintes dados sensíveis são criptografados com{" "}
          <strong>AES-256-GCM</strong> antes de serem armazenados no banco:
        </p>
        <ul>
          <li>CPF dos membros;</li>
          <li>RG dos membros;</li>
          <li>Número de conta bancária da Igreja.</li>
        </ul>
        <p>
          A chave de criptografia é gerenciada por variável de ambiente no
          servidor e nunca exposta ao cliente.
        </p>

        <h3>6.2 Isolamento multi-tenant</h3>
        <p>
          Cada Igreja é isolada das demais por Row Level Security (RLS) no banco
          de dados PostgreSQL. Nenhum dado de uma Igreja é acessível por outra,
          nem mesmo para o time técnico do Koinos em operações de rotina.
        </p>

        <h3>6.3 Autenticação</h3>
        <p>
          Autenticação gerenciada pelo Supabase Auth com suporte a autenticação
          multifator (TOTP). Senhas são armazenadas com hash bcrypt pelo
          Supabase.
        </p>

        <h3>6.4 Transmissão</h3>
        <p>
          Todas as comunicações entre cliente e servidor utilizam TLS/HTTPS. Os
          security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
          são configurados em todas as respostas.
        </p>

        <h3>6.5 Votos e anonimização</h3>
        <p>
          Os votos em eleições de assembleia são armazenados com um hash SHA-256
          do identificador do votante (nunca o ID direto), garantindo anonimato
          enquanto previne dupla votação.
        </p>

        <h3>6.6 Incidentes de segurança</h3>
        <p>
          Em caso de violação de dados que possa afetar os direitos dos
          titulares, o Koinos notificará a Autoridade Nacional de Proteção de
          Dados (ANPD) e os titulares afetados conforme os prazos previstos na
          LGPD.
        </p>
      </Section>

      <Section id="retencao" title="7. Retenção de Dados">
        <p>
          Os dados pessoais são retidos pelos prazos abaixo, findo os quais são
          anonimizados ou excluídos:
        </p>
        <ul>
          <li>
            <strong>Dados pessoais de membros ativos:</strong> enquanto a conta
            estiver ativa.
          </li>
          <li>
            <strong>Dados pessoais após exclusão de conta:</strong> anonimizados
            irreversivelmente (nome, CPF, RG, e-mail, telefone, endereço e foto)
            conforme solicitação do titular.
          </li>
          <li>
            <strong>Registros financeiros:</strong> 5 (cinco) anos, conforme
            exigência do Código Tributário Nacional e legislação contábil
            brasileira.
          </li>
          <li>
            <strong>Logs de auditoria:</strong> 5 (cinco) anos para garantir
            rastreabilidade de operações sensíveis.
          </li>
          <li>
            <strong>Registros de consentimento LGPD:</strong> durante toda a
            vigência da relação e por 5 (cinco) anos após o encerramento, para
            fins de comprovação.
          </li>
          <li>
            <strong>Dados de sessão e tokens:</strong> conforme tempo de
            expiração configurado no Supabase Auth (máximo 7 dias por padrão).
          </li>
        </ul>
      </Section>

      <Section id="direitos" title="8. Direitos do Titular">
        <p>
          Nos termos da LGPD (art. 18), o titular de dados pessoais tem os
          seguintes direitos, todos exercíveis pelo painel{" "}
          <Link
            href="/dashboard/perfil/privacidade"
            className="underline hover:text-[oklch(0.78_0.13_55)] transition-colors"
          >
            Perfil → Privacidade
          </Link>
          :
        </p>
        <ul>
          <li>
            <strong>Acesso:</strong> visualizar os dados pessoais armazenados
            sobre si.
          </li>
          <li>
            <strong>Correção:</strong> atualizar dados incompletos, inexatos ou
            desatualizados pelo painel de perfil.
          </li>
          <li>
            <strong>Revogação de consentimento:</strong> revogar consentimentos
            granulares a qualquer momento, sem prejuízo da licitude do
            tratamento anterior.
          </li>
          <li>
            <strong>Portabilidade:</strong> exportar seus dados em formato JSON
            ou CSV pelo painel de privacidade.
          </li>
          <li>
            <strong>Exclusão:</strong> solicitar a anonimização irreversível dos
            dados pessoais identificáveis (exceto registros financeiros e logs
            de auditoria, mantidos por obrigação legal).
          </li>
          <li>
            <strong>Oposição:</strong> opor-se ao tratamento realizado com base
            em legítimo interesse.
          </li>
          <li>
            <strong>Informação sobre compartilhamento:</strong> obter
            informações sobre as entidades com as quais seus dados foram
            compartilhados.
          </li>
        </ul>
        <p>
          Solicitações que não possam ser atendidas automaticamente pelo painel
          podem ser direcionadas ao DPO (ver Seção 11). O prazo de resposta é de
          até 15 (quinze) dias úteis.
        </p>
      </Section>

      <Section id="cookies" title="9. Cookies e Armazenamento Local">
        <h3>9.1 Cookies essenciais</h3>
        <p>
          O Koinos utiliza cookies estritamente necessários para o funcionamento
          da plataforma:
        </p>
        <ul>
          <li>
            <strong>Cookie de sessão Supabase:</strong> mantém o Usuário
            autenticado entre as requisições. Necessário para uso do sistema.
          </li>
          <li>
            <strong>Cookie de tema:</strong> armazena a preferência de tema
            claro/escuro para renderização correta do lado do servidor. Pode ser
            excluído sem impacto funcional.
          </li>
        </ul>

        <h3>9.2 Armazenamento local (localStorage)</h3>
        <p>
          O Koinos utiliza o <code>localStorage</code> do navegador para:
        </p>
        <ul>
          <li>
            <strong>Preferência de tema:</strong> modo claro ou escuro e
            agendamento de tema automático por horário.
          </li>
          <li>
            <strong>Estado do tour de onboarding:</strong> chave{" "}
            <code>koinos_tour_v1</code> para evitar exibir o tour novamente após
            a conclusão.
          </li>
        </ul>
        <p>
          Esses dados ficam exclusivamente no dispositivo do Usuário e não são
          transmitidos para nossos servidores.
        </p>

        <h3>9.3 Sem cookies de rastreamento</h3>
        <p>
          O Koinos não utiliza cookies de rastreamento, analytics de terceiros
          ou pixels de publicidade.
        </p>
      </Section>

      <Section
        id="transferencia"
        title="10. Transferência Internacional de Dados"
      >
        <p>
          Em razão dos subprocessadores listados na Seção 5, dados pessoais
          podem ser transferidos para servidores localizados nos Estados Unidos
          e em outros países. Essas transferências são realizadas com base nas
          salvaguardas previstas no art. 33 da LGPD:
        </p>
        <ul>
          <li>
            <strong>Supabase:</strong> dados armazenados na região us-east-1
            (AWS). O Supabase é certificado ISO 27001 e oferece Data Processing
            Agreement (DPA) compatível com a LGPD.
          </li>
          <li>
            <strong>Vercel:</strong> a aplicação é servida via edge network
            global. O Vercel oferece DPA compatível com GDPR/LGPD.
          </li>
          <li>
            <strong>Stripe, Resend, Upstash, Cloudflare:</strong>{" "}
            subprocessadores com políticas de privacidade e DPAs disponíveis em
            seus respectivos sites, garantindo nível de proteção equivalente ao
            exigido pela LGPD.
          </li>
        </ul>
        <p>
          O Koinos monitora continuamente a adequação de seus subprocessadores e
          revisará esta lista em caso de mudanças.
        </p>
      </Section>

      <Section id="dpo" title="11. Encarregado de Dados (DPO)">
        <p>
          Nos termos do art. 41 da LGPD, o Koinos designou um Encarregado pelo
          Tratamento de Dados Pessoais (DPO). Para exercer seus direitos, tirar
          dúvidas sobre esta Política ou reportar incidentes de privacidade,
          entre em contato:
        </p>
        <ul>
          <li>
            <strong>E-mail:</strong>{" "}
            <a href="mailto:privacidade@koinos.digital">
              privacidade@koinos.digital
            </a>
          </li>
          <li>
            <strong>Assunto sugerido:</strong> &quot;[LGPD] Solicitação do
            titular&quot; ou &quot;[LGPD] Incidente de privacidade&quot;
          </li>
        </ul>
        <p>
          Também é possível registrar reclamações perante a Autoridade Nacional
          de Proteção de Dados (ANPD) em{" "}
          <a
            href="https://www.gov.br/anpd"
            target="_blank"
            rel="noopener noreferrer"
          >
            gov.br/anpd
          </a>
          .
        </p>
      </Section>

      <Section id="atualizacoes" title="12. Atualizações desta Política">
        <p>
          Esta Política de Privacidade pode ser atualizada periodicamente para
          refletir mudanças nas práticas de tratamento de dados, na legislação
          aplicável ou nas funcionalidades da plataforma.
        </p>
        <p>
          Alterações significativas serão comunicadas por e-mail com
          antecedência mínima de 15 (quinze) dias antes da nova data de
          vigência. A data de vigência exibida no topo deste documento indica a
          versão atual. O uso continuado da plataforma após a vigência implica
          aceitação das alterações.
        </p>
        <p>
          O histórico de versões desta Política pode ser solicitado ao DPO pelo
          e-mail indicado na Seção 11.
        </p>
      </Section>
    </LegalLayout>
  );
}

// ─── Helper component ─────────────────────────────────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-10">
      <h2
        className="font-display text-2xl text-foreground mb-5 pb-3 border-b border-border"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <div className="space-y-4 text-text-body text-sm leading-relaxed [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:text-base [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-foreground [&_code]:bg-surface-hover [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono">
        {children}
      </div>
    </section>
  );
}
