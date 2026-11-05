import { securityHeaders } from "./lib/security-headers.mjs";

const headers = securityHeaders({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  clerkKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  dev: process.env.NODE_ENV !== "production",
  // Enforced since 2026-11-04: the console of the deployed app showed no violations on the 11 dashboard screens.
  // To investigate a block, switch to false (Report-Only) and read the console.
  enforce: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      // The prescription PDF opens in the browser's own viewer, which a strict policy and framing rules can break.
      { source: "/dashboard/:teamId/consultations/:id/formula", headers: headers.filter((h) => /Content-Type|Referrer/.test(h.key)) },
      { source: "/((?!.*/formula$).*)", headers },
    ];
  },
};

export default nextConfig;
