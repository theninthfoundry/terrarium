# TERRARIUM code map

## Repository layout

```text
terrarium/
├── terrarium/                 # Python analysis engine and FastAPI service
│   ├── api.py                 # HTTP API: health, demo, analyze
│   ├── engine.py              # Experiment orchestration and report assembly
│   ├── graph.py               # Dependency graph extraction/adapters
│   ├── impact.py              # Changed-code to predicted-test impact
│   ├── mutator.py             # Controlled AST mutation operators
│   ├── runner.py              # Baseline and isolated mutation test runs
│   ├── models.py              # Report/result models
│   ├── explain.py             # Optional evidence-grounded explanation
│   └── cli.py                 # Command-line entry point
├── templates/                 # Local FastAPI-served dashboard
├── static/                    # Local dashboard assets
├── deploy/frontend/           # Cloudways static frontend bundle
├── deploy/cloudways/          # Optional custom-process notes/templates
├── sample_repo/               # Included demonstration repository
├── tests/                     # API and engine tests
├── docs/                      # PRD, architecture, demo and deployment docs
├── render.yaml                # Render Blueprint configuration
├── requirements.txt           # Python runtime dependencies
└── .github/workflows/ci.yml   # GitHub Actions test workflow
```

## Important files to open first

1. `README.md` — setup and project overview.
2. `docs/PRD.md` — product requirements.
3. `docs/ARCHITECTURE.md` — system architecture and experiment flow.
4. `docs/DEMO.md` — sample experiment walkthrough.
5. `docs/CLOUDWAYS.md` — split deployment instructions.
6. `terrarium/api.py` — API endpoints and public-demo safety gate.
7. `terrarium/engine.py` — main experiment orchestration.
8. `terrarium/graph.py` and `terrarium/impact.py` — dependency graph and test selection.
9. `terrarium/mutator.py` and `terrarium/runner.py` — mutation generation and isolated test execution.
10. `deploy/frontend/static/app.css` — monochrome visual system.
11. `deploy/frontend/static/app.js` — dashboard interactions and API calls.

## Run locally

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m pytest -q
uvicorn terrarium.api:app --reload
```

Open `http://127.0.0.1:8000`.

## Deployment split

- Cloudways serves only the static files inside `deploy/frontend/`.
- Render runs the Python FastAPI service from the repository root using `render.yaml`.
- Set `deploy/frontend/config.js` to the Render HTTPS origin before uploading the frontend.
- Set `TERRARIUM_ALLOWED_ORIGINS` on Render to the exact Cloudways HTTPS origin.
- Keep `TERRARIUM_ALLOW_REPOSITORIES=0` for the public demo. Do not expose arbitrary repository execution without a hardened sandbox and authentication layer.
