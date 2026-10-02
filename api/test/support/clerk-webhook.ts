import { createHmac, randomUUID } from 'node:crypto';

/** Fixed test secret (Standard Webhooks format: "whsec_" + base64 key). */
export const TEST_WEBHOOK_SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw';

/**
 * Signs a webhook payload like Clerk (Svix / Standard Webhooks) does:
 * base64(HMAC-SHA256(key, "<id>.<timestamp>.<body>")) in a "v1,<sig>" header.
 */
export function signedWebhook(
  payload: object,
  secret = TEST_WEBHOOK_SECRET,
): { body: string; headers: Record<string, string> } {
  const body = JSON.stringify(payload);
  const id = `msg_${randomUUID()}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signature = createHmac('sha256', key)
    .update(`${id}.${timestamp}.${body}`)
    .digest('base64');
  return {
    body,
    headers: {
      'content-type': 'application/json',
      'svix-id': id,
      'svix-timestamp': timestamp,
      'svix-signature': `v1,${signature}`,
    },
  };
}
