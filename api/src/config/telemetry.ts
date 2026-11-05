import { diag, DiagConsoleLogger, DiagLogLevel, type Histogram, metrics } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import type { NextFunction, Request, Response } from 'express';

const EXPORT_INTERVAL_MS = 30_000;

/**
 * Pushes metrics to an OTLP endpoint (Grafana Cloud) so it works while the free
 * instance sleeps: nobody has to scrape the API. Off in tests and when no
 * OTEL_EXPORTER_OTLP_ENDPOINT is set. The endpoint, protocol and credentials come
 * only from the standard OTEL_* variables (never from the repository).
 * Returns the provider so the caller can flush it on shutdown.
 */
export function startTelemetry(env: NodeJS.ProcessEnv = process.env): MeterProvider | null {
  if (env.ENV === 'test' || !env.OTEL_EXPORTER_OTLP_ENDPOINT) return null;
  // A failed export (wrong token, wrong endpoint) is otherwise silent: warnings and errors go to the standard output.
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);
  const provider = new MeterProvider({
    // deployment.environment becomes the `deployment_environment` label the dashboard filters by.
    resource: resourceFromAttributes({
      'service.name': env.OTEL_SERVICE_NAME ?? 'ips-api',
      'deployment.environment': env.ENV ?? 'dev',
    }),
    readers: [
      new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter(), exportIntervalMillis: EXPORT_INTERVAL_MS }),
    ],
  });
  metrics.setGlobalMeterProvider(provider);
  return provider;
}

/** One line for the boot log: whether telemetry is on and where it goes (the host only, never the credentials). */
export function telemetryStatus(env: NodeJS.ProcessEnv = process.env): { level: 'log' | 'warn'; message: string } {
  if (env.ENV === 'test') return { level: 'log', message: 'Telemetry off in tests' };
  if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) return { level: 'log', message: 'Telemetry off: OTEL_EXPORTER_OTLP_ENDPOINT is not set' };
  let host: string;
  try {
    host = new URL(env.OTEL_EXPORTER_OTLP_ENDPOINT).host;
  } catch {
    return { level: 'warn', message: 'Telemetry off: OTEL_EXPORTER_OTLP_ENDPOINT is not a valid URL' };
  }
  const sending = `Sending metrics and logs to ${host} as "${env.OTEL_SERVICE_NAME ?? 'ips-api'}"`;
  return env.OTEL_EXPORTER_OTLP_HEADERS
    ? { level: 'log', message: sending }
    : { level: 'warn', message: `${sending}, but OTEL_EXPORTER_OTLP_HEADERS is not set: it will be rejected (401)` };
}

type Recorder = Pick<Histogram, 'record'>;

const requestDuration = (): Recorder =>
  metrics.getMeter('ips-api').createHistogram('http.server.request.duration', {
    unit: 's',
    description: 'Duration of HTTP requests, by route template, status code and IPS',
  });

/**
 * Records every request's duration by route TEMPLATE (never the real URL, so no
 * patient or record ids), method, status code and IPS (`:teamId`, an organization
 * id). Routes that matched nothing are grouped as "unmatched". With no provider
 * set the meter is a no-op.
 */
export function requestMetrics(histogram: Recorder = requestDuration()) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = process.hrtime.bigint();
    res.once('finish', () => {
      const seconds = Number(process.hrtime.bigint() - start) / 1e9;
      histogram.record(seconds, {
        'http.request.method': req.method,
        'http.route': req.route ? `${req.baseUrl}${(req.route as { path: string }).path}` : 'unmatched',
        'http.response.status_code': res.statusCode,
        ...(typeof req.params?.teamId === 'string' && { 'ips.team_id': req.params.teamId }),
      });
    });
    next();
  };
}
