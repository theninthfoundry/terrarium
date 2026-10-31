# Cloudways / Python Deployment

Recommended hackathon setup: serve the dashboard static files on Cloudways and run FastAPI on a Python-capable host or separately provisioned compatible custom process. Do not assume a Cloudways Node/PHP application directly supports persistent FastAPI and pytest subprocesses.

1. Deploy FastAPI with `uvicorn terrarium.api:app --host 0.0.0.0 --port $PORT` on the Python host.
2. Restrict `TERRARIUM_ALLOW_REPOSITORIES=0`. Set `TERRARIUM_ALLOWED_ORIGINS` to the exact Cloudways HTTPS origin if cross-origin requests are used.
3. Upload `templates/index.html`, `static/app.css`, and `static/app.js` to Cloudways with URLs adjusted to reach the API through a supported proxy. Direct static upload without URL adjustment is NOT a completed deployment.
4. Set Gemma credentials as host secrets only; never put them in JavaScript.
5. Verify `/api/health`, `/api/demo`, a complete `/api/analyze` request, and receipt download in the hosted browser.
6. Ensure public traffic is rate-limited at the proxy and keep the demo work queue bounded.
7. Do not accept arbitrary repositories on a shared demo host.
