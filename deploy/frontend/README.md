# TERRARIUM static frontend (Cloudways)

This directory is the static UI bundle intended for the Cloudways PHP application's `public_html` directory. It does not contain or run the Python engine.

1. Copy `config.js.example` to `config.js`.
2. Replace the placeholder with the deployed FastAPI service URL (HTTPS, no trailing slash).
3. Upload `index.html`, `config.js`, and the `static/` directory into `public_html/` using SFTP.
4. Open the Cloudways application URL. The UI will call the separate API service.

Do not upload `.env`, repository workspaces, API tokens, or Python source to `public_html`.
