import { describe, expect, it } from 'vitest';
import { requestLogProps, requestSerializer } from './request-log.js';

describe('requestSerializer', () => {
  it('keeps the id, method and URL with the query values hidden, and nothing else', () => {
    const logged = requestSerializer({
      id: 7,
      method: 'GET',
      url: '/api/v1/teams/org_A/patients?q=1000123456',
      params: { teamId: 'org_A' },
    });
    expect(logged).toEqual({ id: 7, method: 'GET', url: '/api/v1/teams/org_A/patients?q=***' });
    expect(JSON.stringify(logged)).not.toContain('1000123456');
  });
});

describe('requestLogProps', () => {
  it('adds the IPS of the route', () => {
    expect(requestLogProps({ params: { teamId: 'org_A', patientId: 'p-1' } })).toEqual({ teamId: 'org_A' });
  });

  it('adds nothing when the route has no IPS', () => {
    expect(requestLogProps({ params: {} })).toEqual({});
    expect(requestLogProps({})).toEqual({});
  });
});
