import { describe, expect, it } from "vitest";
import { clerkHost, contentSecurityPolicy, securityHeaders } from "./security-headers.mjs";

const key = (host: string) => `pk_test_${Buffer.from(`${host}$`).toString("base64")}`;

describe("clerkHost", () => {
  it("reads the frontend API host from the publishable key", () => {
    expect(clerkHost(key("holy-dragon-77.clerk.accounts.dev"))).toBe("holy-dragon-77.clerk.accounts.dev");
    expect(clerkHost(key("clerk.ipsalfa.com"))).toBe("clerk.ipsalfa.com");
  });

  it("returns nothing for a missing or malformed key", () => {
    expect(clerkHost()).toBe("");
    expect(clerkHost("not-a-key")).toBe("");
    expect(clerkHost("pk_test_@@@")).toBe("");
  });
});

describe("contentSecurityPolicy", () => {
  const policy = contentSecurityPolicy({ apiUrl: "https://ips-api.onrender.com/api/v1", clerkKey: key("clerk.ipsalfa.com") });

  it("allows only itself, the API and Clerk", () => {
    expect(policy).toContain("default-src 'self'");
    expect(policy).toMatch(/connect-src [^;]*https:\/\/ips-api\.onrender\.com(?![/\w])/);
    expect(policy).toMatch(/script-src [^;]*https:\/\/clerk\.ipsalfa\.com/);
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
  });

  it("only allows eval in development", () => {
    expect(policy).not.toContain("'unsafe-eval'");
    expect(contentSecurityPolicy({ dev: true })).toContain("'unsafe-eval'");
  });

  it("works with no API URL or key", () => {
    expect(contentSecurityPolicy({})).toContain("connect-src 'self' https://*.clerk.accounts.dev");
  });
});

describe("securityHeaders", () => {
  const names = (headers: { key: string }[]) => headers.map((h) => h.key);

  it("sends the policy as Report-Only unless it is enforced", () => {
    expect(names(securityHeaders({}))).toContain("Content-Security-Policy-Report-Only");
    expect(names(securityHeaders({ enforce: true }))).toContain("Content-Security-Policy");
    expect(names(securityHeaders({ enforce: true }))).not.toContain("Content-Security-Policy-Report-Only");
  });

  it("always sends the framing, sniffing and referrer headers", () => {
    expect(names(securityHeaders({}))).toEqual(
      expect.arrayContaining(["X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy"]),
    );
  });
});
