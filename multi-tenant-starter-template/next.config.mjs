import { securityHeaders } from "./lib/security-headers.mjs";

const headers = securityHeaders({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  clerkKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  dev: process.env.NODE_ENV !== "production",
  // Report-Only until the console of the deployed app shows no violations; then true.
  enforce: false,
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
