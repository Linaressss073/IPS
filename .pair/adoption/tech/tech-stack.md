# 🛠️ Technology Stack

## Purpose

This document defines the **validated technology stack decisions** for the project. It serves as the authoritative reference for all technology choices (version included) that have been proposed by AI and validated by the development team during the **Strategic Preparation** and **Strategic Initiatives** phases outlined in the [way-of-working.md](../../knowledge/way-of-working.md).

**Who modifies this:** Development team with AI assistance (🤖🤝👨‍💻)  
**When:** During Strategic Preparation phase and when technology decisions are made  
**Authority:** All technology choices must be documented here before implementation

## Current decisions

Only decisions recorded as ADR/ADL appear here. The base stack (NestJS, Next.js 15, MongoDB, Clerk, pnpm, GitHub Actions, SonarQube Cloud, Testcontainers, pino, Render) predates the ADR process and is **not yet recorded with versions**: record it with `/pair-capability-record-decision` when it is next touched.

| Area | Choice | Status | Decision |
|---|---|---|---|
| Frontend types from the API | `openapi-typescript` over a versioned `api/openapi.json` (`pnpm docs:json`, `pnpm api:types`) | In use | [ADR-001](adr/adr-001-openapi-contract-generated-types.md) |
| Prescription PDF | `pdf-lib` in a Next.js BFF route | In use | [ADR-002](adr/adr-002-bff-prescription-pdf.md) |
| Frontend unit tests | `vitest` (`pnpm test`, `lib/**/*.test.ts`) | In use | [ADR-002](adr/adr-002-bff-prescription-pdf.md) |
| Observability | OpenTelemetry (`@opentelemetry/sdk-node`) pushing OTLP to Grafana Cloud | **Planned** (Sprint 6, IPS-154 to 157) | [ADL 2026-11-04](../decision-log/2026-11-04-observability-otlp-push-grafana-cloud.md) |
