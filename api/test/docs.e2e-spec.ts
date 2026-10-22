import { createTestApp } from './support/test-app.js';

interface Operation {
  tags?: string[];
  security?: unknown[];
  responses: Record<string, { content?: Record<string, { schema: { properties?: Record<string, unknown> } }> }>;
}
interface Document {
  openapi: string;
  paths: Record<string, Record<string, Operation>>;
  components: { schemas: Record<string, { properties?: Record<string, unknown> }>; securitySchemes: Record<string, unknown> };
}

describe('OpenAPI docs (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let doc: Document;

  beforeAll(async () => {
    t = await createTestApp();
    doc = (await t.api().get('/docs-json').expect(200)).body as Document;
  });

  afterAll(async () => {
    await t?.app.close();
  });

  it('serves the interactive UI and the JSON document without a token', async () => {
    const ui = await t.api().get('/docs').expect(200);
    expect(ui.text).toContain('swagger-ui');
    expect(doc.openapi).toMatch(/^3\./);
  });

  it('documents every route under the /api/v1 prefix, grouped by module', () => {
    expect(Object.keys(doc.paths).every((path) => path.startsWith('/api/v1/'))).toBe(true);
    const tags = new Set(Object.values(doc.paths).flatMap((item) => Object.values(item).flatMap((op) => op.tags ?? [])));
    expect(tags).toEqual(
      expect.objectContaining(new Set(['patients', 'appointments', 'turns', 'consultations', 'pharmacy', 'staff', 'organizations'])),
    );
  });

  it('lists every field of a response, taken from the controller return type', () => {
    const patient = doc.components.schemas.PatientView;
    expect(Object.keys(patient.properties ?? {})).toEqual(
      expect.arrayContaining(['id', 'document', 'name', 'birthDate', 'sex', 'contact', 'affiliation', 'version']),
    );
    const get = doc.paths['/api/v1/teams/{teamId}/patients/{patientId}'].get;
    expect(get.responses['200'].content?.['application/json'].schema).toBeDefined();
  });

  it('asks for the bearer token everywhere except health and the Clerk webhook', () => {
    expect(doc.components.securitySchemes).toHaveProperty('bearer');
    expect(doc.paths['/api/v1/health'].get.security).toEqual([]);
    expect(doc.paths['/api/v1/webhooks/clerk'].post.security).toEqual([]);
    expect(doc.paths['/api/v1/teams/{teamId}/patients'].get.security).toBeUndefined();
  });

  it('describes the error body as the default response', () => {
    const op = doc.paths['/api/v1/teams/{teamId}/patients'].get;
    expect(op.responses).toHaveProperty('default');
    expect(doc.components.schemas.ErrorResponse.properties).toHaveProperty('code');
  });
});
