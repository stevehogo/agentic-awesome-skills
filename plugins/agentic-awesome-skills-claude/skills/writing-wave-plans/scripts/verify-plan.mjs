#!/usr/bin/env node
/**
 * CLI entry point for the multi-wave plan verifier (writing-wave-plans skill, Step 4).
 *
 *   node verify-plan.mjs <plan-folder> --ids "F1-F8,U1-U11" [--ids-from-readme] [--no-ids]
 *                                     [--root <repo-root>] [--strict]
 *
 * All logic and the full check list live in ./verify-plan-lib.mjs — read that file's header for
 * what passes, what fails, and what only warns.
 *
 * This file runs runCli() UNCONDITIONALLY, on purpose. An `import.meta.url === argv[1]`
 * entry-point guard (the usual ESM idiom) compares Node's symlink-RESOLVED module URL against the
 * path as typed on the command line. When the skill is installed at a symlinked path — a linked
 * plugin dir, a marketplace install, a worktree — those differ, the guard goes false, and the
 * verifier exits 0 without printing a thing: a silent false PASS on a gate. Keeping the entry
 * point dumb removes that failure mode by construction; the library half stays importable because
 * it has no side effects of its own.
 */
import { runCli } from './verify-plan-lib.mjs';

process.exit(runCli(process.argv.slice(2)));
