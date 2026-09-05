# Drawing the batch graph in ASCII

Mechanics for Step 5 of [SKILL.md](../SKILL.md). The graph is read in a terminal, a diff, and a
Markdown preview — it has to survive all three, which rules out most decoration.

## Layout

Fix two column starts and pad to them on every line. A working pair for two lanes:

| Element | Column |
|---|---|
| Batch label (`  B0     `) | 0 |
| Lane A content | 9 |
| Lane B content | 45 |

Lane A content must stay under ~34 characters or it collides with lane B. When a cell overflows,
shorten the label (`A6 endpoint`, not `A6 — availability endpoint half`) rather than widening the
column; the detail belongs in the batch table below the fence.

## Glyph set

Use only these. Every one is single-width in a monospace terminal:

```
│  ▼  ►  ─  ┌  ┐  └  ┘  ┤  ├  ·
```

**Never inside the fence:** `⚠` `✓` `✕` `→` `⇒` emoji, or any character outside Latin-1 plus the
box-drawing set above. They render double-width in some terminals and shift every following column
on that line. Caveats go in plain parentheses inside the fence; the annotated list goes outside it.

`·` is safe and useful as a separator inside a cell (`F2 · F3 · F6 · F11`).

## Connectors

**Serial within a lane** — the common case, one executor's queue:

```
  B1     A1 ──► A2
         │
         ▼
  B2     A3 ──► A4
```

**Cross-lane unblock** — label it, and point it *from* the producer *to* the consumer:

```
  B1     A1 ──► A2 ─── unblocks U12 ────────►┤
                                             │
                                             ▼
  B2                                         U12 ──► U8
```

**Reconvergence** — both lanes feeding one task:

```
  B3     R3a                                 A6 dropdown
         │                                   │
         └────── both feed U7 ──────────────►│
                                             ▼
  B4                                         U7
```

**Never** draw a connector that leaves one lane's column and re-enters the other lane's column
going upward or backward. It reads as a reversed dependency — the single most common defect in
these diagrams, and it survives review because both endpoints are correct.

## Verifying alignment

Diffing is not enough; render it.

```bash
sed -n '<start>,<end>p' wave-N-*.md
```

Read the output, not the diff. Check that every `│` in a lane sits in the same column as the `│`
above and below it. If one is off, the cell above it overflowed.

To catch invisible width problems:

```bash
sed -n '<start>,<end>p' wave-N-*.md | cat -A | grep -n 'M-'
```

Multi-byte sequences show as `M-...`. Box-drawing characters legitimately appear this way; what you
are looking for is an *unexpected* one — an emoji or arrow that crept into a cell.

## Worked example — the same wave, before and after

**Before — by task.** Answers "what depends on what", which nobody asks:

```
  A1 ───────────────────────────────► A5
   │
   ▼
  A2 ────────────► U12 ──┬──► U8 ────────────────────┐
   │                     │                           │
   │                     └──► U2 ────► U3 ───────────┤
   ▼                     │                           │
  A3 ──┬──► A6 ◄─────────┘                           │
       │                                             │
       └──► A4 ────► R3a ────────────────────────────┤
                                                     ▼
                                                    U7
```

Correct, and nearly useless for scheduling: it does not say who holds what, where anyone waits, or
which of those edges cross a file boundary that matters.

**After — by batch.** Same edges, arranged by executor and time:

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
                                             │
         ┌───────────────────────────────────┘
         ▼
  B5     W1-GATE — one executor, whole surface

  A5 floats — unblocked after A1, first consumed in Wave 3. Fill any gap with it.
```

What the second version surfaces that the first hides:

- **B1's idle is structural** — nothing else in the wave can start before A2 exists. Visible as an
  empty lane, not buried in edge directions.
- **A6 is cut across lanes** (B2 endpoint, B3 dropdown) — invisible in the task graph, where A6 is
  one node.
- **The tail `A4 → R3a → U7` is serial**, so B3–B5 are thin on one side by construction and no
  amount of headcount helps.
- **`packages/shared` and F11 are prerequisites**, not wave content — they get a batch of their own
  rather than being assumed.

## When two lanes is the wrong number

The lane count comes from the files, not from the team.

**A single-tree wave is not automatically single-lane.** A wave living entirely in
`<api>/src/crm/**` can still split cleanly if its tasks create disjoint files — one executor takes
`client → repository → resolver`, another takes `writeback`, `fx` and `mail-sync`. Label the
columns by role rather than by tree in that case (`Lane A — resolution spine`), and add the caveat
that the isolation is procedural: a `modify:` clause pointing at the other lane's file is safe only
because the batch barrier separates them in time.

**A wave is genuinely single-lane** when its tasks form one chain, or when every task modifies a
file another task creates. Then the graph is a straight line: say so, give the critical path, and
skip the batch table rather than inventing a second column.

**A third executor** is worth it only when a third disjoint file set exists *and* the critical path
does not already dominate. Count the floating tasks first — that is all a third person can absorb.
