// Builds the response schemas of the OpenAPI document from the controllers' return types, so the docs
// always list every field of every view. Writes src/docs/openapi-responses.generated.ts (committed;
// CI fails if `pnpm build` changes it).
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { createGenerator } from 'ts-json-schema-generator';
import ts from 'typescript';

const SRC = resolve('src');
const WORK = resolve('node_modules/.cache/openapi');
const HTTP = new Set(['Get', 'Post', 'Put', 'Patch', 'Delete']);
const posix = (p) => p.split(sep).join('/');

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

// 1. Return type of every HTTP route, as written in the controller.
const aliases = [];
for (const file of walk(SRC).filter((f) => f.endsWith('.controller.ts')).sort()) {
  const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const imports = new Map();
  for (const st of sf.statements) {
    const named = ts.isImportDeclaration(st) && st.importClause?.namedBindings;
    if (!named || !ts.isNamedImports(named) || !st.moduleSpecifier.text.startsWith('.')) continue;
    const target = resolve(dirname(file), st.moduleSpecifier.text.replace(/\.js$/, ''));
    for (const el of named.elements) imports.set(el.name.text, target);
  }
  for (const cls of sf.statements.filter((s) => ts.isClassDeclaration(s) && s.name)) {
    for (const m of cls.members) {
      const isRoute = ts.isMethodDeclaration(m) && ts.getDecorators(m)?.some((d) => ts.isCallExpression(d.expression) && HTTP.has(d.expression.expression.getText()));
      if (!isRoute || !m.type) continue;
      let type = m.type;
      if (ts.isTypeReferenceNode(type) && type.typeName.getText() === 'Promise' && type.typeArguments?.length === 1) type = type.typeArguments[0];
      const text = type.getText();
      if (text === 'void') continue;
      const key = `${cls.name.text}_${m.name.getText()}`;
      aliases.push({ key, id: `R_${key}`, text, imports });
    }
  }
}

// 2. A scratch module with one exported alias per route, so the generator can read them.
const lines = [];
const byModule = new Map();
for (const a of aliases) for (const word of new Set(a.text.match(/[A-Za-z_]\w*/g))) {
  if (a.imports.has(word)) (byModule.get(a.imports.get(word)) ?? byModule.set(a.imports.get(word), new Set()).get(a.imports.get(word))).add(word);
}
for (const [target, names] of [...byModule].sort()) {
  const rel = posix(relative(WORK, target));
  lines.push(`import type { ${[...names].sort().join(', ')} } from '${rel.startsWith('.') ? rel : `./${rel}`}.js';`);
}
// Wrapped in an interface because plain aliases of existing types are inlined, not emitted as definitions.
for (const a of aliases) lines.push(`export interface ${a.id} { value: ${a.text} }`);
mkdirSync(WORK, { recursive: true });
const scratch = join(WORK, 'response-types.ts');
writeFileSync(scratch, `${lines.join('\n')}\n`);

const generator = createGenerator({
  path: scratch, tsconfig: resolve('tsconfig.json'), type: '*', skipTypeCheck: true, expose: 'export', topRef: false, jsDoc: 'extended',
});
const defs = {};
const roots = {};
for (const a of aliases) {
  const { definitions, properties } = generator.createSchema(a.id);
  Object.assign(defs, definitions);
  roots[a.key] = properties.value;
}

// 3. JSON Schema (draft 7) -> OpenAPI 3.0 schema.
// Component names allow only letters, digits and . _ - (so Page<PatientView> becomes Page_PatientView).
const safe = (name) => name.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/_+$/, '');
const toOpenApi = (node) => {
  if (Array.isArray(node)) return node.map(toOpenApi);
  if (node === null || typeof node !== 'object') return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (k === '$schema' || k === 'definitions') continue;
    out[k] = k === '$ref' ? `#/components/schemas/${safe(decodeURIComponent(v.replace('#/definitions/', '')))}` : toOpenApi(v);
  }
  if (out.const !== undefined) { out.enum = [out.const]; out.type ??= typeof out.const; delete out.const; }
  if (Array.isArray(out.type)) {
    const rest = out.type.filter((t) => t !== 'null');
    if (rest.length !== out.type.length) out.nullable = true;
    if (rest.length === 1) out.type = rest[0];
    else { out.anyOf = rest.map((type) => ({ type })); delete out.type; }
  }
  if (Array.isArray(out.enum) && out.enum.includes(null)) { out.enum = out.enum.filter((e) => e !== null); out.nullable = true; }
  for (const k of ['anyOf', 'oneOf']) {
    if (!Array.isArray(out[k])) continue;
    const kept = out[k].filter((s) => !(s.type === 'null' && Object.keys(s).length === 1));
    if (kept.length === out[k].length) continue;
    out.nullable = true;
    if (kept.length === 1) { delete out[k]; Object.assign(out, kept[0]); } else out[k] = kept;
  }
  return out;
};
const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
const components = sorted(Object.fromEntries(Object.entries(defs).filter(([k]) => !k.startsWith('R_')).map(([k, v]) => [safe(k), toOpenApi(v)])));
const responses = sorted(Object.fromEntries(aliases.map((a) => [a.key, toOpenApi(roots[a.key])])));

writeFileSync(resolve('src/docs/openapi-responses.generated.ts'),
  `// GENERATED by scripts/generate-openapi.mjs (pnpm docs:generate). Do not edit by hand.\n/* eslint-disable */\n` +
  `export const COMPONENT_SCHEMAS: Record<string, object> = ${JSON.stringify(components, null, 2)};\n\n` +
  `/** Response body of each route, keyed by "<Controller>_<method>" (the OpenAPI operationId). */\n` +
  `export const RESPONSE_SCHEMAS: Record<string, object> = ${JSON.stringify(responses, null, 2)};\n`);
console.log(`openapi: ${aliases.length} respuestas, ${Object.keys(components).length} esquemas`);
