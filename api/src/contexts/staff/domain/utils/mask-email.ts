import {
  EMAIL_DOMAIN_VISIBLE_CHARS,
  EMAIL_LOCAL_VISIBLE_CHARS,
} from '../constants/staff.constants.js';

/**
 * Data minimization: the full e-mail never reaches our database, only enough
 * to tell two people apart. The local part, the domain and the top-level
 * domain are all partly hidden, inner labels are dropped and the masks have
 * a fixed length so they do not reveal how long each part is:
 * "andres.gomez@clinica.com.co" -> "and****@cli***.c**".
 * Returns null for anything that is not an e-mail.
 */
export function maskEmail(email: string | null | undefined): string | null {
  const value = email?.trim().toLowerCase() ?? '';
  const at = value.lastIndexOf('@');
  if (at < 1) return null;

  const local = value.slice(0, at);
  const labels = value.slice(at + 1).split('.').filter(Boolean);
  if (labels.length < 2) return null;

  const domain = labels[0];
  const tld = labels[labels.length - 1];
  return (
    `${visiblePart(local, EMAIL_LOCAL_VISIBLE_CHARS)}****` +
    `@${visiblePart(domain, EMAIL_DOMAIN_VISIBLE_CHARS)}***` +
    `.${tld[0]}**`
  );
}

/** Up to `count` leading characters, but never the whole part. */
function visiblePart(part: string, count: number): string {
  return part.slice(0, Math.min(count, part.length - 1));
}
