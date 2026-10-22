import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { COMPONENT_SCHEMAS, RESPONSE_SCHEMAS } from '../docs/openapi-responses.generated.js';
import { API_PREFIX } from './http.js';

type Schema = NonNullable<NonNullable<OpenAPIObject['components']>['schemas']>[string];

/**
 * Swagger UI only: once the "team" value is set in Authorize, every request replaces the id in
 * /teams/{id}/... and /organizations/{id} with it, so the IPS is typed once. The API ignores the X-Team-Id header.
 */
const TEAM_FILL_SCRIPT = `
(function () {
  var timer = setInterval(function () {
    var ui = window.ui;
    if (!ui || !ui.getConfigs) return;
    clearInterval(timer);
    var configs = ui.getConfigs();
    var previous = configs.requestInterceptor;
    configs.requestInterceptor = function (request) {
      var team = ui.authSelectors.authorized().getIn(['team', 'value']);
      if (team) request.url = request.url.replace(new RegExp('(/(?:teams|organizations)/)[^/?#]+'), '$1' + encodeURIComponent(team));
      return previous ? previous(request) : request;
    };
  }, 100);
})();
`;

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
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token de sesión de Clerk, sin la palabra Bearer.' },
      'bearer',
    )
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'X-Team-Id', description: 'Id de la IPS (org_…). Rellena {teamId} en todas las rutas; la API no lo lee.' },
      'team',
    )
    .addSecurityRequirements({ bearer: [], team: [] })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  enrich(document);
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'docs-json',
    customSiteTitle: 'IPS · API',
    customJsStr: TEAM_FILL_SCRIPT,
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
      // The controllers read the IPS with @CurrentTeam(), which Nest swagger does not see: declare it here.
      if (path.includes('{teamId}') && !operation.parameters?.some((p) => 'name' in p && p.in === 'path' && p.name === 'teamId')) {
        (operation.parameters ??= []).unshift({
          name: 'teamId',
          in: 'path',
          required: true,
          description: 'Id de la IPS (organización de Clerk). Con el auth "team" de Authorize se rellena solo.',
          schema: { type: 'string' },
          example: 'org_2abc…',
        });
      }
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
