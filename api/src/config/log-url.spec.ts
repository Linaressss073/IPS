import { describe, expect, it } from 'vitest';
import { logUrl } from './log-url.js';

describe('logUrl', () => {
  it('hides the values of the query string, keeping its keys', () => {
    expect(logUrl('/api/v1/teams/org_A/patients?q=Andr%C3%A9s%20G%C3%B3mez&page=2')).toBe(
      '/api/v1/teams/org_A/patients?q=***&page=***',
    );
    expect(logUrl('/api/v1/teams/org_A/patients?q=1000123456')).not.toContain('1000123456');
  });

  it('leaves URLs without a query untouched', () => {
    expect(logUrl('/api/v1/teams/org_A/turns')).toBe('/api/v1/teams/org_A/turns');
    expect(logUrl()).toBe('');
  });

  it('drops an empty query string', () => {
    expect(logUrl('/api/v1/turns?')).toBe('/api/v1/turns');
  });
});
