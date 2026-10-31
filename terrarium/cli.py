from __future__ import annotations

import argparse
import json
from pathlib import Path

from .engine import analyze_repository


def main():
    parser = argparse.ArgumentParser(prog="terrarium", description="Mutation-validated test impact analysis")
    parser.add_argument("analyze", nargs="?", default="analyze")
    parser.add_argument("repository", nargs="?", default=".")
    parser.add_argument("--changed", action="append", help="Changed file path relative to repository; repeatable")
    parser.add_argument("--max-mutations", type=int, default=10)
    parser.add_argument("--timeout", type=int, default=90)
    parser.add_argument("--json", dest="json_path", help="Write the report to this JSON file")
    args = parser.parse_args()
    report = analyze_repository(Path(args.repository), args.changed, args.max_mutations, args.timeout)
    payload = report.to_dict()
    if args.json_path:
        Path(args.json_path).write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps(payload, indent=2))
    if not report.baseline_passed:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
