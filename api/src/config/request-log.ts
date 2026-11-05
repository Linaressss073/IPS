import { logUrl } from './log-url.js';

interface LoggedRequest {
  id?: unknown;
  method?: string;
  url?: string;
  params?: Record<string, unknown>;
}

/**
 * What a request log keeps of the request: its id (to follow one request across
 * lines), method and URL (query values hidden, see logUrl). No headers, no body.
 */
export const requestSerializer = (req: LoggedRequest) => ({ id: req.id, method: req.method, url: logUrl(req.url) });

/**
 * The IPS (`:teamId`, an organization id, never patient data) the request was for, so
 * logs can be filtered per IPS in Grafana. Nothing for routes without one.
 */
export const requestLogProps = (req: LoggedRequest) =>
  typeof req.params?.teamId === 'string' ? { teamId: req.params.teamId } : {};
