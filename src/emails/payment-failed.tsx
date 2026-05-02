import {
  Html,
  Head,
  Preview,
  Body,
  Container,
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
    <Html>
      <Head />
      <Preview>Sua assinatura falhou</Preview>
      <Body
        style={{
          fontFamily: "sans-serif",
          backgroundColor: "#f9f9f9",
          padding: "20px",
        }}
      >
        <Container
          style={{
            backgroundColor: "#fff",
            borderRadius: "4px",
            padding: "20px",
          }}
        >
          <Text style={{ fontSize: "16px" }}>
            Olá líder da {churchName}, o pagamento da sua assinatura falhou. Por
            favor, atualize os dados de pagamento para manter sua igreja ativa
            no Koinos.
          </Text>
          <Text style={{ marginTop: "20px" }}>
            <a
              href={managePlanUrl}
              style={{
                backgroundColor: "#eab308",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "4px",
                textDecoration: "none",
              }}
            >
              Gerenciar Assinatura
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
