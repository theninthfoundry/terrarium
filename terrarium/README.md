# TERRARIUM — Evidence-backed change assurance

Terrarium predicts which tests are impacted by source changes, challenges its prediction using mutation experiments, and saves what actually happened. **Mutation-Tested Impact Recall (MTIR)** is an experiment-specific measure, not a general reliability guarantee.

## Quick start

Requires Python 3.10+.

```bash
python -m pip install -e '.[dev]'
python -m pytest -q
terrarium analyze sample_repo --changed src/pricing.py --max-mutations 6
uvicorn terrarium.api:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000 . Sample output is saved to `.terrarium/receipt.json`.

## Optional MCP integration

```bash
python -m pip install -e '.[mcp]'
export TERRARIUM_MCP_WORKSPACE=/absolute/path/to/trusted/workspace
python -m terrarium.mcp_server
```

Tools: `blast_radius` (static impact) and `calibrate_change` (bounded experiment). MCP is local and executes repository-controlled pytest. Trust the workspace.

## Optional Gemma explanation

Install `python -m pip install -e '.[gemma]'` and configure `GEMMA_API_KEY` and `GEMMA_MODEL`. No key is included in this distribution. The dashboard must distinguish AI explanation from fallback when the provider cannot be reached.

## Public demo safety

Public API mode is deliberately restricted to the bundled sample. **Temporary file copies are not security sandboxes.** Do not enable arbitrary repository analysis on a public shared host. Use an isolated worker/container or VM, no network, non-root, memory/CPU/PID/disk quotas before accepting untrusted code.

## Deployment

Set up the FastAPI backend on a host that supports persistent Python processes, configure HTTPS, and serve the UI from the same origin or through an approved reverse proxy. Cloudways can host the static UI, with a separate Python service for the engine. See `docs/DEPLOY.md`.

## Measurements

MTIR = correctly predicted failing test-mutant pairs / observed failing test-mutant pairs. Scores are unavailable when the baseline fails or no killed mutants exist. The confidence label is conservative, heuristic and distinct from a confidence interval.
