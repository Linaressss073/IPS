import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { COMPONENT_SCHEMAS, RESPONSE_SCHEMAS } from '../docs/openapi-responses.generated.js';
import { API_PREFIX } from './http.js';

type Schema = NonNullable<NonNullable<OpenAPIObject['components']>['schemas']>[string];

const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
/** Routes that take no session token. */
const PUBLIC_ROUTES = ['/health', '/webhooks/clerk'];

/**
 * Routes whose declared return type is narrower than what they send. The pharmacy turn is issued by Admission and
 * returns its full TurnView, but Pharmacy only knows a minimal port type (a context never imports another's types).
 */
const RESPONSE_OVERRIDES: Record<string, Schema> = {
  PharmacyController_turn: { $ref: '#/components/schemas/TurnView' },
};

const ERROR_RESPONSE: Schema = {
  type: 'object',
  description: 'Error body. `code` is a machine-readable domain error (see technical-api/errors.md); shape errors have none.',
  required: ['statusCode', 'message'],
  properties: {
    statusCode: { type: 'integer', example: 409 },
    code: { type: 'string', example: 'DOCUMENT_ALREADY_REGISTERED' },
    message: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
    error: { type: 'string' },
  },
};

/**
 * Serves the OpenAPI document at `/api/v1/docs` (UI) and `/api/v1/docs-json`. Request bodies come from the
 * DTO classes (Nest swagger plugin, see nest-cli.json); response bodies from the controllers' return types
 * (`pnpm docs:generate`), so every field of every view is listed.
 */
export function setupOpenApi(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('IPS · API de la consulta externa')
    .setDescription(
      'Agendamiento, admisión, consulta médica y farmacia. Todas las rutas, salvo /health y el webhook de Clerk, ' +
        'exigen `Authorization: Bearer <token de sesión de Clerk>` y viven bajo `/teams/{teamId}` (la IPS).',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  enrich(document);
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'docs-json',
    customSiteTitle: 'IPS · API',
    swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha' },
  });
}

/** First segment after the prefix, skipping `teams/{teamId}`: /api/v1/teams/{teamId}/patients/... -> patients. */
const tagOf = (path: string): string => {
  const segments = path.split('/').filter(Boolean).slice(API_PREFIX.split('/').length);
  return (segments[0] === 'teams' ? segments[2] : segments[0]) ?? 'api';
};

function enrich(document: OpenAPIObject): void {
  document.components = {
    ...document.components,
    schemas: {
      ...document.components?.schemas,
      ...(COMPONENT_SCHEMAS as Record<string, Schema>),
      ErrorResponse: ERROR_RESPONSE,
    },
  };
  for (const [path, item] of Object.entries(document.paths)) {
    for (const method of METHODS) {
      const operation = item[method];
      if (!operation) continue;
      operation.tags = [tagOf(path)];
      if (PUBLIC_ROUTES.some((route) => path.endsWith(route))) operation.security = [];
      const id = operation.operationId ?? '';
      const schema = RESPONSE_OVERRIDES[id] ?? (RESPONSE_SCHEMAS[id] as Schema | undefined);
      const success = Object.entries(operation.responses).find(([status]) => status.startsWith('2'));
      if (schema && success?.[1]) Object.assign(success[1], { content: { 'application/json': { schema } } });
      operation.responses.default = {
        description: 'Error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      };
    }
  }
}
