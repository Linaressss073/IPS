"use client";

import { useTheme } from "next-themes";

/**
 * Clerk's widgets (sign-in, IPS chooser, user menu) with the app's health
 * palette. Same values as the tokens in app/globals.css, for each mode.
 */
const PALETTE = {
  light: {
    colorPrimary: "hsl(158 72% 29%)",
    colorPrimaryForeground: "hsl(0 0% 100%)",
    colorBackground: "hsl(0 0% 100%)",
    colorForeground: "hsl(211 45% 12%)",
    colorMutedForeground: "hsl(213 16% 40%)",
    colorMuted: "hsl(210 30% 96%)",
    colorInput: "hsl(0 0% 100%)",
    colorInputForeground: "hsl(211 45% 12%)",
    colorNeutral: "hsl(211 45% 12%)",
    colorBorder: "hsl(210 26% 88%)",
    colorDanger: "hsl(0 74% 47%)",
    colorRing: "hsl(158 72% 29%)",
  },
  dark: {
    colorPrimary: "hsl(152 62% 46%)",
    colorPrimaryForeground: "hsl(212 47% 7%)",
    colorBackground: "hsl(212 42% 10%)",
    colorForeground: "hsl(210 30% 95%)",
    colorMutedForeground: "hsl(213 22% 68%)",
    colorMuted: "hsl(212 36% 14%)",
    colorInput: "hsl(212 36% 14%)",
    colorInputForeground: "hsl(210 30% 95%)",
    colorNeutral: "hsl(210 30% 95%)",
    colorBorder: "hsl(212 32% 18%)",
    colorDanger: "hsl(0 70% 52%)",
    colorRing: "hsl(152 62% 46%)",
  },
} as const;

export function useClerkAppearance() {
  const { resolvedTheme } = useTheme();
  return {
    variables: {
      ...PALETTE[resolvedTheme === "dark" ? "dark" : "light"],
      borderRadius: "0.6rem",
    },
  };
}
