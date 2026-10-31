# Terrarium Hack Day — upgrade pack

## What's included

- `terrarium/api.py`: limits the public sample endpoint, removes exception-detail leakage, publishes honest mode/model health state, throttles repeat requests, and retains explicit bearer-token checking for trusted workspaces.
- `terrarium/explain.py`: labels live Gemma responses versus fallback, limits the report fields given to the model, and keeps all metrics outside model control.
- `tests/test_hardening.py`: basic API regression tests.
- `README.md`: replaces the corrupted README with accurate install, architecture and demo instructions.

## Apply (from cloned repository root)

Copy the files from this archive onto the **same relative paths** in a feature branch. Do not remove the rest of your repository. Run:

```bash
python -m pip install -e '.[dev,gemma]'
python -m pytest -q
python -m compileall -q terrarium
```

## Operational limitations

- API test requests can still be CPU-intensive; a single-process throttle is not a distributed rate limiter.
- The current engine executes arbitrary pytest code in a temp directory; temp copies do not secure untrusted code.
- The Gemma model ID/access and live Cloudways/Render deployment require real account credentials and external verification.
- For a same-origin Cloudways static frontend + Render backend deployment, set `window.TERRARIUM_API_BASE` and server CORS correctly.
- Existing implementation's AST resolution has deliberate blind spots. Do not improve the sample example in a way that erases the demo's observed miss without updating its narrative.
- Public demo `/api/analyze` may return HTTP 429 during cooldown; show the user a retry message.

## Priority follow-ups

1. Capture verified Gemma 4 live model output + its exact ID.
2. Test end-to-end Cloudways + API deployment under live HTTPS.
3. Add async job queue/polling for experiments longer than HTTP proxy timeouts.
4. Add Graphify provenance graph UI and an inspectable missed-test path.
5. Use isolated worker infrastructure before accepting arbitrary repositories.
