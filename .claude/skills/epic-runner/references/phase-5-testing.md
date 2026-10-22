# Phase 5: Manual Testing & Fixes

Your job is to systematically verify the implementation against the story's acceptance
criteria, verification steps, and definition of done — and fix any issues found.

## Prerequisites

Read these from the state file paths:

- The story document — for Acceptance Criteria, Verification Steps, and Definition of Done.
- The implementation plan — for `testing_changes` items.

## Step 1: Build Verification

Run these checks and report results:

1. **TypeScript**: `npm run typecheck` — no type errors
2. **Lint**: `npm run lint` — no lint errors
3. **Build**: `npm run build` — build succeeds with no errors

If any fail, fix the issues immediately and re-run until all pass.

## Step 2: Automated Tests

If the project has automated tests:

1. Run the test suite: `npm test` (or equivalent)
2. Report results: how many passed, how many failed
3. If any tests fail, determine if the failure is:
   - A regression caused by this story → fix it
   - A pre-existing failure → note it but do not fix it (out of scope)

## Step 3: Manual Verification Steps

Walk through each Verification Step from the story document. For each step:

1. Describe what you're checking
2. Describe how you're verifying it (what commands to run, what to look for)
3. Report: PASS or FAIL
4. If FAIL: describe the issue, fix it, re-verify, and confirm the fix

If verification steps involve UI interactions that can't be automated (clicking through
the app in a browser), describe what you checked in the code and what the user should
verify manually. Be specific about what to look for.

## Step 4: Acceptance Criteria Check

Go through each acceptance criterion from the story document:

```
Acceptance Criteria:
  - [ ] [Criterion text] — PASS / FAIL (explanation)
  - [ ] [Criterion text] — PASS / FAIL (explanation)
```

For each criterion, explain how you verified it. If it requires manual browser testing,
tell the user what to check and where.

## Step 5: Definition of Done Check

Go through each item in the Definition of Done:

```
Definition of Done:
  - [ ] All acceptance criteria above are met — PASS / FAIL
  - [ ] No new errors or warnings in browser console — [explain how verified]
  - [ ] All previously working flows still work — [explain how verified]
  - [ ] [Story-specific items] — PASS / FAIL
```

## Step 5b: Regression Smoke Test

Based on the "Areas This Story Changes" section of the story document, identify the
adjacent flows most likely to have been accidentally affected by this story's changes.

List them explicitly and tell the user what to check for each:

```
Regression smoke test (flows adjacent to this story's changes):
  - [flow name] — [what to verify]
  - [flow name] — [what to verify]
```

Do not check off "All previously working flows still work" in the Definition of Done
until the user confirms each of these flows still works correctly.

## Step 6: Fix Cycle

If any checks fail:

1. Fix the issue
2. Re-run the specific failing check
3. Verify the fix didn't break anything else (re-run typecheck and lint at minimum)
4. Continue until all checks pass

## Step 7: Test Report

Present a summary:

```
Build Verification:
  TypeScript:  PASS/FAIL
  Lint:        PASS/FAIL
  Build:       PASS/FAIL
  Tests:       PASS/FAIL (N passed, N failed)

Verification Steps:
  1. [Step summary] — PASS/FAIL
  2. [Step summary] — PASS/FAIL
  ...

Acceptance Criteria: N/N passed

Definition of Done: N/N passed

Issues Found and Fixed:
  - [description of each fix applied]

Manual Checks for User:
  - [anything the user needs to verify in the browser]
```

## Step 8: Approval Gate

Ask: "All automated checks pass. Here's what you should verify manually in the browser:
[list]. Once you've confirmed, let me know and we'll move to final review."

If the user reports issues from their manual testing, fix them and re-run affected checks.

## Step 9: State File Update

After the user confirms all tests pass:

1. Set `current_phase` to `"review"`.
2. Update `updated_at`.
3. Tell the user: "Testing complete. Run `/epic-runner review` for final review and shipping."
