const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
/** Must match API_PREFIX in api/src/config/http.ts. */
const API_PREFIX = "/api/v1";

/** Anything that can hand out the current Hexclave access token (e.g. the user from useUser()). */
export type TokenSource = { getAccessToken(): Promise<string | null> };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
  ) {
    super(message);
  }
}

/** fetch() against the B2B API, authenticated with the user's Hexclave JWT. */
export async function apiFetch<T>(
  auth: TokenSource,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await auth.getAccessToken();
  if (!token) throw new ApiError(401, undefined, "You are not signed in");

  let response: Response;
  try {
    response = await fetch(`${API_URL}${API_PREFIX}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch {
    throw new ApiError(0, undefined, `Cannot reach the API at ${API_URL}`);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    // NestJS returns `message` as a string, or a list of strings for validation errors.
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message ?? response.statusText;
    throw new ApiError(response.status, body?.code, message);
  }
  return body as T;
}
