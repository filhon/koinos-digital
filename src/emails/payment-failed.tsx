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

interface Props {
  churchName: string;
  managePlanUrl: string;
}

export default function PaymentFailedEmail({
  churchName,
  managePlanUrl,
}: Props) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Pagamento não processado — {churchName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Pagamento não processado</Heading>
          <Text style={text}>
            O pagamento da assinatura da {churchName} não foi processado.
            Atualize os dados de pagamento para evitar interrupção do serviço.
          </Text>
          <Section style={buttonSection}>
            <Button href={managePlanUrl} style={button}>
              Gerenciar assinatura
            </Button>
          </Section>
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

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "32px 0 24px",
};

const footer: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "1.6",
};
