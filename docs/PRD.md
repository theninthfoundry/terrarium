# TERRARIUM — Product Requirements

## Product definition

Terrarium is a self-evaluating test-impact analysis system. Given a repository and changed source files, it predicts affected tests, challenges that prediction with controlled source mutations, and reports the observed misses.

## Primary user

A developer or CI owner who wants faster selective test runs but cannot safely trust an impact map without knowing where it is incomplete.

## Core user journey

1. Point Terrarium at a trusted repository.
2. Select changed files (initially supplied by the user/CLI; Git diff integration is a next milestone).
3. Terrarium verifies that the unmodified baseline test suite passes.
4. It builds or reads the dependency graph and predicts the impact set.
5. It generates bounded mutations in changed functions.
6. It runs every mutant in a disposable copy and records actual failing tests.
7. It produces a trust report with sample size, recall, missed tests, paths, and limitations.

## Requirements

### P0 — working core
- Baseline test gate before mutation scoring.
- Graphify node-link graph ingestion and explicitly labelled Python AST fallback.
- Caller-to-callee dependency graph and reverse impact traversal.
- Python AST mutation generation for comparisons and selected arithmetic operations.
- One clean temporary copy per mutant; original repository remains untouched.
- Full pytest execution with timeout and XML failure capture.
- Valid/killed, survived, and invalid mutation states.
- Mutation-tested recall calculated from observed failing test–mutant pairs.
- Evidence list for missed tests and dependency paths.
- CLI, FastAPI endpoints, dashboard, reproducible sample, and CI tests.

### P1 — reliability
- Git diff parser and changed-function mapping from line ranges.
- Import alias and method-resolution improvements.
- Graphify node/edge provenance and confidence surfaced in the UI.
- Job queue, cancellation, run persistence, and structured logs.
- Per-repository operator policy and configurable test command.
- Container/microVM isolation for untrusted code.

### P2 — integrations
- MCP server so coding agents can query impact and trust evidence.
- CI annotations and pull-request checks.
- Historical trust by branch/commit and regression trend.
- Additional language adapters and test runners.

## Non-goals for the first release
- Claiming that mutation-tested recall is real-world regression coverage.
- Replacing full test suites or code review.
- Running arbitrary public uploads on the same host as the web process.
- Using an LLM to invent dependency edges or alter numerical scores.

## Success criteria
- Baseline is clean before any score is shown.
- At least one valid mutant is needed before recall is displayed.
- Every score includes valid-mutant count and experiment scope.
- Every observed miss is inspectable.
- A run cannot modify the source repository.
- Graphify fallback is always visible, never silently represented as Graphify.
