# Operations and runbook

## Local development

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\Activate.ps1
python -m pip install -e '.[dev,gemma]'
python -m pytest -q
uvicorn terrarium.api:app --reload --port 8000
```

## Run one experiment

```bash
terrarium analyze sample_repo --changed src/pricing.py --max-mutations 6 --timeout 60 --json report.json
```

For a trusted local repository, run the CLI directly and pass repository-relative changed paths. The CLI does not require the public API token because it is a local developer command.

## Graphify refresh

1. Install the official `graphifyy` package (`uv tool install graphifyy`).
2. Open the repository in a supported coding assistant.
3. Run `/graphify .` from the repository root.
4. Verify `graphify-out/graph.json` exists and is current.
5. Run Terrarium and confirm the report identifies Graphify rather than AST fallback.

## Failure interpretation

- **Baseline failed:** fix the suite first; no mutation score is produced.
- **No functions mapped:** verify changed file paths and the graph's source-file/symbol metadata.
- **All mutants survived:** the chosen operators may not be detected by current tests; this is not a 100% score.
- **Invalid mutant:** inspect the captured error; do not count it as killed or survived.
- **Missed test:** inspect the test and graph path; dynamic dispatch/reflection is a hypothesis, not a proven cause unless source evidence confirms it.
- **Graphify adapter fallback:** keep the fallback label visible and preserve the graph file for adapter tests.

## Operational limits in v0.1

- Synchronous requests; one run can take as long as the full suite multiplied by mutant count.
- Single worker recommended for small servers.
- Public API is demo-only by default.
- No persistent database; reports are returned to the client and can be saved as JSON by the CLI.
- No remote repository cloning or arbitrary upload endpoint.
