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

interface WelcomeEmailProps {
  memberName: string;
  churchName: string;
  appUrl: string;
}

export default function WelcomeEmail({
  memberName,
  churchName,
  appUrl,
}: WelcomeEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Bem-vindo ao Koinos — {churchName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bem-vindo ao Koinos</Heading>
          <Text style={text}>Olá, {memberName}!</Text>
          <Text style={text}>
            Sua conta na {churchName} foi criada com sucesso. Agora você tem
            acesso à plataforma de gestão da sua comunidade.
          </Text>
          <Section style={buttonSection}>
            <Button href={appUrl} style={button}>
              Acessar o Koinos
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Koinos — Gestão para igrejas evangélicas brasileiras.
            <br />
            Se você não criou esta conta, ignore este e-mail.
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

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "32px 0 24px",
};

const footer: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "1.6",
};
