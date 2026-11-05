import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type { TransportTargetOptions } from 'pino';

/**
 * Where logs go. Always one readable line per log (pino-pretty, to stdout, which is
 * what Render shows); with OTEL_EXPORTER_OTLP_ENDPOINT set, also OTLP to Grafana
 * Cloud (Loki), using the same OTEL_* variables as the metrics. Silent in tests.
 * Request URLs are already censored (see logUrl) and `redact` hides credentials
 * before a log reaches any transport.
 */
export function logTransport(
  level: string,
  env: NodeJS.ProcessEnv = process.env,
): { targets: TransportTargetOptions[] } | undefined {
  if (env.ENV === 'test') return undefined;
  // Resolved here: pino cannot find transports from inside nestjs-pino under pnpm's strict layout.
  const resolve = createRequire(import.meta.url).resolve;
  const targets: TransportTargetOptions[] = [
    {
      level,
      target: resolve('pino-pretty'),
      options: {
        // Render's log viewer renders ANSI colors; set NO_COLOR=1 to turn them off.
        colorize: env.NO_COLOR === undefined,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'hostname,context,req,res',
        messageFormat: '{if context}[{context}] {end}{msg}',
        singleLine: true,
      },
    },
  ];
  if (env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    targets.push({
      level,
      // Our wrapper around pino-opentelemetry-transport: it also reports failed exports.
      target: fileURLToPath(new URL('./otlp-logs-transport.js', import.meta.url)),
      options: {
        loggerName: 'ips-api',
        resourceAttributes: {
          'service.name': env.OTEL_SERVICE_NAME ?? 'ips-api',
          'deployment.environment': env.ENV ?? 'dev',
        },
      },
    });
  }
  return { targets };
}
