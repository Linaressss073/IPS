/**
 * A request URL as it is logged (and sent to Grafana Cloud): the query VALUES are
 * hidden, because a search term can be a patient's name or document
 * (`/patients?q=1000123456`). Only the keys stay, so the log still says what was asked.
 */
export function logUrl(url = ''): string {
  const at = url.indexOf('?');
  if (at < 0) return url;
  const keys = [...new URLSearchParams(url.slice(at + 1)).keys()];
  return keys.length ? `${url.slice(0, at)}?${keys.map((key) => `${key}=***`).join('&')}` : url.slice(0, at);
}
