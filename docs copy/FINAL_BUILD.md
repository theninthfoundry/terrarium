# TERRARIUM | Finishing the hackathon build

This patch adds **two local MCP tools** and **Graphify schema diagnostics** to the existing backend.
It is designed to apply on top of the current code, not replace an upgraded evidence/calibration implementation.

## Setup (Python 3.11+ recommended)

1. Merge the patch into your repository root.
2. `python -m pip install -e '.[dev]'`
3. `python -m pip install 'mcp>=1.28,<2'`
4. `python -m pytest -q`
5. `python -m uvicorn terrarium.api:app --host 127.0.0.1 --port 8000`
6. Open `http://127.0.0.1:8000` and run the preconfigured sample.

## MCP local use

Linux/macOS: `export TERRARIUM_MCP_WORKSPACE=/absolute/path/to/trusted/workspace`
PowerShell: `$env:TERRARIUM_MCP_WORKSPACE='C:\\path\\to\\trusted\\workspace'`

Start: `python -m terrarium.mcp_server`

Available tools:
- `blast_radius(repository, symbol)` — static graph prediction, does **not** execute tests
- `calibrate_change(repository, changed_file, max_mutations=4)` — invokes real pytest in copied repositories; only trusted code

For a coding-agent client, register the executable above as a **stdio** MCP server and pass the workspace environment variable.
Never expose via public HTTP and never provide a workspace containing untrusted uploaded code.

## Graphify compatibility

Official install: `pip install graphifyy` or `uv tool install graphifyy`.
Generate a graph according to the upstream release's documented CLI/skill.
Then run `python scripts/verify_graphify.py /path/to/repository`.

The diagnostic records `graph.schema_version`, `graph.graphify_version`, counts, and whether Terrarium actually consumed the Graphify graph or fell back to AST. **The adapter still needs validation with an actual graph from the intended Graphify version.**

## Self-analysis

The repository itself has tests that exercise experimental runs. Run from a trusted local checkout:

`terrarium analyze . --changed terrarium/impact.py --max-mutations 2`

If the baseline does not pass in a disposable clone, it should abstain rather than emit a misleading score. Depending on environment/dependency fixtures, this full self-analysis may need better isolation and fixture mapping. Publish `.terrarium/receipt.json` only after verifying inputs and that the report contains no secrets.

## Cloudways

Use the existing split setup in `docs/CLOUDWAYS.md`: Cloudways static dashboard, supported hosted Python API, explicit CORS allowlist. Keep demo repository fixed to bundled `sample_repo`; avoid exposing arbitrary-code execution. Verify `/api/health`, `/api/demo`, `/api/analyze`, and a real Gemma response before claiming integration works.

## Security and limitations

Temporary copies, timeouts and restricted environments are **not container isolation**. The backend runs project-provided Python. For untrusted repository support, add a disposable isolated worker with disabled network and secrets, OS memory/CPU/process limits, and job termination. The local MCP server is only for explicitly trusted directories.

Live Cloudways, Graphify generation and Gemma API testing require external credentials and cannot be completed from this patch alone.
