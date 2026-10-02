import { ClerkProvider } from "@clerk/nextjs";
import { esMX } from "@clerk/localizations";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Provider } from "./provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IPS · Consulta externa",
  description: "Sistema de información hospitalaria para la consulta externa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Latin American Spanish: Clerk has no es-CO, and es-ES uses "vosotros". */}
        <ClerkProvider localization={esMX}>
          <Provider>{children}</Provider>
        </ClerkProvider>
      </body>
    </html>
  );
}
