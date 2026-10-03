# algo-viz: Project Plan

> Read `AGENTS.md` first (hard rules), then this file. Work one task at a time from section 10.

## 1. Goal

An interactive, visually polished DSA visualizer that makes algorithms *intuitive* for students (CS freshmen and interview-prep learners).

**Guiding principle:** every frame should answer "what does the algorithm know right now, and why is this step justified?" Animation alone is not enough; show invariants, costs, and failure cases.

Secondary goal: a deployed, well-engineered portfolio project with a clean git history.

## 2. Scope

| Stage | Content |
|---|---|
| **v0.1 (current)** | Sorting only: bubble, insertion, selection, merge, quick (Lomuto + Hoare), heap |
| v0.2 | Pathfinding on a grid: BFS, Dijkstra, A*, greedy best-first, built as one unified search function (Dijkstra = A* with h = 0) |
| v0.3 | Race mode: two algorithms on identical input, synchronized, live counters |
| v0.4+ | Pseudocode pane, narration, predict-then-reveal mode, empirical complexity plots, sonification, D* Lite (incremental replanning vs. A* recompute) |

**Non-goals:** backend, accounts, databases, blockchain, ML. Do not add them.

Build order is strict: finish v0.1 completely before starting graphs. Only the *abstractions* (section 4) are designed for later stages; no graph code in v0.1.

## 3. Stack (proposed defaults)

TypeScript (strict), Vite, Canvas 2D for rendering, Vitest + fast-check (property tests), ESLint + Prettier, commitlint + husky + lint-staged, GitHub Actions CI, GitHub Pages deploy. Minimal UI framework; plain DOM controls are fine.

## 4. Architecture

```
Algorithm (generator) -> Trace (Event[]) -> Player (cursor, undo) -> Renderer (Canvas)
```

**Rules**

1. Algorithms never import rendering/UI code. They only `yield` events.
2. The `Player` is domain-agnostic. It knows only `apply` / `undo`.
3. Every state-mutating event is exactly invertible (swap is self-inverse; `set` carries `prev`). Rewind applies inverses; do not snapshot full state per step.
4. Transient highlights (`compare`, `pivot`) are **not state**. The renderer derives them from `player.current` (the last applied event). They need no inverse.
5. The generator is drained eagerly into `Event[]`. The UI caps array size at n <= 500 so O(n^2) algorithms stay bounded.

```ts
// src/core/domain.ts
export interface Domain<S, E> {
  apply(s: S, e: E): void;
  undo(s: S, e: E): void; // exact inverse of apply
}

// src/core/player.ts
export class Player<S, E> {
  private i = 0; // number of events applied
  constructor(readonly s: S, readonly trace: E[], private d: Domain<S, E>) {}
  get cursor() { return this.i; }
  get current(): E | undefined { return this.trace[this.i - 1]; }
  step() { if (this.i < this.trace.length) this.d.apply(this.s, this.trace[this.i++]); }
  back() { if (this.i > 0) this.d.undo(this.s, this.trace[--this.i]); }
  seek(k: number) { while (this.i < k) this.step(); while (this.i > k) this.back(); }
}
```

**Sorting domain**

```ts
// src/sort/events.ts
type Meta = { why?: string; line?: number }; // optional now; used by narration / pseudocode later
export type SortEvent = Meta & (
  | { t: 'compare'; i: number; j: number }                 // transient
  | { t: 'pivot'; i: number }                              // transient
  | { t: 'swap'; i: number; j: number }                    // self-inverse
  | { t: 'set'; i: number; v: number; prev: number }       // write (merge/partition buffers)
  | { t: 'markSorted'; i: number; was: boolean }           // invertible region annotation
  | { t: 'done' }
);
export interface SortState { a: number[]; sorted: boolean[] }
```

Algorithms are generators: `function* bubbleSort(a: number[]): Generator<SortEvent>`. They operate on a **copy** and emit events; the Player owns the displayed state.

## 5. Visual language

- One fixed state palette used by every algorithm: **default, comparing, swapping/writing, pivot, sorted**. Define as design tokens in `src/render/palette.ts`.
- Colorblind-safe palette (e.g. Okabe-Ito). Never rely on hue alone: add outline or shape redundancy.
- Dark theme default, high contrast, monospace for values/code, one sans-serif for UI. Restrained, minimal chrome; the canvas dominates.
- Swaps animate with 150-300 ms ease-in-out tweens so elements visibly *move*.
- Always-visible counters: comparisons, writes, step index / total.

## 6. Repository layout

