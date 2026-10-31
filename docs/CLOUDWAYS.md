# Cloudways deployment notes

## Important runtime choice

Terrarium's current backend is Python/FastAPI and executes pytest subprocesses. Cloudways Velocity is described by Cloudways as managed Node.js hosting. Do **not** select Velocity and assume it will run this Python backend unchanged. Use a Cloudways Flexible server only if your account/server supports a persistent custom Python process and a supported reverse-proxy configuration.

Cloudways documents Git deployment for Flexible using an SSH deploy key and an SSH repository URL. It also documents the Velocity path separately for Node.js applications.

## Deployment sequence (Flexible custom process)

1. Create or select a Cloudways Flexible server and application. Confirm with Cloudways support that custom long-running Python processes and the required Nginx reverse-proxy configuration are permitted for this application/server.
2. In Application Management → Deployment via Git, generate the SSH key.
3. Add the public key to the GitHub repository as a read-only deploy key.
4. Copy the repository's **SSH** clone URL, authenticate it in Cloudways, select `main`, and deploy to the application directory.
5. SSH to the application as the application user. Confirm Python 3.10+ and that the application directory is writable.
6. Create the virtual environment and install `requirements.txt`:

   ```bash
   python3 -m venv .venv
   . .venv/bin/activate
   pip install --upgrade pip wheel
   pip install -r requirements.txt
   python -m pytest -q
   ```

7. Review `deploy/cloudways/ecosystem.config.cjs`. Replace the placeholder `cwd` with the actual application path. It is a PM2 template; use it only if PM2 is available and Cloudways permits it. Otherwise use the process manager Cloudways support recommends.
8. Add the reverse-proxy block from `deploy/cloudways/nginx-location.conf` through the supported Nginx customization path. Do not expose port 8017 to the public internet. If Cloudways does not allow a custom reverse proxy, stop here and ask support for the supported Python application pattern rather than editing managed Nginx files blindly.
9. Configure environment variables. Keep `TERRARIUM_ALLOW_REPOSITORIES=0` for the public demo. Add `GEMMA_API_KEY` only if you want the optional explanation layer.
10. Start the process, then check `https://your-domain/api/health` and run the sample experiment.

## Resource guidance

The runner starts a fresh test process per mutation and makes a repository copy each time. Keep the demo suite small and use one worker on a small server. Increase timeouts only after confirming available CPU/RAM/disk. A larger production rollout needs a job queue, cleanup policy, concurrency controls, and a container/microVM boundary.

## Rollback

Use Cloudways' Git deployment history or deploy the previous known-good commit, restart the app process, and verify `/api/health`. Keep the previous working revision available until the smoke test passes.

## Cloudways official guides

- Git deployment on Cloudways Flexible: https://support.cloudways.com/en/articles/5124087-how-to-deploy-code-to-your-application-using-git-on-cloudways-flexible
- Cloudways Velocity launch guide (Node.js runtime): https://support.cloudways.com/en/articles/15550368-how-to-launch-an-application-on-cloudways-velocity

## Recommended split deployment (Cloudways frontend + Render API)

Because Cloudways Flexible exposes PHP application types rather than a native Python/FastAPI runtime, deploy the static dashboard to a Cloudways PHP application's `public_html/` and deploy the Python API as a separate Render Web Service. This preserves the existing Python engine without rewriting it in PHP.

### Backend (Render)

The repository includes `render.yaml`. Create a Render Blueprint from the GitHub repository, or create a Python Web Service manually:

- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn terrarium.api:app --host 0.0.0.0 --port $PORT`
- Health check path: `/api/health`
- Environment variable `TERRARIUM_ALLOW_REPOSITORIES=0`
- Set `TERRARIUM_ALLOWED_ORIGINS` to the exact HTTPS Cloudways application domain after it is known.

Render's free web services spin down after 15 minutes of inactivity; first request after idle can be delayed. Choose a paid always-on plan if the demo requires consistent response time.

### Frontend (Cloudways)

1. In the Cloudways PHP application, use SFTP to upload the contents of `deploy/frontend/` into `public_html/`.
2. Edit `config.js` and set `window.TERRARIUM_API_BASE` to the Render service's HTTPS origin (no trailing slash).
3. Set `TERRARIUM_ALLOWED_ORIGINS` on Render to the exact Cloudways application origin, including scheme and any `www` variant actually used.
4. Redeploy/restart the Render service and verify `GET /api/health`.
5. Open the Cloudways application URL and run the demo experiment.

Do not upload the Python source, `.env`, API keys, or workspace repositories to `public_html/`. The current public deployment is demo-only; do not enable arbitrary repository execution on an internet-facing service. The current analysis endpoint executes pytest and is not a multi-tenant sandbox.
