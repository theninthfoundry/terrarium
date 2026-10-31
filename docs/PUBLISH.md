# Publish Terrarium to GitHub

The project files are ready for a GitHub repository. Create an empty repository under the `theninthfoundry` account named `terrarium` (do not initialize it with a README, license, or `.gitignore`). Then, from the project folder:

```bash
git config user.name "Your GitHub display name"
git config user.email "Your GitHub commit email"
git add .
git commit -m "feat: initial Terrarium implementation"
git remote add origin git@github.com:theninthfoundry/terrarium.git
git push -u origin main
```

If you download the source ZIP, it intentionally excludes `.git`; initialize it first:

```bash
git init -b main
```

Use your own GitHub commit email. Never put a personal access token or SSH private key in the repository.
