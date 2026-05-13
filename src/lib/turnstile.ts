export async function verifyTurnstile(token: string): Promise<boolean> {
  // Chave de teste do Cloudflare: sempre retorna sucesso
  const DEV_SECRET = "1x0000000000000000000000000000000AA";

  const secret =
    process.env.NODE_ENV === "development"
      ? DEV_SECRET
      : process.env.TURNSTILE_SECRET_KEY;

  if (!secret) return false;

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
    }
  );

  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}
