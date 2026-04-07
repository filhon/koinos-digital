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

interface InviteEmailProps {
  inviteeName: string;
  inviterName: string;
  churchName: string;
  inviteUrl: string;
}

export default function InviteEmail({
  inviteeName,
  inviterName,
  churchName,
  inviteUrl,
}: InviteEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>
        {inviterName} te convidou para a {churchName} no Koinos
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Você foi convidado!</Heading>
          <Text style={text}>
            {inviteeName ? `Olá, ${inviteeName}!` : "Olá!"}
          </Text>
          <Text style={text}>
            <strong>{inviterName}</strong> te convidou para fazer parte da{" "}
            <strong>{churchName}</strong> no Koinos, a plataforma de gestão da
            sua comunidade.
          </Text>
          <Text style={text}>
            Clique no botão abaixo para aceitar o convite e criar sua conta:
          </Text>
          <Section style={buttonSection}>
            <Button href={inviteUrl} style={button}>
              Aceitar convite
            </Button>
          </Section>
          <Text style={note}>O link de convite expira em 7 dias.</Text>
          <Hr style={hr} />
          <Text style={footer}>
            Koinos — Gestão para igrejas evangélicas brasileiras.
            <br />
            Se você não esperava este convite, pode ignorar este e-mail.
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
