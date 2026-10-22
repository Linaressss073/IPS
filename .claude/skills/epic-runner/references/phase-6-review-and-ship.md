# Phase 6: Review & Ship

Your job is to present a final summary of the completed work, handle any last change
requests, and then commit, push, and advance to the next story.

## Step 1: Final Summary

Present a comprehensive summary:

### Story Recap

One paragraph: what was delivered, which user flows were affected, what the user can
now do that they couldn't before.

### Files Changed

Categorized list:

- **New files**: path and brief description
- **Modified files**: path and summary of changes
- **Deleted files**: path and why (if any)

### Key Decisions

Any implementation decisions or judgment calls made during coding that the user should
know about. If none, say "No notable decisions — implementation followed the plan as written."

### Test Results

Summary from Phase 5: build status, test results, which verification steps passed.

## Step 2: User Review

Ask: "Please review the implementation. You can:

1. **Request changes** — describe what needs to change and I'll fix it
2. **Approve and ship** — I'll commit, push, and we can move to the next story"

### If Changes Requested

1. Apply the requested changes.
2. Re-run affected checks from Phase 5 (typecheck, lint, build at minimum).
3. Present the changes and ask for review again.
4. Repeat until approved.

### If Approved — Commit and Push

Work through each step below one at a time. Do not proceed to the next step until the
user explicitly confirms. If the user says stop at any point, stop immediately.

**Step A — Verify branch**

Run `git status` and `git branch --show-current`. Present the output to the user:

```
Current branch: [branch name]
State file branch: [branch from state file]
```

If they don't match, stop and flag it. Ask the user how to proceed before touching
anything else.

Ask: "Confirmed you're on the right branch. Ready to review staged files?"

**Step B — Review what will be staged**

Run `git diff --stat HEAD` to show every changed file and a line-count summary.
Present the full list. Explicitly call out any files that look unrelated to this story.

Ask: "These are the files that changed. Should I stage all of them, or are there any
you want to exclude?"

Wait for the user's answer. Stage only the files the user confirms — add them by name,
never `git add -A` or `git add .`.

**Step C — Confirm commit message**

Propose a commit message following the project's style:

```
feat(epic-N/story-N): brief description of what was delivered
```

Ask: "Here's the proposed commit message. Approve it or give me a replacement."

Wait for approval. Do not commit until the user confirms the message.

**Step D — Commit**

Run the commit with the approved message. Show the output. Confirm it succeeded.

Ask: "Commit created. Ready to push to origin?"

**Step E — Push**

Run `git push -u origin [branch-name]`. Show the output.

**Step F — PR**

Do not create a PR automatically. Instead, print a ready-to-use PR description the
user can paste into GitHub or use with `gh pr create`:

```
Title: [commit message subject line]

Body:
## Summary
[story recap — what was delivered, which flows are affected]

## Acceptance Criteria
- [ ] [each criterion from the story doc]

## Test Results
[build status, verification steps that passed]
```

Tell the user: "Branch is pushed. Here's a PR description you can use — just run
`gh pr create` or open a PR on GitHub."

## Step 3: Advance to Next Story

After pushing:

1. Update the state file:
   - Set current story's `status` to `"completed"` with `completed_at` timestamp.
   - Find the next story with status `"pending"`.
   - Set `current_story` to the next story's number.
   - Set `current_phase` to `"grooming"`.
   - Update `updated_at`.

2. Present the status summary:

   ```
   Story N: [Title] — completed
   Stories: [completed/total]

   Next up: Story M — [Title]
   ```

3. Ask: "Before we move on — anything from this story worth capturing? For example:
   a design decision that turned out wrong, something that took longer than expected,
   or a convention we should carry into the next story. If yes, I'll update the epic's
   Resolved Design Decisions table."

   If the user shares something, update `.epics/Epic-N/epic-overview.md` to add or
   amend the relevant row in the Resolved Design Decisions table before advancing.

4. Ask: "Ready to groom Story M? Run `/epic-runner groom M` when you're ready."

### If All Stories Are Complete

If there are no more pending stories:

1. Update the state file:
   - Set `current_phase` to `"completed"`.
   - Update `updated_at`.

2. Present:

   ```
   All stories in Epic N are complete!

   Epic: [N] - [Title]
   Stories completed: [total]

   Summary of what was delivered:
   - Story 1: [Title] — [one-line summary]
   - Story 2: [Title] — [one-line summary]
   ...
   ```

3. Ask: "Anything from this epic worth capturing before we close it out? For example:
   decisions that turned out wrong, patterns to carry forward, or things to do
   differently next time."

   If the user shares something, update the epic overview's Resolved Design Decisions
   table accordingly.

4. Congratulate the user and ask if they want to start a new epic.
