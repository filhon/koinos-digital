import Link from "next/link";
import { CURRENT_TERMS_VERSION } from "@/lib/constants/legal";
import { LegalLayout } from "./legal-layout";

const SECTIONS = [
  { id: "definicoes", title: "1. Definições" },
  { id: "servico", title: "2. Descrição do Serviço" },
  { id: "cadastro", title: "3. Cadastro e Responsabilidades" },
  { id: "planos", title: "4. Planos e Pagamentos" },
  { id: "propriedade", title: "5. Propriedade Intelectual" },
  { id: "responsabilidade", title: "6. Limitação de Responsabilidade" },
  { id: "encerramento", title: "7. Encerramento de Conta" },
  { id: "geral", title: "8. Disposições Gerais" },
];

export const metadata = {
  title: "Termos de Uso — Koinos",
  description:
    "Termos de Uso do SaaS Koinos para gestão de igrejas evangélicas.",
};

export default function TermosPage() {
  return (
    <LegalLayout
      title="Termos de Uso"
      effectiveDate={CURRENT_TERMS_VERSION}
      sections={SECTIONS}
    >
      <Section id="definicoes" title="1. Definições">
        <p>
          Para os fins destes Termos de Uso, os termos abaixo têm os seguintes
          significados:
        </p>
        <dl>
          <dt>Koinos / Koinos Digital</dt>
          <dd>
            A plataforma de gestão para igrejas evangélicas brasileiras,
            desenvolvida e operada por Koinos Digital, disponível em{" "}
            <strong>koinos.digital</strong> e subdomínios relacionados.
          </dd>

          <dt>Usuário</dt>
          <dd>
            Toda pessoa física que acessa ou utiliza a plataforma Koinos, seja
            como pastor, líder, membro ou visitante de uma Igreja cadastrada.
          </dd>

          <dt>Igreja / Tenant</dt>
          <dd>
            A pessoa jurídica (ou associação religiosa sem CNPJ) que contrata o
            Koinos para gerir sua comunidade. Cada Igreja é isolada das demais
            por arquitetura multi-tenant com Row Level Security (RLS).
          </dd>

          <dt>Administrador da Igreja</dt>
          <dd>
            O Usuário com papel <em>pastor</em> responsável pelo cadastro da
            Igreja e pela gestão dos demais membros e configurações.
          </dd>

          <dt>Plano</dt>
          <dd>
            A modalidade de assinatura contratada pela Igreja, conforme descrito
            na Seção 4.
          </dd>
        </dl>
      </Section>

      <Section id="servico" title="2. Descrição do Serviço">
        <p>
          O Koinos é um Software como Serviço (SaaS) que oferece às igrejas
          evangélicas brasileiras as seguintes funcionalidades, conforme o plano
          contratado:
        </p>
        <ul>
          <li>
            Gestão de membros, famílias e convites com controle de acesso por
            papéis (RBAC);
          </li>
          <li>
            Agenda de eventos, calendário e suporte a eventos recorrentes;
          </li>
          <li>Gestão de ministérios, escalas de serviço e notificações;</li>
          <li>
            Grupos musicais, repertório de músicas e integração com a liturgia;
          </li>
          <li>
            Liturgia de cultos com editor drag-and-drop e sugestões por
            Inteligência Artificial (add-on);
          </li>
          <li>Gestão de recursos físicos e alocação por evento;</li>
          <li>
            Controle financeiro com imutabilidade de transações e relatórios
            (add-on);
          </li>
          <li>Mural comunitário com posts, comentários e reações;</li>
          <li>
            Gamificação por equipes (Tribos de Israel) com placar e conquistas;
          </li>
          <li>Streaks de leitura bíblica diária;</li>
          <li>Check-in via QR Code com geolocalização opcional;</li>
          <li>Assembleias e eleições com votação anônima e verificada;</li>
          <li>Landing page pública personalizável por Igreja;</li>
          <li>
            Suporte a multi-congregações (matriz e filiais) nos planos
            superiores;
          </li>
          <li>
            Portal de privacidade LGPD com exportação e exclusão de dados.
          </li>
        </ul>
        <p>
          O Koinos reserva-se o direito de adicionar, alterar ou descontinuar
          funcionalidades a qualquer momento, com aviso prévio de 30 (trinta)
          dias quando a mudança impactar funcionalidades já contratadas.
        </p>
      </Section>

      <Section id="cadastro" title="3. Cadastro e Responsabilidades">
        <h3>3.1 Elegibilidade</h3>
        <p>
          O cadastro de uma Igreja no Koinos deve ser realizado por pessoa maior
          de 18 anos, com poderes de representação da Igreja. O Usuário declara
          ter capacidade jurídica plena para aceitar estes Termos.
        </p>

        <h3>3.2 Dados verdadeiros</h3>
        <p>
          O Usuário compromete-se a fornecer informações verdadeiras, precisas e
          atualizadas no cadastro. O Koinos não verifica autonomamente a
          autenticidade das informações fornecidas.
        </p>

        <h3>3.3 Segurança da conta</h3>
        <p>
          O Usuário é responsável pela confidencialidade de sua senha e por
          todas as atividades realizadas em sua conta. Em caso de acesso não
          autorizado, o Koinos deve ser notificado imediatamente pelo e-mail de
          suporte.
        </p>

        <h3>3.4 Uso permitido</h3>
        <p>É vedado ao Usuário:</p>
        <ul>
          <li>
            Utilizar o Koinos para fins ilícitos, discriminatórios ou que violem
            direitos de terceiros;
          </li>
          <li>
            Tentar comprometer a segurança, integridade ou disponibilidade da
            plataforma;
          </li>
          <li>
            Compartilhar credenciais de acesso com terceiros não autorizados;
          </li>
          <li>
            Realizar engenharia reversa, descompilar ou copiar partes do
            software;
          </li>
          <li>
            Utilizar robôs, scrapers ou meios automatizados para acessar a
            plataforma sem autorização expressa.
          </li>
        </ul>

        <h3>3.5 Responsabilidade pelo conteúdo</h3>
        <p>
          O Administrador da Igreja é o único responsável pelo conteúdo inserido
          na plataforma, incluindo dados de membros, publicações no mural,
          documentos financeiros e conteúdo da landing page pública. O Koinos
          atua como processador de dados nos termos da LGPD.
        </p>

        <h3>3.6 Dados de menores</h3>
        <p>
          O cadastro de dados de menores de 18 anos (como registros de membros
          menores) é de responsabilidade exclusiva do Administrador da Igreja,
          que deve garantir o consentimento dos responsáveis legais.
        </p>
      </Section>

      <Section id="planos" title="4. Planos e Pagamentos">
        <h3>4.1 Planos disponíveis</h3>
        <p>O Koinos oferece os seguintes planos de assinatura:</p>
        <ul>
          <li>
            <strong>Grátis:</strong> acesso a módulos essenciais sem custo, com
            limite de membros conforme definido na página de preços.
          </li>
          <li>
            <strong>Crescimento:</strong> inclui módulos intermediários
            (ministérios, escalas, grupos musicais, repertório, recursos), com
            cobrança mensal ou anual.
          </li>
          <li>
            <strong>Igreja:</strong> inclui módulos avançados (financeiro,
            assembleias, votação), ideal para igrejas estabelecidas.
          </li>
          <li>
            <strong>Catedral:</strong> plano completo com multi-congregações e
            todos os módulos, destinado a redes de igrejas.
          </li>
        </ul>
        <p>
          Add-ons opcionais (Liturgia com IA, Escala Automática por IA,
          Relatórios Avançados e outros) podem ser contratados separadamente em
          qualquer plano.
        </p>

        <h3>4.2 Cobrança</h3>
        <p>
          Os planos pagos são cobrados antecipadamente, mensal ou anualmente,
          via cartão de crédito processado pela Stripe, Inc. O Koinos não
          armazena dados de cartão de crédito — eles são tratados diretamente
          pela Stripe conforme seu PCI DSS Compliance.
        </p>

        <h3>4.3 Renovação automática</h3>
        <p>
          As assinaturas renovam-se automaticamente ao final de cada período. O
          cancelamento pode ser realizado a qualquer momento pelo painel
          <em>Configurações → Plano</em>, com efeito ao término do período
          vigente.
        </p>

        <h3>4.4 Reembolsos</h3>
        <p>
          Não há reembolso de períodos já pagos, exceto nos casos previstos pelo
          Código de Defesa do Consumidor (Lei nº 8.078/90) ou por acordo
          expresso com o Koinos.
        </p>

        <h3>4.5 Alteração de preços</h3>
        <p>
          O Koinos poderá reajustar os preços com aviso prévio de 30 (trinta)
          dias. O reajuste não se aplica ao período já pago.
        </p>

        <h3>4.6 Inadimplência</h3>
        <p>
          Em caso de falha no pagamento, o acesso aos módulos pagos será
          suspenso após o período de carência definido pela Stripe. Os dados
          permanecem preservados por 90 dias para permitir regularização. Após
          esse prazo, a conta poderá ser excluída.
        </p>
      </Section>

      <Section id="propriedade" title="5. Propriedade Intelectual">
        <h3>5.1 Plataforma</h3>
        <p>
          Todo o código, design, marcas, logotipos, textos e demais elementos
          constituintes do Koinos são propriedade exclusiva da Koinos Digital,
          protegidos pela legislação de propriedade intelectual brasileira e
          tratados internacionais aplicáveis.
        </p>

        <h3>5.2 Conteúdo do Usuário</h3>
        <p>
          O Usuário mantém a propriedade sobre os dados e conteúdos que insere
          na plataforma (dados de membros, publicações, documentos, etc.). Ao
          utilizar o Koinos, o Usuário concede ao Koinos Digital uma licença
          limitada, não exclusiva, para armazenar e processar esses dados com a
          única finalidade de prestar o serviço contratado.
        </p>

        <h3>5.3 Feedback</h3>
        <p>
          Sugestões, comentários ou feedbacks enviados ao Koinos poderão ser
          utilizados para melhorar a plataforma sem qualquer obrigação de
          compensação ao Usuário.
        </p>
      </Section>

      <Section id="responsabilidade" title="6. Limitação de Responsabilidade">
        <h3>6.1 Disponibilidade</h3>
        <p>
          O Koinos empenha-se em manter a plataforma disponível 24 horas por
          dia, 7 dias por semana, mas não garante disponibilidade ininterrupta.
          Manutenções programadas serão avisadas com antecedência.
        </p>

        <h3>6.2 Exclusão de garantias</h3>
        <p>
          O Koinos é fornecido &quot;no estado em que se encontra&quot; (
          <em>as is</em>). Na máxima extensão permitida por lei, o Koinos
          Digital não oferece garantias expressas ou implícitas sobre adequação
          para finalidade específica, ausência de erros ou resultados
          específicos.
        </p>

        <h3>6.3 Limitação de danos</h3>
        <p>
          Em nenhuma hipótese o Koinos Digital será responsável por danos
          indiretos, incidentais, especiais ou consequenciais, incluindo lucros
          cessantes, perda de dados ou danos à reputação, decorrentes do uso ou
          da impossibilidade de uso da plataforma.
        </p>

        <h3>6.4 Responsabilidade máxima</h3>
        <p>
          A responsabilidade total do Koinos Digital perante o Usuário, por
          qualquer causa, ficará limitada ao valor pago pelo Usuário nos últimos
          3 (três) meses anteriores ao evento que originou a reclamação.
        </p>

        <h3>6.5 Força maior</h3>
        <p>
          O Koinos Digital não será responsável por falhas decorrentes de caso
          fortuito, força maior, ações de terceiros (incluindo ataques
          cibernéticos) ou falhas de infraestrutura fora de seu controle.
        </p>
      </Section>

      <Section id="encerramento" title="7. Encerramento de Conta">
        <h3>7.1 Por iniciativa do Usuário</h3>
        <p>
          O Administrador da Igreja pode solicitar o encerramento da conta a
          qualquer momento pelo painel{" "}
          <em>Perfil → Privacidade → Excluir conta</em>. Os dados pessoais serão
          anonimizados conforme a Política de Privacidade. Registros financeiros
          e logs de auditoria são mantidos pelo prazo legal obrigatório.
        </p>

        <h3>7.2 Por iniciativa do Koinos</h3>
        <p>
          O Koinos Digital pode suspender ou encerrar uma conta, com ou sem
          aviso prévio, em caso de:
        </p>
        <ul>
          <li>Violação destes Termos de Uso;</li>
          <li>Inadimplência não regularizada no prazo de carência;</li>
          <li>
            Uso da plataforma para fins ilícitos ou que prejudiquem terceiros;
          </li>
          <li>Determinação judicial ou de autoridade competente.</li>
        </ul>

        <h3>7.3 Exportação de dados antes do encerramento</h3>
        <p>
          Recomendamos que o Administrador exporte os dados relevantes pelo
          painel antes do encerramento. Após a exclusão definitiva, a
          recuperação de dados pode não ser possível.
        </p>
      </Section>

      <Section id="geral" title="8. Disposições Gerais">
        <h3>8.1 Alterações nos Termos</h3>
        <p>
          Estes Termos podem ser revisados pelo Koinos Digital a qualquer
          momento. Alterações substanciais serão comunicadas por e-mail com
          antecedência mínima de 15 (quinze) dias. O uso continuado da
          plataforma após a vigência das alterações implica aceitação dos novos
          termos.
        </p>

        <h3>8.2 Privacidade</h3>
        <p>
          O tratamento de dados pessoais é regido pela{" "}
          <Link
            href="/privacidade"
            className="underline hover:text-[oklch(0.78_0.13_55)] transition-colors"
          >
            Política de Privacidade
          </Link>
          , que integra estes Termos de Uso.
        </p>

        <h3>8.3 Lei aplicável e foro</h3>
        <p>
          Estes Termos são regidos pelas leis da República Federativa do Brasil.
          As partes elegem o foro da Comarca de São Paulo - SP para dirimir
          quaisquer controvérsias decorrentes deste instrumento, com renúncia
          expressa a qualquer outro, por mais privilegiado que seja.
        </p>

        <h3>8.4 Independência das cláusulas</h3>
        <p>
          Se qualquer disposição destes Termos for considerada inválida ou
          inexequível, as demais disposições permanecerão em pleno vigor e
          efeito.
        </p>

        <h3>8.5 Contato</h3>
        <p>
          Para dúvidas sobre estes Termos, entre em contato pelo e-mail{" "}
          <a href="mailto:juridico@koinos.digital">juridico@koinos.digital</a>.
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
      <div className="space-y-4 text-text-body text-sm leading-relaxed [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:text-base [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_dl]:space-y-4 [&_dt]:font-semibold [&_dt]:text-foreground [&_dd]:ml-4 [&_dd]:text-text-body [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-foreground [&_em]:italic">
        {children}
      </div>
    </section>
  );
}
