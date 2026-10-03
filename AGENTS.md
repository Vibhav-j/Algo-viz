# AGENTS.md

Project: algo-viz, an interactive DSA visualizer. Full context is in `PLAN.md`. Read it before starting any task.

## Workflow
- Work on **one task at a time** from `PLAN.md` section 10. Stop and wait for review when it is done.
- Make small, atomic changes. One logical change per commit.
- Before editing, state a short plan (files to touch, tests to add).
- Respect the division of labor in `PLAN.md` section 9. Do not write human-owned files unless explicitly asked.

## Git
- Commits: Conventional Commits, `type(scope): imperative summary`.
- Never commit to `main`. Work on the current feature branch.
- Never run `git push`, `git reset --hard`, `git clean`, `git rebase`, or `rm -rf`. Propose the command and wait for approval.
- Never use `--no-verify`. If a hook fails, fix the cause.
- Do not commit generated files, `node_modules`, `dist`, or secrets.

## Architecture rules
- Algorithms are generators that only `yield` events. They never import rendering or UI code.
- The Player is domain-agnostic (`apply` / `undo` only). Do not add sorting-specific logic to it.
- State-mutating events must be exactly invertible. Transient highlights (`compare`, `pivot`) are derived by the renderer from the current event, never stored in state.
- No graph or pathfinding code in v0.1. No backend, database, or ML.

## Quality bar
- TypeScript strict; no `any` without a justifying comment.
- Every algorithm change ships with tests (replay yields a sorted permutation; property tests via fast-check).
- `npm run typecheck`, `npm run lint`, and `npm test` must pass before you declare a task done.
- Keep diffs minimal; do not reformat or refactor unrelated files.
