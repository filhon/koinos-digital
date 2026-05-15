/**
 * Generates a CSP header value with a per-request nonce.
 * The Supabase hostname is derived from env to avoid wildcards.
 */
export function buildCsp(nonce: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let supabaseHost = "";
  try {
    supabaseHost = new URL(supabaseUrl).hostname;
  } catch {
    supabaseHost = "*.supabase.co"; // fallback only in misconfigured envs
  }

  const isDev = process.env.NODE_ENV === "development";

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' challenges.cloudflare.com static.cloudflareinsights.com${isDev ? " 'unsafe-eval'" : ""}`,
    // style-src keeps 'unsafe-inline' — Next.js injects inline styles that can't be nonce'd
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabaseHost}`,
    `connect-src 'self' ${supabaseHost} *.upstash.io challenges.cloudflare.com *.challenges.cloudflare.com cloudflareinsights.com`,
    "frame-src www.youtube.com youtube.com www.google.com maps.google.com challenges.cloudflare.com *.challenges.cloudflare.com",
  ];

  return directives.join("; ");
}
