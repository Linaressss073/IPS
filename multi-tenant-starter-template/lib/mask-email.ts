/**
 * Same rule as the API's staff directory (api/src/contexts/staff/domain/utils/mask-email.ts):
 * "andres.gomez@clinica.com.co" -> "and****@cli***.c**". Non e-mails come back unchanged
 * (Clerk identifiers can also be usernames).
 */
export function maskEmail(value: string): string {
  const email = value.trim().toLowerCase();
  const at = email.lastIndexOf("@");
  const labels = email.slice(at + 1).split(".").filter(Boolean);
  if (at < 1 || labels.length < 2) return value;

  const visible = (part: string, count: number) => part.slice(0, Math.min(count, part.length - 1));
  const tld = labels[labels.length - 1];
  return `${visible(email.slice(0, at), 3)}****@${visible(labels[0], 3)}***.${tld[0]}**`;
}
