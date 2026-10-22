# Phase 1: Epic Creation

Your goal is to help the user define a new epic with a structured overview and brief story
outlines. The outlines should be short enough (2–4 sentences each) that the user can quickly
review and reorder them before investing in detailed grooming.

## Step 1: Context Loading

Before interviewing the user, build your understanding of the project:

1. Read all docs under `/docs/launch77/` to understand platform conventions.
2. Read app documentation at `apps/<app-name>/docs/README.md`.
3. Scan existing epics (`.epics/Epic-*/epic-overview.md`) to understand:
   - What epic numbers have been used
   - What has already been built
   - What conventions the epic documents follow
4. Read the codebase structure to understand current application state:
   - Route structure under `src/app/`
   - Module structure under `src/modules/`
   - Existing components under `src/components/`

## Step 2: User Interview

The user provided a topic when invoking `/epic-runner new-epic <topic>`. Use that as your
starting point, then ask clarifying questions. Keep it to a maximum of 5 questions focused on:

- What problem does this epic solve? Who benefits?
- What does "done" look like — what can users do after all stories are shipped?
- Are there dependencies on existing features or in-progress epics?
- Are there design constraints or decisions already made?
- What is explicitly out of scope?

Present what you already understand from the codebase alongside your questions, so the user
only needs to fill in gaps rather than repeat what the code already tells you.

## Step 3: Create the Epic Overview

Create `.epics/Epic-N/epic-overview.md` where N is the next available epic number.

Follow the exact structure established by existing epics:

```markdown
# Epic N: [Title]

## Goal

[2-3 paragraphs describing what this epic delivers and why it matters]

## Reference Documents

[Links to relevant docs, PRDs, or design files — if any]

## Resolved Design Decisions

[Decisions made during this planning session. These are hard constraints for all stories.]

| Decision | Resolution |
| -------- | ---------- |

## Story Order

[Numbered list of stories with brief descriptions and dependency notes]

### Story 1: [Title]

**Priority**: [Why this is first]
[2-4 sentence description of what this story delivers]
**Dependencies**: [None, or which stories it depends on]

### Story 2: [Title]

...

## Shared Context for Story Detailing

[List of key existing files that Claude should reference when grooming individual stories.
Group by category: components being replaced, layout components, route layouts,
existing reusable pieces, GraphQL queries, auth/session info, etc.]
```

### Story Outline Rules

- Each story gets 2–4 sentences only — enough to understand scope, not enough to implement.
- Stories must be vertical slices — each one spans from UI to data layer and delivers
  a user-observable behavior that can be manually tested end-to-end. A story that only
  touches one layer (e.g. "add DB migration", "write helper functions") is NOT a valid
  story — merge it into the story that uses it.
- Each story must be independently testable: a QA tester should be able to exercise a
  real user flow through the feature without needing a subsequent story to be complete.
- Each story must leave the app in a coherent, shippable state — no broken flows, no
  dead-end UI that leads nowhere.
- Note dependencies between stories explicitly.
- Order for incremental delivery — thinnest slice of working user value first, then
  expand scope story by story.
- A story is too big if it would reasonably take more than one focused coding session
  to implement. If you suspect that's the case, propose splitting it — describe where
  the natural seam is and what each half would deliver independently.
- Include a cleanup/polish story at the end if the epic involves refactoring.

### Shared Context Section

This section is critical — it tells the grooming phase (Phase 2) which files to read for
context. Be thorough. Include:

- Components being created, replaced, or refactored
- Route layouts affected
- Existing reusable pieces (UI primitives, utilities, GraphQL queries)
- Auth/session shape relevant to this epic
- Authorization policies involved

## Step 4: Approval Gate

Present the epic overview to the user. Explicitly ask:

1. "Does the story order look right? Want to reorder any?"
2. "Should any stories be split or merged?"
3. "Are the design decisions correct?"
4. "Anything missing from scope?"
5. "Ready to start grooming Story 1?"

Do NOT proceed until the user approves. If they request changes, revise and re-present.

## Step 5: State File

After the user approves the epic overview:

1. Create `.epics/Epic-N/.scrum-state.json` with:
   - All stories listed with status `"pending"`
   - `current_story`: 1
   - `current_phase`: `"grooming"` (ready for the user to start grooming)
2. Tell the user: "Epic N is set up. Run `/epic-runner groom 1` when you're ready to detail the first story."
