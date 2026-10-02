import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { hexclaveServerApp } from "@/hexclave/server";
import "./globals.css";
import { Provider } from "./provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stack Template",
  description: "A Multi-tenant Next.js Starter Template",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Provider>
          <HexclaveProvider app={hexclaveServerApp}>
            <HexclaveTheme>{children}</HexclaveTheme>
          </HexclaveProvider>
        </Provider>
      </body>
    </html>
  );
}
