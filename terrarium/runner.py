from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import xml.etree.ElementTree as ET
from pathlib import Path

from .mutator import Mutation


FAIL_RE = re.compile(r"^FAILED\s+(.+?)(?:\s+-|$)", re.MULTILINE)


def _copy_repo(source: Path, destination: Path):
    def ignore(directory: str, names: list[str]):
        ignored = {".git", ".venv", "venv", "node_modules", "__pycache__", ".pytest_cache", ".terrarium", "graphify-out", "dist", "build"}
        excluded = []
        for name in names:
            candidate = Path(directory) / name
            if name in ignored or name == ".env" or name.startswith(".env.") or candidate.is_symlink():
                excluded.append(name)
        return excluded
    shutil.copytree(source, destination, ignore=ignore)


def _run_pytest(repo: Path, timeout: int) -> tuple[int, str, float, list[str]]:
    xml_path = repo / ".terrarium-results.xml"
    start = time.monotonic()
    env = os.environ.copy()
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    command = [sys.executable, "-m", "pytest", "-q", "--tb=no", f"--junitxml={xml_path}"]
    try:
        result = subprocess.run(command, cwd=repo, capture_output=True, text=True, timeout=timeout, env=env)
        output = (result.stdout + "\n" + result.stderr).strip()
        failed: list[str] = []
        if xml_path.exists():
            try:
                tree = ET.parse(xml_path)
                for case in tree.iter("testcase"):
                    if case.find("failure") is not None or case.find("error") is not None:
                        classname = case.attrib.get("classname", "")
                        name = case.attrib.get("name", "")
                        module_path = None
                        parts = classname.split(".") if classname else []
                        for end in range(len(parts), 0, -1):
                            candidate = repo.joinpath(*parts[:end]).with_suffix(".py")
                            if candidate.is_file():
                                module_path = candidate.relative_to(repo).as_posix()
                                break
                        if module_path is None:
                            module_path = classname.replace(".", "/")
                            if module_path and not module_path.endswith(".py"):
                                module_path += ".py"
                        failed.append(f"{module_path}::{name}")
            except ET.ParseError:
                pass
        if not failed:
            failed = [item.strip() for item in FAIL_RE.findall(output)]
        return result.returncode, output[-6000:], time.monotonic() - start, sorted(set(failed))
    except subprocess.TimeoutExpired as exc:
        output = ((exc.stdout or "") + "\n" + (exc.stderr or "")).strip()
        return 124, output[-3000:] + "\nTimed out", time.monotonic() - start, []


def run_baseline(root: Path, timeout: int = 90):
    with tempfile.TemporaryDirectory(prefix="terrarium-baseline-") as tmp:
        clone = Path(tmp) / "repo"
        _copy_repo(root, clone)
        code, output, duration, failures = _run_pytest(clone, timeout)
        return code == 0, output, duration, failures


def run_mutations(root: Path, mutations: list[Mutation], predicted_by_mutation: dict[str, list[str]], timeout: int = 90):
    results = []
    for mutation in mutations:
        predicted_tests = predicted_by_mutation.get(mutation.mutation_id, [])
        with tempfile.TemporaryDirectory(prefix=f"terrarium-{mutation.mutation_id.lower()}-") as tmp:
            clone = Path(tmp) / "repo"
            _copy_repo(root, clone)
            target = clone / mutation.file
            target.write_text(mutation.source, encoding="utf-8")
            code, output, duration, failures = _run_pytest(clone, timeout)
            status = "killed" if code != 0 and failures else "survived" if code == 0 else "invalid"
            results.append({
                "mutation_id": mutation.mutation_id,
                "file": mutation.file,
                "function": mutation.function,
                "description": mutation.description,
                "status": status,
                "predicted_tests": list(predicted_tests),
                "failing_tests": failures,
                "duration_seconds": round(duration, 3),
                "error": output if status == "invalid" else None,
            })
    return results
