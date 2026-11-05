/** Frontend API host of a Clerk publishable key (`pk_test_` + base64 of "host$"); "" if it is not one. */
export function clerkHost(publishableKey = "") {
  try {
    const host = Buffer.from(publishableKey.split("_")[2] ?? "", "base64").toString("utf8").replace(/\$$/, "");
    return /^[a-z0-9.-]+$/i.test(host) && host.includes(".") ? host : "";
  } catch {
    return "";
  }
}

const origin = (url = "") => {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
};

/**
 * The page may only load code, data and frames from itself, from its API and from
 * Clerk (sign-in, with its Cloudflare bot check). Inline scripts and styles are
 * allowed because Next.js and Clerk need them; nothing else is.
 * @param {{ apiUrl?: string, clerkKey?: string, dev?: boolean }} options
 */
export function contentSecurityPolicy({ apiUrl, clerkKey, dev = false }) {
  const clerk = ["https://*.clerk.accounts.dev", clerkHost(clerkKey) && `https://${clerkHost(clerkKey)}`].filter(Boolean);
  const directives = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : []), ...clerk, "https://challenges.cloudflare.com"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https://img.clerk.com"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", origin(apiUrl), ...clerk, "https://clerk-telemetry.com"].filter(Boolean),
    "frame-src": ["https://challenges.cloudflare.com"],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

/**
 * `enforce: false` sends the policy as Report-Only: violations show in the console but nothing is blocked.
 * @param {{ enforce?: boolean, apiUrl?: string, clerkKey?: string, dev?: boolean }} options
 */
export function securityHeaders({ enforce = false, ...policy }) {
  return [
    { key: enforce ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only", value: contentSecurityPolicy(policy) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  ];
}
