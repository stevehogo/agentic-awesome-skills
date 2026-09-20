---
description: Choosing which agent skills a wave or a task loads, mapped onto the dependency spines in Step 2 of SKILL.md.
metadata:
  tags: [skill-selection, bundles, wave-spine, planning, execution]
---

# Choosing skills per wave and per task

Reference for the `Skills:` lines in a plan folder (Step 2 and Step 3 of [SKILL.md](../SKILL.md)).

A plan names skills in four places. Each answers a different question.

| Place | Template | What belongs there |
|---|---|---|
| README **Reality baseline** | 1 | The skills that exist and are usable here. Step 1.3 verifies this. |
| README References, **Tooling:** | 1 | The full list the plan invokes, for the reader. |
| Wave header, **Skills:** | 2 | What every task in this wave loads. |
| Task block, **Skills:** | 2 | Only what changes how *this* task is done. |
| Gate step (b) | 2 | The read-only reviewers that audit the wave. |

**Verify before you name.** Step 1.3 says to confirm the tooling you reference. A skill in a
bundle is not the same as a skill installed here. Name the manual fallback next to any skill the
environment may lack, the way the worktree steps already do.

**Do not repeat the wave list in every task.** That breaks the DRY rule in *Shared conventions*.

## Mapping the spines to skills

Step 2 lists four dependency spines. The tables below map each stage to skills. Names come from
the `mb-engineer` and `dj-senior-engineer` bundles. Swap in your own bundle's equivalents.

### Before the waves — authoring the plan

| Job | Skills |
|---|---|
| Clarify an unclear requirement | `requirements-gathering`, `brainstorming` |
| Turn it into a testable spec | `spec-driven-workflow`, `test-cases` |
| Decide the system shape | `senior-architect`, `architecture-patterns`, `backend-architect`, `database-architect` |
| Record why | `architecture-decision-records` |

### Frontend / UI spine

| Wave stage | Skills |
|---|---|
| Design tokens, primitives | `frontend-design`, `tailwind-patterns` |
| Composite components | `frontend-developer`, `react-best-practices`, `shadcn` |
| Global chrome, pages | `nextjs-app-router-patterns`, `nextjs-best-practices`, `frontend-dev-guidelines` |
| Forms and conversion | `form-cro` |
| Cross-cutting QA | `ui-a11y`, `seo-audit`, `frontend-security-coder` |

### Backend / API spine

| Wave stage | Skills |
|---|---|
| Schema and migrations | `database-architect`, `postgres-best-practices`, `sql-pro` |
| Service or domain layer | `backend-dev-guidelines`, `architecture-patterns`, `clean-code` |
| Transport (REST, RPC, GraphQL) | `backend-architect`, `nodejs-best-practices` |
| Auth | `auth-implementation-patterns`, `api-security-best-practices`, `backend-security-coder` |
| External integrations | `microservices-patterns`, `event-sourcing-architect` |
| QA and release | `sast-configuration`, `pci-compliance`, `lint-and-validate` |

### Data / ETL and CLI / library spines

These reuse the rows above. Source schema and connectors take the database row. Transforms and
public API surfaces take the service-layer row. Orchestration takes the integrations row.

### Any wave

| Job | Skills |
|---|---|
| Language depth | `typescript-expert`, `javascript-pro` |
| A bug that resists a first fix | `systematic-debugging` |
| Reasoning about correctness | `logic-lens` |
| Writing tests first | `test-driven-development` |

### Restructure wave (Template 5)

| Job | Skills |
|---|---|
| Classify and rank the mess | `brooks-debt`, `codebase-cleanup-tech-debt` |
| Deep-scan the trees | `production-code-audit` |
| Design the target layout | `senior-architect`, `architecture-patterns`, `clean-code` |
| Record the decision | `architecture-decision-records` |
| Run the moves in packets | `orchestrate-batch-refactor` |
| Fix import paths and modules | `typescript-expert` |

`orchestrate-batch-refactor` is the closest match to this format's own shape. It plans
dependency-aware work packets with parallel analysis lanes, which is what
[`batching.md`](batching.md) calls lanes and batches.

## Gate step (b) — the audit skills

The gate needs a reviewer that is **not** the executor re-reading its own diff. Use read-only
skills:

- `production-code-audit` — deep scan of the wave's surface.
- `logic-lens` — anti-patterns and logic faults a linter misses.
- `requesting-code-review` — when a person reviews the wave.
- `cc-skill-security-review` — when the wave touches auth, input handling or uploads.

## Execution and handoff

These belong in *Shared conventions* and the Execution handoff section, not in a task block.

| Job | Skills |
|---|---|
| The effort's worktree | `using-git-worktrees` |
| Retire the branch | `finishing-a-development-branch` |
| Run the plan | `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents` |
| Wave commit | `commit`, `git-pushing` |
| Prove a wave is done | `verification-before-completion`, `lint-and-validate` |

## Common mistakes

| Mistake | Fix |
|---|---|
| Naming every plausible skill on every task | Name only what changes the work. A long list is read as noise and skipped. |
| Naming a skill the environment lacks | Verify in Step 1.3. Write the manual fallback beside it. |
| Repeating the wave list in each task | Keep wave-wide skills in the wave header only. |
| Letting the executor audit its own wave | Gate step (b) needs a fresh-context reviewer. |
| Using a namespace prefix that does not resolve | Check how skills are addressed here before writing the id. |
