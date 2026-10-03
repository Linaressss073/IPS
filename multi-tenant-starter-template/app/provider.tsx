'use client';

import { ThemeProvider } from "next-themes";


export function Provider(props: { children?: React.ReactNode }) {
  return (
    // Follows the OS light/dark preference until the user picks one.
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {props.children}
    </ThemeProvider>
  );
}