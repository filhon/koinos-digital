import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ResetPasswordEmailProps {
  memberName: string;
  resetUrl: string;
}

export default function ResetPasswordEmail({
  memberName,
  resetUrl,
}: ResetPasswordEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Redefinição de senha — Koinos</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Redefinir senha</Heading>
          <Text style={text}>Olá, {memberName}!</Text>
          <Text style={text}>
            Recebemos uma solicitação para redefinir a senha da sua conta no
            Koinos. Clique no botão abaixo para criar uma nova senha:
          </Text>
          <Section style={buttonSection}>
            <Button href={resetUrl} style={button}>
              Redefinir minha senha
            </Button>
          </Section>
          <Text style={note}>
            Este link expira em 1 hora. Se você não solicitou a redefinição de
            senha, ignore este e-mail — sua conta permanece segura.
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

const buttonSection: React.CSSProperties = {
  margin: "32px 0",
  textAlign: "center",
};

const button: React.CSSProperties = {
  backgroundColor: "#1a1a1a",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
  display: "inline-block",
};

const note: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "0 0 16px",
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
