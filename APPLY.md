# Terrarium integration overlay (not a complete repo)

This overlay merges two previously created packages: the local MCP/Graphify diagnostic patch and the API/Gemma hardening patch. It does not include or replace the main engine, graph, calibration, or runner. Review the diffs before use.

From your **existing, up-to-date** repo root, run:

```bash
python apply_overlay.py --dry-run
python apply_overlay.py --apply
python -m pip install -e '.[dev]'
python -m pip install 'mcp>=1.28,<2'
python -m pytest -q
```

Important: Graphify's actual output is not yet verified; the external Gemma API and live Cloudways deployments are not tested. Public endpoints must remain demo-only. Do not enable arbitrary repository execution on a shared web host.
