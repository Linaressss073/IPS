import { type Histogram, metrics } from '@opentelemetry/api';
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
  const provider = new MeterProvider({
    resource: resourceFromAttributes({ 'service.name': env.OTEL_SERVICE_NAME ?? 'ips-api' }),
    readers: [
      new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter(), exportIntervalMillis: EXPORT_INTERVAL_MS }),
    ],
  });
  metrics.setGlobalMeterProvider(provider);
  return provider;
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
