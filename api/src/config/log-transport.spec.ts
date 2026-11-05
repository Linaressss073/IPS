import { describe, expect, it } from 'vitest';
import { logTransport } from './log-transport.js';

describe('logTransport', () => {
  it('is off in tests', () => {
    expect(logTransport('info', { ENV: 'test', OTEL_EXPORTER_OTLP_ENDPOINT: 'https://example.invalid/otlp' })).toBeUndefined();
  });

  it('only prints readable lines without an OTLP endpoint', () => {
    const { targets } = logTransport('info', { ENV: 'prod' })!;
    expect(targets).toHaveLength(1);
    expect(targets[0].target).toContain('pino-pretty');
  });

  it('colors the lines unless NO_COLOR is set', () => {
    const color = (env: NodeJS.ProcessEnv) => (logTransport('info', env)!.targets[0].options as { colorize: boolean }).colorize;
    expect(color({ ENV: 'prod' })).toBe(true);
    expect(color({ ENV: 'prod', NO_COLOR: '1' })).toBe(false);
  });

  it('also sends the logs to OTLP, with the service and the environment, when there is an endpoint', () => {
    const { targets } = logTransport('warn', {
      ENV: 'prod',
      OTEL_SERVICE_NAME: 'ips-api',
      OTEL_EXPORTER_OTLP_ENDPOINT: 'https://example.invalid/otlp',
    })!;
    expect(targets).toHaveLength(2);
    expect(targets[1].target).toContain('pino-opentelemetry-transport');
    expect(targets.map((t) => t.level)).toEqual(['warn', 'warn']);
    expect(targets[1].options).toMatchObject({
      resourceAttributes: { 'service.name': 'ips-api', 'deployment.environment': 'prod' },
    });
  });
});
