# Phase 2: Story Grooming

Your job is to produce a story document that captures what to build and why — at the
product level. The audience is a human reviewer who will approve it before any technical
work begins. This is Step 1 of a two-step pipeline; the implementation plan (Phase 3)
handles all technical decisions.

## The Product Owner Test

Before writing any line of the story document, apply this test:

> "Could a Product Owner who has never seen the codebase have written this line?"

If the answer is no — it contains component names, file paths, prop signatures, CSS classes,
hook names, query names, or any other implementation detail — it does not belong in the
story document.

**Where technical findings go instead:**

- You read the code to know what _questions_ to ask the human — not to populate sections.
- If a technical conflict has product-level consequences (e.g., "two pages currently behave
  differently — which behavior should win?"), surface it as a plain-language question.
- If a technical conflict has no product-level consequence (e.g., which component pattern
  to follow), flag it in Open Questions as input for Phase 3.
- The human reviewer is the decision point between phases. Your output gives them what
  they need to make product decisions — not engineering decisions.

## Step 1: Load Context

Read these files from the state file and epic overview:

1. The epic overview file (`.epics/Epic-N/epic-overview.md`).
2. Every file listed under "Shared Context" in the epic overview.
3. The story documents and implementation plan JSONs for all previously completed stories
   in this epic (check the state file's `stories` array for file paths).
4. The actual source files that previous implementation plans listed under `ui_changes`,
   `service_layer_changes`, and `api_layer_changes`. You need to see what was actually
   built, not just what was planned.

## Step 2: Analyze

Read the code to answer these questions internally. Your answers inform what you ask
the human — they do not populate the story document.

1. Does the story outline in the epic conflict with anything you found in the code
   or in the epic's Resolved Design Decisions?
2. Does the previous story's implementation reveal anything that changes the scope
   or feasibility of this story?
3. Are there user-facing behaviors this story implies that the outline doesn't address?
   (loading states, empty states, error states, edge cases, permission boundaries)
4. Is this story a vertical slice? It must deliver user-observable behavior end-to-end
   (UI → logic → data). If the outline describes only one technical layer (e.g. schema
   migration, helper functions, API endpoints with no UI) it is NOT a valid story —
   flag it and propose merging it into the story that surfaces that behavior to users.
5. Does it leave the app in a coherent, shippable state? A QA tester must be able to
   exercise a real user flow through this feature without needing a later story first.
6. Is the scope large enough to warrant splitting? Assess by user impact surface —
   how many distinct user flows does this story change? — not by file count.

**Critical rule:** Do not carry technical findings into the story document.
Translate them first:

- A naming conflict → a plain-language Open Question for Phase 3.
- A missing behavior → a question for the human in Step 3.
- An existing pattern to follow → omit from the document entirely.
  Phase 3 will discover it by reading the code.

## Step 3: Interview

Present your findings in two parts:

**What I can resolve from the code (no answer needed):**
List each ambiguity you resolved yourself and what you found. This shows your reasoning
and lets the user correct wrong assumptions.

**What I need from you:**
Ask only the questions you genuinely cannot answer from the code. Maximum 5 questions.
If you have more than 5, prioritize the ones that would most change the scope or
structure of the story.

Do not produce the story document yet. Wait for answers.

## Step 4: Produce the Story Document

After receiving answers, produce the story document. Save it to the epic directory.
Filename: `STORY-[N]-[kebab-case-title].md`

Before writing any section, write the user story statement as a blockquote immediately
after the title: `> As a [user type], I want [goal] so that [reason].`
If you cannot write it cleanly in one sentence, that is a signal the story's purpose
isn't clear enough — resolve it before proceeding.

Use this exact structure:

```markdown
# Story [N]: [Title]

> As a [user type], I want [goal] so that [reason].

## Status

Ready for implementation

## Deployment Safety

[Does this story require a feature flag to be safely deployed to production before
all stories in the epic are complete? Answer yes or no, and briefly explain why.
Example: "No — the new flow is only reachable via a new route that doesn't exist yet."
Example: "Yes — this modifies the existing sign-in page, which is live for all users.
A feature flag is needed to gate the new behavior until Story 4 is complete."]

## Context

[2-3 sentences. Self-contained — written as if the reader has never seen the epic.
What exists today, what problem this solves, what it delivers.
No component names, no file paths.]

## Deliverability

[Will the app be in a coherent, fully working state after this story merges?
If any existing flow will be degraded, broken, or incomplete — even temporarily —
state it explicitly here as a conscious decision. If everything is clean, say so.]

## Scope

### In scope

[Explicit list of what this story delivers]

### Out of scope

[Explicit list of what is NOT this story — especially things a developer might
reasonably assume are included. Name specific features and pages that are
intentionally untouched.]

## Acceptance Criteria

- [ ] [User-observable outcomes only. No implementation detail. Each criterion
      should be verifiable by a human clicking through the app.]

## Error States & Empty States

[For every piece of UI this story introduces or modifies: what does the user see
when data is loading, when a query fails, and when a list or result set is empty?
These are product decisions, not implementation details. If a state is explicitly
out of scope, say so — do not leave it blank.]

## Design Decisions

[Decisions resolved during this grooming session.
The implementation phase treats these as hard constraints, not suggestions.]

| Decision | Resolution |
| -------- | ---------- |

## Epic Decisions That Apply Here

[Only the rows from the epic's Resolved Design Decisions table that are directly
relevant to this story. Do not paste the full table.]

| Decision | Resolution |
| -------- | ---------- |

## Consistency Requirements

[Only if a previous story exists. State the user-facing consistency requirements
this story must honor — in plain language a product owner would write.
Example: "The org-admin workspace must feel visually and behaviorally consistent
with the FG workspace built in Story 1 — same header height, same sidebar behavior,
same mobile navigation patterns."
No component names. No CSS. No prop signatures.
If no prior story exists, omit this section entirely.]

## Areas This Story Changes

[Name the product surfaces this story touches — pages, flows, and user-facing
behaviors. Not file paths. Not components.
Example: "The My Organizations page", "The organization sidebar".]

## Areas This Story Must Not Change

[Product surfaces that belong to a later story and must be left alone.
Name the user-facing surface and which story owns it.
Example: "The profile menu — Story 7 replaces it entirely."]

## Definition of Done

- [ ] All acceptance criteria above are met
- [ ] No new errors or warnings appear in the browser console
- [ ] All previously working flows still work
- [ ] [Any story-specific completion conditions — stated in plain language]

## Verification Steps

[The manual click-through a human should perform after implementation to confirm
the story is done. 4-8 steps maximum. Written as if handing to a QA tester who
has never seen the codebase — no component names, no technical jargon.]

1. [Step]
2. [Step]

## Open Questions

[Two kinds of open questions belong here:

1. **Product questions** — things the human reviewer needs to decide before
   implementation begins. These block the implementation plan.

2. **Technical questions** — conflicts or ambiguities found in the code that
   have no product-level consequence. Label these clearly as
   "For implementation plan:" so the human knows they don't need to answer them.

If there are no open questions, state:
"None — all questions were resolved during grooming."]
```

## Step 5: Approval Gate

After producing the story document, present it to the user and ask:

1. "Please review the story document."
2. "Approve it to move to implementation planning, request changes, or ask questions."

If changes are requested, revise and re-present. Do not advance until approved.

## Step 6: State File Update

After approval:

1. Update the story's `story_file` field in the state file.
2. Set the story's `status` to `"in-progress"`.
3. Set `current_phase` to `"planning"`.
4. Update `updated_at`.
5. Tell the user: "Story document approved. Run `/epic-runner plan` to generate the implementation plan."
