# Phase 3: Implementation Planning

## Prerequisites

Verify the story document exists and is approved (state file
`current_phase` should be `"planning"`).

## Step 1: Load Context

1. Read all documents under `/docs/launch77/`.
2. Read `apps/<app-name>/docs/README.md`.
3. Read the approved story document (path from state file).
4. Read the epic overview for design decisions and shared context.
5. Read ALL implementation plan JSONs from previously completed
   stories in this epic — check the state file `stories` array.
6. Read the actual source files listed in previous plans'
   `ui_changes`, `service_layer_changes`, `api_layer_changes`,
   and `data_model_changes`. See what was built, not just planned.

## Step 2: Pre-Flight Check

Before generating the plan, identify every architectural assumption
you are making that is not explicitly stated in the story document
or resolvable from the code you just read.

Present them to the user:

"Before I generate the plan, I want to confirm these assumptions:

1. [assumption]
2. [assumption]

Are these correct, or should I adjust any?"

Wait for confirmation. If the user corrects an assumption, note
the correction and proceed.

## Step 3: Generate the Plan

Output constraints — these are absolute:

- DO NOT generate any code.
- DO NOT include pseudocode.
- DO NOT include schema examples.
- DO NOT include implementation snippets.
- Output must be valid JSON only.
- No markdown. No commentary. Only JSON.

Save to the same directory as the story file.
Filename: `[story-filename-without-extension]_implementation_plan.json`

Schema:

{
"feature_name": "",
"summary": "",
"high_level_changes": [],
"data_model_changes": [],
"authorization_changes": [],
"api_layer_changes": [],
"service_layer_changes": [],
"repository_layer_changes": [],
"ui_changes": [],
"routing_changes": [],
"navigation_changes": [],
"state_management_changes": [],
"testing_changes": [],
"migration_requirements": [],
"risk_assessment": [],
"open_questions": []
}

Guidelines:

- Each array contains clear, atomic change statements.
- Each statement begins with an action verb.
- Be exhaustive — cover every change needed for all acceptance criteria.
- If a change touches multiple layers, list it in each relevant section.
- Reference specific file paths in every statement.
- Follow existing patterns — check adjacent modules before inventing new ones.
- List any remaining assumptions under `open_questions`.

## Step 4: AC Coverage Check

Before presenting the plan for approval, verify that every acceptance criterion in the
story document is covered by at least one entry in the plan.

Go through each AC one by one and identify which plan entry (or entries) address it.
Present the result as a coverage table:

```
AC Coverage:
  ✓ [AC text] → covered by: [plan entry or entries]
  ✗ [AC text] → NOT COVERED
```

If any AC is not covered, update the plan to add the missing entries before proceeding.
Do not present an uncovered plan for approval.

## Step 5: Approval Gate

After the coverage check passes, present a plain-language summary:

- High-level changes (bullet list)
- Data model and migration changes (called out explicitly)
- Risk assessment items
- Open questions requiring answers before implementation
- AC coverage table (from Step 4)

Ask: "Implementation plan saved. Review the summary and the JSON
file. Approve to start implementation, request changes, or answer
any open questions."

## Step 6: State File Update

After approval:

1. Update `plan_file` in the state file.
2. Set `current_phase` to `"implementing"`.
3. Update `updated_at`.
4. Tell the user: "Run `/epic-runner implement` to start coding."
