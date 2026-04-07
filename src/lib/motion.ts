import type { Variants, Transition } from "framer-motion";

/** Verifica prefers-reduced-motion para uso no client */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Retorna variants sem animação quando prefers-reduced-motion está ativo */
function safe<T extends Variants>(variants: T): T {
  if (typeof window !== "undefined" && prefersReducedMotion()) {
    const keys = Object.keys(variants) as (keyof T)[];
    return keys.reduce((acc, key) => ({ ...acc, [key]: {} }), {} as T);
  }
  return variants;
}

// ─── Transições base ───────────────────────────────────────

const easeOut: Transition = { duration: 0.2, ease: "easeOut" };
const easeOutMed: Transition = { duration: 0.3, ease: "easeOut" };
const spring: Transition = { type: "spring", stiffness: 320, damping: 30 };
const springStiff: Transition = { type: "spring", stiffness: 400, damping: 28 };

// ─── Variants reutilizáveis ────────────────────────────────

/** Fade simples: opacity 0→1, 200ms ease-out */
export const fadeIn: Variants = safe({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: easeOut,
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
});

/** Slide up: translateY 16px→0 + fade, 300ms ease-out */
export const slideUp: Variants = safe({
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: easeOutMed,
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: { duration: 0.15, ease: "easeIn" },
  },
});

/** Scale in para modals/dialogs: scale 0.95→1 + fade */
export const scaleIn: Variants = safe({
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: easeOutMed,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.15, ease: "easeIn" },
  },
});

/** Stagger container: delay 50ms entre filhos */
export const staggerContainer: Variants = safe({
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
});

/** Item de lista/grid para uso com staggerContainer */
export const staggerItem: Variants = safe({
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: easeOutMed,
  },
});

/** Slide in da esquerda (usado no painel de auth) */
export const slideInLeft: Variants = safe({
  hidden: { opacity: 0, x: -24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
});

/** Sidebar collapse com spring */
export const sidebarSpring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 26,
};

/** Hover scale para cards interativos */
export const cardHover = {
  scale: 1.02,
  transition: spring,
};

/** Press feedback para botões (scale 0.97, 100ms) */
export const buttonPress = {
  scale: 0.97,
  transition: { duration: 0.1, ease: "easeOut" },
};

// ─── Page transition (dashboard routes) ───────────────────

export const pageTransition: Variants = safe({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
});

// ─── Legacy aliases (mantém compatibilidade com auth) ─────

/** @deprecated use staggerContainer */
export const staggerContainerLegacy = staggerContainer;

/** @deprecated use staggerItem */
export const fadeUp = staggerItem;

export { spring, springStiff, easeOut, easeOutMed };
