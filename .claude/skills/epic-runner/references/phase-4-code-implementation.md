# Phase 4: Code Implementation

Your job is to implement the code changes described in the approved implementation plan.
Work through the plan layer by layer, following the project's clean architecture pattern.

## Prerequisites

Verify that:

- The implementation plan JSON exists (check the state file for `plan_file`).
- The user approved the plan (current phase should be `"implementing"`).

## Step 1: Load Context

1. Read the implementation plan JSON from the state file path.
2. Read the story document for acceptance criteria and design decisions.
3. Read the epic overview for resolved design decisions.
4. Read the project documentation at `apps/<app-name>/docs/README.md`.
5. For each layer you're about to implement, read 1–2 adjacent existing files to match
   patterns. For example, before creating a new repository, read an existing repository
   in the same or similar module.

## Step 2: Create Feature Branch

**IMPORTANT**: This workflow requires a `develop` branch. Before creating the feature branch:

1. Run `git branch -r` to confirm `origin/develop` exists.
2. If it does **not** exist, **stop immediately**. Do not branch from `main`. Tell the user:

   > "This workflow requires a `develop` branch. None was found on the remote. Would you
   > like me to create one from `main`? I'll show you the exact commands before running
   > anything."

   If the user says yes, show the commands and wait for explicit confirmation before
   running each one:
   - `git checkout main && git pull origin main`
   - `git checkout -b develop`
   - `git push -u origin develop`

   Do not proceed past this point until `origin/develop` exists and the user confirms.

3. Once confirmed, create the feature branch from `develop`:

   > **Note:** Story and plan files written during Phase 2 and Phase 3 live in the working
   > directory and must be preserved across the branch switch. Stash them first, then restore
   > after the feature branch is created.

```
git stash
git checkout develop && git pull origin develop
git checkout -b feature/epic-N-story-N-kebab-title
git stash pop
```

Update the state file with the branch name.

## Step 3: Implement Layer by Layer

Follow this order. Each layer should be completed and verified before moving to the next.
This order respects dependencies — data models must exist before repositories can use them,
services before resolvers, and so on.

Work through each section of the implementation plan in dependency order — data models
before repositories, repositories before services, services before API layer, API before UI.

For each layer:

1. Read 1–2 adjacent existing files in the same module to match patterns.
2. Implement the changes described in the plan for that layer.
3. Follow the project's existing conventions for file organization, naming, exports, and imports.
4. Do not introduce new libraries, patterns, or architectural decisions not in the plan.

## Step 4: Verify Each Layer

After completing each layer (not just at the end):

- Run `npm run lint` to check for lint errors
- Fix any errors before moving to the next layer

After completing all layers:

- Run `npm run build` to verify the build succeeds (this also catches type errors)

## Step 5: Implementation Rules

These rules apply throughout:

- **Match existing code style.** Check adjacent files for formatting, naming, and import
  patterns before writing new code.
- **Use existing components before creating new ones.** Search the codebase first.
- **Follow the story's design decisions.** They are hard constraints, not suggestions.
- **Respect "Areas This Story Must Not Change"** — if the story document or implementation
  plan lists files or areas to avoid, do not touch them.
- **No gold-plating.** Implement what the plan says. Do not add features, refactor adjacent
  code, or "improve" things outside the plan's scope.

## Step 6: Progress Report

After completing implementation, present:

1. **Files created** — list with brief description of each
2. **Files modified** — list with summary of changes
3. **Decisions made** — any judgment calls during implementation
4. **Build status** — typecheck and lint results
5. **Migration status** — if any database changes were made

## Step 7: Approval Gate

Ask: "Implementation is complete. Ready to move to testing, or do you want to review
anything first?"

If the user wants to review specific files, show them. If they request changes, apply them
and re-verify.

## Step 8: State File Update

After the user confirms:

1. Set `current_phase` to `"testing"`.
2. Update `updated_at`.
3. Tell the user: "Ready for testing. Run `/epic-runner test` to start."
