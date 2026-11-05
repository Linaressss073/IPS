# Architecture

## Purpose

This document contains the **validated architectural decisions** for the project. It serves as the authoritative reference for all architectural patterns, system boundaries, and design principles that have been proposed by AI and validated by the development team during the **Strategic Preparation** phase outlined in the [way-of-working.md](../../knowledge/way-of-working.md).

**Who modifies this:** Development team with AI assistance (🤖🤝👨‍💻) during Strategic Preparation  
**When:** During PRD creation, bounded context definition, and architectural decision processes  
**Authority:** All architectural implementations must follow these adopted standards

## Current decisions

Only decisions recorded as ADR/ADL appear here. The base architecture (bounded contexts in `api/src/contexts`, CQRS with NestJS, MongoDB with transactions, Clerk for identity, Render for deployment) predates the ADR process and is **not yet recorded**: record it with `/pair-capability-record-decision` when it is next touched.

- **API–frontend contract**: `api/openapi.json` is versioned and the frontend's types are generated from it; CI fails if they differ. See [ADR-001](adr/adr-001-openapi-contract-generated-types.md).
- **Prescription PDF**: a Next.js BFF route builds it with `pdf-lib` from `GET /consultations/:id/formula`. See [ADR-002](adr/adr-002-bff-prescription-pdf.md).
- **Permissions model**: `room:view` and role `tv`; IPS data admin-only; pharmacy limited to its own turns (other origins read as 404). See [ADR-003](adr/adr-003-permissions-model-room-tv-pharmacy.md).
- **Accepted exception**: pharmacy reads the diagnoses printed on the prescription. See [ADR-004](adr/adr-004-pharmacy-reads-printed-prescription-diagnoses.md).
- **Closed sets are domain unions, never `string`** (sex, statuses, roles, permissions) in views, documents and DTOs. See [ADL 2026-11-04](../decision-log/2026-11-04-api-views-domain-enums.md).
