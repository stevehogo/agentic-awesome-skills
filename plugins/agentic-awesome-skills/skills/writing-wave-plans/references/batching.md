---
description: Turning a wave file's declared dependencies into a verified graph, per-executor batches, and a batch-rendered diagram.
metadata:
  tags: [dependency-graph, batching, parallel-tracks, critical-path, execution-order]
---

# Batching a wave into executor lanes

Reference for the `## Dependency graph` section of a wave file (Step 3 of [SKILL.md](../SKILL.md)),
and for answering *"which tasks can run concurrently?"* / *"what can two devs do in parallel?"*

A wave file lists tasks with `depends` lines. **That is not a dependency graph** — declared
dependencies are routinely incomplete, and slice headings are demo checkpoints, not execution
barriers. This produces a verified graph, groups it into batches one executor can own end to end,
and renders it **by batch**, so it answers *who does what and when they wait* rather than *what
abstractly depends on what*.

Use it when writing a wave file, and again before executing one — the second pass catches edges the
first missed, because by then the tasks have Steps.

## Step 1 — Extract the declared graph

```bash
grep -n "^### Task\|^\*\*Covers:\*\*\|^\*\*Files:\*\*" wave-N-*.md
```

Record per task: **ID · size · declared depends · file globs**. This is the *claim*, not the graph.

## Step 2 — Verify every edge. Declared deps are wrong often enough to assume it

**Read each task's Steps, not just its `depends` line.** The `depends` line records what the author
had in mind; the Steps record what the task actually touches. Six failure modes, each of which
stalls a lane mid-flight rather than failing loudly:

| Failure mode | How to catch it | Real example |
|---|---|---|
| **Undeclared cross-wave dep** | Grep every column/table/artifact the Steps name for the task that creates it | A ticket task declared `depends F3`, but its `source`/`captured_by` columns come from `F11` |
| **Undeclared cross-lane dep** | Look for a backend task whose Steps say "wire … into the shell" (or vice versa) | An availability endpoint declared `depends A3`, but its dropdown lives in the app shell task |
| **Unowned artifact** | For each artifact a task *consumes*, grep the whole plan for a task that *creates* it | `packages/shared` consumed by one task, audited by the gate, created by nobody |
| **Unowned endpoint/interface** | Same, for API paths named in Verify steps | `GET /me` extended by one task and contract-tested by another; no task creates it |
| **Unrunnable verification** | Read each Verify step and ask which task builds the thing it calls | A scoping task asserted `GET /activities?page=99`, an endpoint four waves later |
| **Over-declared dep** | Ask whether the dep serves *this* task or a later one | An intake task declared predicate-scoping, but scoped *reads* belong to its Wave 7 sibling |

Fix the first five before batching. For an over-declared dep, **flag it and ask — never silently
weaken a declared security dependency.** Write the question into the plan beside the batch it would
compress.

Expect 3–6 findings per wave. If a pass finds none, it did not read the Steps.

## Step 3 — Derive lanes from Files, never from slices

Two tasks may run concurrently **iff** there is no path between them **and** their file globs are
disjoint. Slice headings routinely group tasks that unblocked much earlier.

**Prefer tree-scoped lanes.** One executor per top-level tree (`<api>/src/**` vs `<web>/src/**`) is
the strong form: the trees cannot collide, so the ownership line alone prevents conflicts. State it
explicitly — it, not the batch numbering, is the guarantee.

**A single-tree wave still has lanes, but weaker ones.** When every task lives under one module
(`<api>/src/crm/**`), derive lanes from *disjoint file sets*. Concurrency is real but the guarantee
is procedural: two tasks in different lanes may still name the same file in a `modify:` clause, and
only the **batch barrier** keeps them apart. Say so where it applies — *"safe because C4 opens after
the batch containing C2 closes"* is the load-bearing sentence, and a reader who reorders the batches
loses the property without noticing.

**A task whose `Files:` line is "modify per findings" has unbounded scope** and cannot be proven
disjoint from anything. Put every such task in one lane.

Then compute:

- **Critical path** — the longest chain. The wave is no faster than this, whatever the headcount.
- **Floating tasks** — unblocked early, consumed by nothing in this wave. Pure slack.
- **Reconvergence points** — tasks needing both lanes. Usually exactly one; name it.
- **Calendar waits** — a soak, burn-in or observation window is *not work* and no headcount
  compresses it. Draw it as its own row and say what to run alongside.

## Step 4 — Batch

A batch is a **cohesive package: one executor's ordered queue**, bounded by a barrier both
executors clear together. It is *not* a set of things that run simultaneously.

> **Say this in the document.** A reader who assumes a batch is a concurrency set will try to run
> `A1` and `A2` at once because both sit in batch 1. Cells contain arrows for a reason.

Rules that earn their place:

1. **Prefer cohesion over maximum parallelism.** Handing one dev `U12 → U8 → U2 → U3` beats
   splitting two of them across two people: they share context, and every split is a handoff.
