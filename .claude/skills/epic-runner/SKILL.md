---
name: epic-runner
description: Orchestrates an end-to-end scrum development workflow: epic creation with story outlines, story grooming, implementation planning, code implementation, testing, and review/ship. Use this skill whenever the user wants to start a new epic, create user stories, groom a story, generate an implementation plan, implement a story, test their work, or review and push code. Triggers on phrases like "start a new epic", "groom story N", "let's plan", "implement the story", "test this", "push and move on", "next story", "create stories for", or any reference to a scrum-like development workflow.
argument-hint: '[new-epic <topic> | resume [epic-N] | groom <N> | plan | implement | test | review | status]'
---

# Scrum Development Workflow

You are orchestrating a phased scrum development workflow.
Each phase has an approval gate — you STOP and wait for the user to approve before advancing.

## How to Use This Skill

Parse `$ARGUMENTS` to determine what the user wants. If no arguments are provided,
check for an active state file and present the current status.

### Entry Points

| Argument                         | Action                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `new-epic <topic>`               | Start Phase 1. Read [phase-1-epic-creation.md](references/phase-1-epic-creation.md).                               |
| `resume` or `resume epic-N`      | Find active epic, show status, ask how to proceed.                                                                 |
| `groom <N>` or `groom story <N>` | Enter Phase 2 for story N. Read [phase-2-story-grooming.md](references/phase-2-story-grooming.md).                 |
| `plan`                           | Enter Phase 3 for current story. Read [phase-3-implementation-plan.md](references/phase-3-implementation-plan.md). |
| `implement`                      | Enter Phase 4 for current story. Read [phase-4-code-implementation.md](references/phase-4-code-implementation.md). |
| `test`                           | Enter Phase 5 for current story. Read [phase-5-testing.md](references/phase-5-testing.md).                         |
| `review`                         | Enter Phase 6 for current story. Read [phase-6-review-and-ship.md](references/phase-6-review-and-ship.md).         |
| `status`                         | Show status summary for the active epic.                                                                           |
| _(no arguments)_                 | Read state file if one exists, show status. Otherwise ask what to do.                                              |

When entering a phase, always read the corresponding reference file for detailed instructions.

## State File

Every epic tracks its progress in `.epics/Epic-N/.scrum-state.json`. Read it at the start
of every invocation to understand where the user left off. For the schema, see
[state-schema.md](references/state-schema.md).

### Finding the Active Epic

When no epic number is specified:

1. Glob for `.epics/Epic-*/.scrum-state.json`
2. Read each state file
3. Find the one with the most recent `updated_at` that is not fully completed
4. Present it and confirm with the user

### Retroactive State Creation

If the user runs `resume` on an epic that has existing story/plan files but no state file:

1. Read all files in the epic directory
2. Infer story statuses: story file + plan file + code evidence = completed; story file only = in-progress; nothing = pending
3. Generate a state file and present the inferred status for user confirmation

## Phase Flow and Gates

```
Phase 1: Epic Creation
  └─ GATE: User reviews and approves story outlines (may reorder/split/merge)

Phase 2: Story Grooming (one story at a time)
  └─ GATE: User reviews and approves the story document

Phase 3: Implementation Planning
  └─ GATE: User reviews and approves the implementation plan JSON

Phase 4: Code Implementation
  └─ GATE: User confirms implementation is ready for testing

Phase 5: Manual Testing & Fixes
  └─ GATE: User confirms all checks pass

Phase 6: Review & Ship
  └─ GATE: User decides: request changes → loop back, or push and advance
       └─ If "next story": return to Phase 2 for the next pending story
       └─ If all stories done: epic complete
```

## Critical Rules

1. **STOP at every gate.** Present your output, then explicitly ask the user to approve,
   request changes, or give direction. Never auto-advance to the next phase.

2. **Update the state file** at every phase transition. The state file is the source of truth
   for resuming across sessions.

3. **Read the reference file** for whichever phase you are entering. The reference files
   contain the detailed instructions — this file is only the router.

4. **Respect existing conventions.** Stories follow the template in
   [phase-2-story-grooming.md](references/phase-2-story-grooming.md). Implementation
   plans use the JSON schema from
   [phase-3-implementation-plan.md](references/phase-3-implementation-plan.md). File
   naming follows existing patterns in the `.epics/` directory.

5. **One story at a time.** Never groom, plan, or implement multiple stories simultaneously.

6. **Mid-phase interruptions are fine.** If the user reports a bug or wants a quick fix during
   any phase, handle it. The state file tracks the current phase — you can return to it.
   Update the state file's `notes` field if context is needed for resuming.

## Status Summary Format

When showing status (on `resume`, `status`, or no-args), present:

```
Epic: [N] - [Title]
Current Story: [N] - [Title]
Current Phase: [Phase Name]
Stories: [completed/total]

Story Status:
  1. [Title] — completed
  2. [Title] — in-progress (grooming)
  3. [Title] — pending
  ...
```

Then ask: "How would you like to proceed?"

## Project Context

This repository is the IPS outpatient hospital information system (not a Launch77/Turborepo workspace).
These facts override any `/docs/launch77/`, `apps/<app-name>/`, `develop` branch or `npm` instruction in the
reference files:

- **Apps**: `api/` (NestJS + MongoDB, DDD + CQRS, bounded contexts under `api/src/contexts/`) and
  `multi-tenant-starter-template/` (Next.js + Clerk). Both use **pnpm**.
- **Docs to read**: `README.md`, `api/README.md` (ubiquitous language and bounded contexts),
  `multi-tenant-starter-template/README.md` and the endpoint reference in `technical-api/`. The pair knowledge
  base lives in `.pair/`.
- **Branches**: there is no `develop` branch. Create each story branch from `main` and open the PR against `main`.
- **Checks** (run in the app that changed): `pnpm lint`, `pnpm build`, `pnpm test`; in `api/` also
  `pnpm test:e2e` (needs Docker: `pnpm db:up`). Frontend type check: `npx tsc --noEmit`.
- The `.epics/` directory at the repo root holds the epic directories (`Epic-N`) with story documents and
  implementation plans.
