#!/usr/bin/env bash
set -euo pipefail

# Run as the Cloudways application SSH user from the deployed repository root.
# Confirm the app path and Python version before running.
python3 --version
python3 -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip wheel
python -m pip install -r requirements.txt
python -m pytest -q

if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 is not available. Ask Cloudways support whether PM2/custom long-running processes are enabled for this server."
  exit 2
fi

# Replace the cwd in ecosystem.config.cjs with the actual Cloudways app path.
pm2 start deploy/cloudways/ecosystem.config.cjs
pm2 save
curl --fail http://127.0.0.1:8017/api/health
