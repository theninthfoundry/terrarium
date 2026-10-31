# Architecture

```text
Browser / CLI
     |
     v
FastAPI API -----------------------> Gemma 4 (optional explanation only)
     |
     v
Analysis Orchestrator
     |              \
     v               v
Graph Adapter       Baseline Gate
     |               |
Graphify JSON       pytest in disposable copy
     |               |
Python AST fallback |
     |               v
Impact Engine       Mutation Engine
     |               |
Reverse traversal   AST operator flips
     |               |
Predicted tests     Fresh temp copy per mutant
     |               |
     +-------> pytest full suite + JUnit XML
                      |
                      v
              Evidence / Score Engine
                      |
          recall + misses + sample count
                      |
                      v
                 Trust Report
```

## Graph semantics

The internal graph direction is **caller → callee**. If function A calls function B, the graph contains A → B. A change to B impacts its reverse-reachable callers. Test functions are treated as callers too. Graphify's edge `relation` must indicate a call (`calls`, `call`, or `invokes`) to be used for test-impact traversal. Imports and semantic similarity are not treated as proof of execution.

Graphify's NetworkX node-link output may carry nodes plus `links`; Terrarium also accepts `edges`. Graphify may write the graph as undirected for compatibility while preserving arc order. The adapter reads the raw source/target order directly and honours `_src` / `_tgt` markers when present, rather than allowing a generic undirected loader to reorder endpoints.

## Scoring

For each valid killed mutant m, let F(m) be the observed failing tests and P(m) be the predicted tests for the changed function. Terrarium computes:

`recall = sum(|F(m) ∩ P(m)|) / sum(|F(m)|)`

The denominator is the number of observed failing test–mutant pairs. Survived mutants are excluded because no test failure was observed; invalid experiments are excluded and surfaced. This pair-weighted calculation avoids averaging percentages with different denominators.

Precision is intentionally secondary. A predicted test can be a real dependency and still not fail for one particular mutation. Recall focuses on the dangerous case: an observed failure outside the predicted set.

## Safety boundary

The current runner executes repository test code in a subprocess with a timeout, inside a temporary copy. This protects the user's working tree from Terrarium's own mutations; it does **not** sandbox malicious code. Public deployments must remain demo-only until untrusted runs are isolated in containers or microVMs with CPU, memory, filesystem, network, and process limits.
