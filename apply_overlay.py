"""Review then apply a release overlay from the current folder; back up changed files."""
import argparse, pathlib, shutil, datetime, difflib
p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');p.add_argument('--dry-run',action='store_true');p.add_argument('--repo',default='.');a=p.parse_args()
root=pathlib.Path(a.repo).resolve();overlay=pathlib.Path(__file__).resolve().parent
if not (root/'terrarium'/'engine.py').is_file():raise SystemExit('Run with --repo PATH pointing to a real Terrarium checkout (terrarium/engine.py missing).')
files=[f for f in overlay.rglob('*') if f.is_file() and f.name not in {'apply_overlay.py','APPLY.md'} and '__pycache__' not in f.parts]
backups=root/'.terrarium-overlay-backups'/datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
for file in files:
 rel=file.relative_to(overlay); dst=root/rel
 if not dst.resolve().is_relative_to(root):raise SystemExit('Unsafe destination')
 status='UPDATE' if dst.exists() else 'ADD'
 if dst.exists() and dst.read_bytes()==file.read_bytes():status='SAME'
 print(status,rel)
 if a.apply and status!='SAME':
  if dst.exists():
   old=backups/rel;old.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dst,old)
  dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,dst)
if not a.apply:print('No files changed. To install use --apply; inspect overwrites first.')
else:print('Applied. Backup of replaced files:',backups)
