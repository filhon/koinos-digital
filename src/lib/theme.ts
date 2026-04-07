"use server";

import { cookies } from "next/headers";

export type Theme = "light" | "dark";

const COOKIE_NAME = "koinos-theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** Lê o tema do cookie (server-side) */
export async function getThemeFromCookie(): Promise<Theme> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (value === "dark" || value === "light") return value;
  return "light"; // fallback — client vai checar prefers-color-scheme
}

/** Persiste o tema no cookie via Server Action */
export async function setThemeCookie(theme: Theme) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, theme, {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
