import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

export interface WeeklyDigestEmailProps {
  memberName: string;
  churchName: string;
  appUrl: string;
  unsubscribeUrl: string;
  weekLabel: string; // ex: "5 a 11 de maio"
  upcomingEvents: Array<{ name: string; date: string; modality: string }>;
  newPostsCount: number;
  leaguePosition: number | null; // posição no ranking mensal (null se sem pontos)
  teamName: string | null;
}

export default function WeeklyDigestEmail({
  memberName,
  churchName,
  appUrl,
  unsubscribeUrl,
  weekLabel,
  upcomingEvents,
  newPostsCount,
  leaguePosition,
  teamName,
}: WeeklyDigestEmailProps) {
  const hasEvents = upcomingEvents.length > 0;

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>
        Resumo da semana em {churchName} — {weekLabel}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>Koinos</Text>
            <Text style={churchLabel}>{churchName}</Text>
          </Section>

          {/* Saudação */}
          <Heading style={h1}>Olá, {memberName}! 👋</Heading>
          <Text style={text}>
            Aqui está o resumo da sua semana ({weekLabel}) na {churchName}.
          </Text>

          <Hr style={hr} />

          {/* Próximos eventos */}
          <Section>
            <Heading style={h2}>📅 Próximos eventos</Heading>
            {hasEvents ? (
              upcomingEvents.map((event, i) => (
                <Row key={i} style={eventRow}>
                  <Column>
                    <Text style={eventName}>{event.name}</Text>
                    <Text style={eventMeta}>
                      {event.date} ·{" "}
                      {event.modality === "presencial"
                        ? "Presencial"
                        : "Online"}
                    </Text>
                  </Column>
                </Row>
              ))
            ) : (
              <Text style={mutedText}>
                Nenhum evento agendado para a próxima semana.
              </Text>
            )}
          </Section>

          <Hr style={hr} />

          {/* Comunicação */}
          <Section>
            <Heading style={h2}>📣 Comunicação</Heading>
            <Text style={text}>
              {newPostsCount > 0
                ? `${newPostsCount} novo${newPostsCount !== 1 ? "s" : ""} post${newPostsCount !== 1 ? "s" : ""} publicado${newPostsCount !== 1 ? "s" : ""} esta semana.`
                : "Nenhum post novo esta semana."}
            </Text>
          </Section>

          {/* Liga */}
          {leaguePosition !== null && (
            <>
              <Hr style={hr} />
              <Section>
                <Heading style={h2}>🏆 Sua posição na Liga</Heading>
                <Text style={text}>
                  Você está em <strong>#{leaguePosition}</strong> no ranking
                  mensal
                  {teamName ? ` pela tribo ${teamName}` : ""}.
                </Text>
              </Section>
            </>
          )}

          <Hr style={hr} />

          {/* CTA */}
          <Section style={ctaSection}>
            <Button href={appUrl} style={button}>
              Abrir Koinos
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Text style={footer}>
            Você recebe este resumo semanal porque é membro do Koinos.
            <br />
            Para desativar,{" "}
            <a href={unsubscribeUrl} style={link}>
              clique aqui
            </a>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  fontFamily: "'DM Sans', Arial, sans-serif",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "40px",
  borderRadius: "12px",
  maxWidth: "540px",
  border: "1px solid #e5e7eb",
};

const header: React.CSSProperties = {
  marginBottom: "24px",
};

const logoText: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#1a3a3a",
  margin: "0 0 2px",
};

const churchLabel: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "0",
};

const h1: React.CSSProperties = {
  color: "#111827",
  fontSize: "22px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const h2: React.CSSProperties = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const text: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const mutedText: React.CSSProperties = {
  ...text,
  color: "#9ca3af",
};

const eventRow: React.CSSProperties = {
  marginBottom: "12px",
  paddingLeft: "12px",
  borderLeft: "3px solid #b45309",
};

const eventName: React.CSSProperties = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 2px",
};

const eventMeta: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "0",
};

const ctaSection: React.CSSProperties = {
  textAlign: "center",
  margin: "24px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#1a3a3a",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 32px",
  textDecoration: "none",
  display: "inline-block",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "1.6",
};

const link: React.CSSProperties = {
  color: "#9ca3af",
  textDecoration: "underline",
};
