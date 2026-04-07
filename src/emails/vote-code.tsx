import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface VoteCodeEmailProps {
  memberName: string;
  assemblyName: string;
  electionName: string;
  code: string;
  expiresAt: string;
}

export default function VoteCodeEmail({
  memberName,
  assemblyName,
  electionName,
  code,
  expiresAt,
}: VoteCodeEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Seu código de votação para {electionName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Código de votação</Heading>
          <Text style={text}>Olá, {memberName}!</Text>
          <Text style={text}>
            Você recebeu um código para votar remotamente na eleição{" "}
            <strong>{electionName}</strong> da assembleia{" "}
            <strong>{assemblyName}</strong>.
          </Text>
          <Section style={codeSection}>
            <Text style={codeLabel}>Seu código</Text>
            <Text style={codeText}>{code}</Text>
          </Section>
          <Text style={note}>
            Este código é pessoal e intransferível. Expira em{" "}
            <strong>{expiresAt}</strong>.
          </Text>
          <Text style={note}>
            Nunca compartilhe este código com ninguém. A liderança da
            igreja jamais solicitará seu código de votação.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Koinos — Gestão para igrejas evangélicas brasileiras.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  fontFamily: "'DM Sans', Arial, sans-serif",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "40px",
  borderRadius: "12px",
  maxWidth: "520px",
  border: "1px solid #e5e7eb",
};

const h1: React.CSSProperties = {
  color: "#111827",
  fontSize: "22px",
  fontWeight: "600",
  margin: "0 0 24px",
};

const text: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const codeSection: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center",
};

const codeLabel: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const codeText: React.CSSProperties = {
  color: "#111827",
  fontSize: "36px",
  fontWeight: "700",
  letterSpacing: "0.25em",
  fontFamily: "monospace",
  margin: "0",
};

const note: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "0 0 12px",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "32px 0 24px",
};

const footer: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "1.6",
};