```
src/
  core/      domain.ts  player.ts  trace.ts (drain generator -> Event[])
  sort/      events.ts  domain.ts  bubble.ts insertion.ts selection.ts merge.ts quick.ts heap.ts  presets.ts
  render/    palette.ts  barRenderer.ts
  ui/        controls.ts  main.ts
tests/
  core/      player.test.ts
  sort/      invariants.test.ts
AGENTS.md  PLAN.md  README.md
```

## 7. Testing requirements

- `Player`: apply then undo is identity; `seek(k)` equals k sequential steps from the start; seek forward then back returns the initial state.
- Every sort x every preset (random, sorted, reversed, few-unique, size 0/1/2): replaying the full trace yields a sorted **permutation** of the input.
- Property tests (fast-check) over random arrays for all algorithms.
- Trace-level invariants where cheap (e.g. selection sort emits at most n-1 swaps; insertion sort on sorted input emits n-1 compares).

## 8. Git workflow

- **Conventional Commits:** `type(scope): imperative summary`. Types: feat, fix, refactor, test, docs, chore, perf, build, ci. Scopes: core, sort, render, ui, ci.
- One logical change per commit; every commit builds and passes tests.
- Branch per task: `feat/<short-name>`. Never commit to `main` directly. Merge by PR (squash or no-ff). Tag phase releases: `v0.1.0`, `v0.2.0`.
- Commit body when the *why* is non-obvious.
- Hooks (commitlint, lint-staged) and CI must pass; do not bypass with `--no-verify`.

## 9. Division of labor

- **Human-owned (user writes these):** `Domain`, `Player`, event types, and the sorting generators. This is the learning core. The agent may review, test, or explain them but should not author them unless asked.
- **Agent-owned:** tooling/config (Vite, ESLint, commitlint, husky, CI), Canvas renderer, controls UI, test scaffolding, README, deploy workflow.
- Agent output is reviewed like a junior's PR. Any coupling of algorithms to rendering is a defect.

## 10. Task queue (v0.1)

Each task = one branch, one or a few atomic commits. Stop after each task and wait for review.

| # | Task | Owner | Acceptance |
|---|---|---|---|
| T0 | Repo scaffold: Vite + strict TS, `.gitignore`, ESLint/Prettier, Vitest, `npm test` | Agent | `npm run build` and `npm test` pass on empty project |
| T1 | commitlint + husky + lint-staged; GitHub Actions (typecheck, lint, test) | Agent | Bad commit message rejected locally; CI green on push |
| T2 | `Domain`, `Player`, `drain(generator)` + Player tests | Human (agent reviews) | Section 7 Player tests pass |
| T3 | `SortEvent`, `SortState`, `sortDomain`, bubble sort + invariant test | Human | Replay yields sorted permutation |
| T4 | Palette tokens + bar renderer (derives highlights from `player.current`) | Agent | Renders any `SortState` + current event; no algorithm imports |
| T5 | Controls: play/pause/step/back/scrub/speed; counters | Agent | Rewind works at any cursor; speed slider changes playback rate |
| T6 | Insertion, selection sort | Human | Section 7 tests pass |
| T7 | Merge sort (aux-buffer `set` events), quicksort (Lomuto, then Hoare), heap sort | Human | Property tests pass for all |
| T8 | Input presets + size slider (cap 500) | Agent | All presets selectable; edge sizes 0/1/2 handled |
| T9 | README (goal, architecture diagram, GIF), GitHub Pages deploy | Agent | Live URL works; README links it |
| T10 | Tag `v0.1.0` | Human | CI green on main |

**Definition of done for v0.1:** deployed link, 6 algorithms, working rewind, tests green in CI, README with GIF. Everything else is out of scope.

## 11. Later stages (design notes only, do not implement in v0.1)

- **Pathfinding:** one `search(start, goal, neighbors, h)` generator; `h = 0` is Dijkstra. Events: `open`, `close`, `relax` (with `prevG` for undo), `path`. Lazy deletion in the priority queue (document the trade-off vs. decrease-key). Heuristics: Manhattan (4-connected), octile (8-connected), Euclidean; weighted-A* slider to show suboptimality when admissibility is violated. Weighted terrain tiles so BFS and Dijkstra visibly diverge.
- **Graph undo** may need checkpoints every k steps plus forward replay, or `(cell, prevState)` deltas.
- **D* Lite (stretch):** toggle a wall mid-run; compare A* full recompute vs. D* Lite repair with a "nodes re-expanded" counter.
- **Pedagogy features:** pseudocode pane (`line` on events), narration (`why` on events), invariant region annotations, predict-then-reveal mode, adversarial presets (sorted input on naive quicksort, concave trap for greedy search).
