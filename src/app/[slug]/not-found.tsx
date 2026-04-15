import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6"
      style={{
        background: "oklch(0.12 0.03 250)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <h1
        className="text-5xl font-normal"
        style={{
          fontFamily: "var(--font-display)",
          color: "oklch(0.9 0.01 250)",
        }}
      >
        Igreja não encontrada
      </h1>
      <p style={{ color: "oklch(0.55 0.04 250)" }}>
        A página que você procura não existe ou ainda não foi publicada.
      </p>
      <Link
        href="/"
        className="mt-4 px-6 py-3 rounded-full text-sm font-medium transition-all hover:scale-105"
        style={{
          background: "oklch(0.78 0.13 55)",
          color: "oklch(0.13 0.025 250)",
        }}
      >
        Voltar ao início
      </Link>
    </div>
  );
}
