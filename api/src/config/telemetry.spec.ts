import { EventEmitter } from 'node:events';
import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { requestMetrics, startTelemetry } from './telemetry.js';

describe('startTelemetry', () => {
  it('stays off without an endpoint', () => {
    expect(startTelemetry({ ENV: 'prod' })).toBeNull();
  });

  it('stays off in tests even with an endpoint', () => {
    expect(startTelemetry({ ENV: 'test', OTEL_EXPORTER_OTLP_ENDPOINT: 'https://example.invalid/otlp' })).toBeNull();
  });
});

describe('requestMetrics', () => {
  const run = (req: Partial<Request>, statusCode: number) => {
    const record = vi.fn();
    const res = Object.assign(new EventEmitter(), { statusCode }) as unknown as Response;
    const next = vi.fn();
    requestMetrics({ record })(req as Request, res, next);
    res.emit('finish');
    expect(next).toHaveBeenCalledOnce();
    return record;
  };

  it('records the duration by route template, never by the real URL or record ids', () => {
    const record = run(
      {
        method: 'GET',
        baseUrl: '/api/v1',
        url: '/api/v1/teams/org_A/patients/patient-123',
        route: { path: '/teams/:teamId/patients/:patientId' },
        params: { teamId: 'org_A', patientId: 'patient-123' },
      } as unknown as Partial<Request>,
      200,
    );
    const [seconds, attributes] = record.mock.calls[0] as [number, Record<string, unknown>];
    expect(seconds).toBeGreaterThanOrEqual(0);
    expect(attributes).toEqual({
      'http.request.method': 'GET',
      'http.route': '/api/v1/teams/:teamId/patients/:patientId',
      'http.response.status_code': 200,
      'ips.team_id': 'org_A',
    });
    expect(JSON.stringify(attributes)).not.toContain('patient-123');
  });

  it('groups routes that matched nothing and omits the IPS when there is none', () => {
    const record = run({ method: 'GET', baseUrl: '', url: '/no-existe/secreto-9', params: {} } as Partial<Request>, 404);
    expect(record.mock.calls[0][1]).toEqual({
      'http.request.method': 'GET',
      'http.route': 'unmatched',
      'http.response.status_code': 404,
    });
  });
});
