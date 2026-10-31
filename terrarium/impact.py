from __future__ import annotations

import ast
from pathlib import Path

import networkx as nx

from .models import FunctionNode


def discover_changed_functions(root: Path, changed_files: list[str], nodes: dict[str, FunctionNode]) -> list[str]:
    changed = set(changed_files)
    result = []
    for node_id, node in nodes.items():
        if node.file in changed:
            result.append(node_id)
    return sorted(result)


def _test_calls(root: Path, nodes: dict[str, FunctionNode]) -> dict[str, set[str]]:
    symbol_index: dict[str, list[str]] = {}
    for node_id, node in nodes.items():
        symbol_index.setdefault(node.name, []).append(node_id)
    mapping: dict[str, set[str]] = {}
    for path in root.rglob("test_*.py"):
        if any(p in {".git", ".venv", "__pycache__"} for p in path.parts):
            continue
        rel = path.relative_to(root).as_posix()
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"))
        except (SyntaxError, OSError, UnicodeDecodeError):
            continue
        for fn in (n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and n.name.startswith("test_")):
            test_id = f"{rel}::{fn.name}"
            calls: set[str] = set()
            for child in ast.walk(fn):
                if isinstance(child, ast.Call):
                    symbol = child.func.id if isinstance(child.func, ast.Name) else child.func.attr if isinstance(child.func, ast.Attribute) else None
                    if symbol:
                        candidates = symbol_index.get(symbol, [])
                        if len(candidates) == 1:
                            calls.add(candidates[0])
            mapping[test_id] = calls
    return mapping


def predict_tests(root: Path, graph: nx.DiGraph, nodes: dict[str, FunctionNode], changed_functions: list[str]):
    tests = _test_calls(root, nodes)
    predicted: set[str] = set()
    paths: list[list[str]] = []
    # The graph is caller -> callee. Walk reverse edges to find callers, then
    # include test functions that directly or transitively depend on those nodes.
    for changed in changed_functions:
        impacted = {changed} | nx.ancestors(graph, changed)
        for test_id, calls in tests.items():
            test_nodes = {node_id for node_id, node in nodes.items() if node.file in {test_id.split("::")[0]} and node.name == test_id.split("::")[-1]}
            if calls.intersection(impacted) or test_nodes.intersection(impacted):
                predicted.add(test_id)
                try:
                    path = nx.shortest_path(graph, source=test_id, target=changed)
                    paths.append(path)
                except (nx.NetworkXNoPath, nx.NodeNotFound):
                    candidate = next(iter(calls.intersection(impacted)), changed)
                    paths.append([test_id, candidate, changed])
    return sorted(predicted), paths
