// Cloudways Flexible custom-process option. PM2 must be available on the server.
// Run from the deployed repository root after creating .venv and installing requirements.
module.exports = {
  apps: [{
    name: 'terrarium-api',
    script: '.venv/bin/uvicorn',
    args: 'terrarium.api:app --host 127.0.0.1 --port 8017 --workers 1',
    cwd: '/home/MASTER/applications/APP_ID/public_html',
    interpreter: 'none',
    autorestart: true,
    max_memory_restart: '700M',
    env: { PYTHONUNBUFFERED: '1', TERRARIUM_ALLOW_REPOSITORIES: '0' }
  }]
};