2. **Never put a floating task on the critical package.** Let it fill whichever gap appears.
3. **Don't pad a structural idle.** A serial prefix genuinely blocks everyone else. Fill it with
   real prerequisites — the unowned artifacts from Step 2 are ideal — or say plainly that the wave
   starts single-executor and the second joins at batch N.
4. **Never lump a serial tail as "all the rest".** A three-deep tail only one executor can work
   makes the wave look shorter than it is when hidden.
5. **Cut a lane-spanning task at the boundary**, one half per batch, and say it must never be held
   by both executors at once.
6. **Give every batch an "Opens when" column** naming the *real* prerequisites, including the
   cross-wave ones found in Step 2.
7. **Say when a second executor is not worth it.** If the critical path is most of the wave, the
   honest answer is "run the parallel *wave* instead" — see the README's parallel tracks.

## Step 5 — Render the graph by batch

Rows are batches, columns are lanes. Vertical arrows are one executor's serial queue; horizontal
arrows are cross-lane edges — keep those few and label them.

```
         Dev A — <api>/src/**                Dev B — <web>/src/**
         ────────────────────                ────────────────────
  B0     F2 · F3 · F6 · F11                  packages/shared
         │                                   │
         ▼                                   │
  B1     A1 ──► A2 ─── unblocks U12 ────────►┤    Dev B idle — structural
         │                                   │
         ▼                                   ▼
  B2     A3 ──► A4 ──► A6 endpoint           U12 ──► U8 ──► U2 ──► U3
         │                                   │
         ▼                                   ▼
  B3     R3a  (also needs F11)               A6 dropdown  (needs U12)
         │                                   │
         └────── both feed U7 ──────────────►│
                                             ▼
  B4     Demos 1A and 1B · gate prep         U7

  A5 floats — unblocked after A1, first consumed in Wave 3. Fill any gap with it.
```

Full drawing rules, column mechanics and a worked before/after: [`ascii-graph.md`](ascii-graph.md).
The three that bite:

- **Every arrow points the way the dependency runs.** A connector that loops back into the other
  lane's column reads as a reversed edge. A horizontal line between two siblings invents an edge
  that does not exist.
- **No `⚠`, emoji or decoration inside the fence.** They render double-width in some terminals and
  knock every column out of alignment. Plain parentheses inside; the annotated list goes outside.
- **Match the repo's existing convention.** If the plan README draws ASCII in a code fence, do that
  — do not introduce Mermaid for one section. Where Mermaid *is* the convention,
  [`mermaid.md`](mermaid.md) binds.

## Step 6 — Write it into the wave file

Insert `## Dependency graph` **before** `## Status tracking`, containing, in order:

1. One line: slices ≠ barriers · the ownership rule · batches are packages, not concurrency sets
2. The ASCII fence
3. **Critical path:** the chain, and the note that headcount cannot shorten it
4. Why the lanes cannot collide, the sole reconvergence, any lane-spanning task
5. A `> ⚠` blockquote listing every wrong, unowned or unverifiable edge from Step 2, with evidence links
6. `### N-executor batch schedule` — the table, with an **Opens when** column
7. Notes: structural idle · lane-spanning task · serial tail · calendar waits · **single-executor fallback**

**Delete what the batch view supersedes.** A task-level "what may run concurrently" table becomes
*wrong* once its pairs are serial inside one lane — keep only the reasoning that survives.

**A wave that genuinely does not split** (one chain, or every task modifying a file another creates)
gets the graph, the critical path and a sentence saying so — not an invented second column.

## Step 7 — Verify

```bash
node <skill-base-dir>/scripts/verify-plan.mjs <plan-folder> --ids-from-readme
```

Expect `links: OK` and `VERDICT: PASS`. Then check any new warning is yours: a bare path in prose
(`design/status-tokens.ts`) is read as repo-relative and warns — qualify it (`<web>/src/…`) rather
than leaving noise. **Re-read the fence rendered, not just diffed**, to catch alignment drift.

## Common mistakes

| Mistake | Fix |
|---|---|
| Trusting `depends` lines | Read the Steps; assume 3–6 edges per wave are wrong |
| Batching by slice heading | Slices are demo checkpoints; derive from edges + files |
| Batch presented as a concurrency set | State "one executor's ordered queue" in the intro |
| "Batch 5: all the rest" | Expand it — it is usually the serial tail |
| Padding a structural idle with filler | Name it structural; start single-executor |
| Emoji or `⚠` inside the ASCII fence | Plain text inside, caveats outside |
| A horizontal connector between siblings | Only draw an edge that exists |
| Silently dropping an over-declared dep | Flag it and ask the owner |
| Hiding a soak or burn-in inside a task | Draw it as its own row; it is calendar time |
| Leaving the task-level concurrency table beside the batch table | Delete it; it now contradicts |
