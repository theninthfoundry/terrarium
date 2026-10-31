from __future__ import annotations

import ast
import json
from collections import defaultdict
from pathlib import Path
from typing import Any

import networkx as nx

from .models import DependencyEdge, FunctionNode


SKIP_DIRS = {".git", ".venv", "venv", "node_modules", "__pycache__", ".pytest_cache", "dist", "build"}


def _iter_python_files(root: Path):
    for path in root.rglob("*.py"):
        if any(part in SKIP_DIRS for part in path.relative_to(root).parts):
            continue
        yield path


def _qualified(path: Path, root: Path, name: str) -> str:
    return f"{path.relative_to(root).as_posix()}::{name}"


class _FunctionCollector(ast.NodeVisitor):
    def __init__(self, path: Path, root: Path):
        self.path, self.root = path, root
        self.stack: list[str] = []
        self.nodes: dict[str, FunctionNode] = {}
        self.calls: list[tuple[str, str]] = []
        self.imports: list[tuple[str, str]] = []

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self._visit_function(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        self._visit_function(node)

    def _visit_function(self, node: ast.FunctionDef | ast.AsyncFunctionDef):
        name = ".".join([*self.stack, node.name])
        qn = _qualified(self.path, self.root, name)
        is_test = node.name.startswith("test_") or self.path.name.startswith("test_")
        self.nodes[qn] = FunctionNode(qn, node.name, qn, self.path.relative_to(self.root).as_posix(), node.lineno, is_test)
        self.stack.append(node.name)
        for child in node.body:
            self.visit(child)
        self.stack.pop()

    def visit_Call(self, node: ast.Call):
        if isinstance(node.func, ast.Name):
            self.calls.append((self.path.relative_to(self.root).as_posix(), node.func.id))
        elif isinstance(node.func, ast.Attribute):
            self.calls.append((self.path.relative_to(self.root).as_posix(), node.func.attr))
        self.generic_visit(node)


def _normalise_graphify(data: dict[str, Any], root: Path) -> tuple[nx.DiGraph, dict[str, FunctionNode], list[DependencyEdge]]:
    """Adapt Graphify's NetworkX node-link JSON without losing call direction.

    Graphify writes node-link data (nodes + links; some builds expose edges).
    Nodes are matched back to Python AST symbols using source_file + label/id.
    Only explicit call edges between recognised function nodes are used here.
    """
    raw_nodes = data.get("nodes", [])
    raw_edges = data.get("links", data.get("edges", []))
    if isinstance(raw_nodes, dict):
        raw_nodes = [{"id": key, **(value if isinstance(value, dict) else {"label": str(value)})} for key, value in raw_nodes.items()]
    if not isinstance(raw_nodes, list) or not isinstance(raw_edges, list) or not raw_nodes:
        raise ValueError("Graphify graph.json did not contain supported nodes and links/edges")

    # Ground symbol recognition in the source tree, not in an LLM-generated label.
    symbols_by_file: dict[str, dict[str, tuple[str, int]]] = {}
    for path in _iter_python_files(root):
        rel = path.relative_to(root).as_posix()
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=rel)
        except (SyntaxError, UnicodeDecodeError, OSError):
            continue
        symbols: dict[str, tuple[str, int]] = {}
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                symbols[node.name] = (node.name, node.lineno)
        symbols_by_file[rel] = symbols

    graph = nx.DiGraph()
    nodes: dict[str, FunctionNode] = {}
    for item in raw_nodes:
        if not isinstance(item, dict):
            continue
        node_id = str(item.get("id") or item.get("key") or "")
        if not node_id:
            continue
        label = str(item.get("label") or item.get("name") or node_id).strip()
        file_value = str(item.get("source_file") or item.get("file") or item.get("file_path") or item.get("path") or "")
        if file_value:
            file_path = Path(file_value)
            if file_path.is_absolute():
                try:
                    file_value = file_path.resolve().relative_to(root.resolve()).as_posix()
                except (ValueError, OSError):
                    file_value = file_path.as_posix()
            else:
                file_value = file_path.as_posix()
        file_value = file_value.lstrip("./")
        symbols = symbols_by_file.get(file_value, {})
        node_type = str(item.get("node_type") or item.get("kind") or item.get("type") or "").lower()
        clean_label = label.split("(", 1)[0].split(".")[-1].strip()
        candidate = clean_label if clean_label in symbols else None
        if candidate is None:
            stem = Path(file_value).with_suffix("").as_posix().replace("/", "_") + "_"
            if node_id.startswith(stem):
                suffix = node_id[len(stem):]
                candidate = suffix if suffix in symbols else None
        if candidate is None and any(token in node_type for token in ("function", "method")):
            candidate = next((name for name in symbols if name in label or name in node_id), None)
        if candidate is None:
            continue
        name, source_line = symbols[candidate]
        is_test = name.startswith("test_") or Path(file_value).name.startswith("test_")
        line_value = item.get("line") or item.get("start_line") or item.get("source_location")
        if isinstance(line_value, str):
            digits = "".join(ch for ch in line_value if ch.isdigit())
            line_value = int(digits) if digits else source_line
        nodes[node_id] = FunctionNode(node_id, name, f"{file_value}::{name}", file_value, int(line_value or source_line), is_test)
        graph.add_node(node_id)

    edges: list[DependencyEdge] = []
    for item in raw_edges:
        if not isinstance(item, dict):
            continue
        source = str(item.get("_src") or item.get("source") or item.get("from") or item.get("src") or "")
        target = str(item.get("_tgt") or item.get("target") or item.get("to") or item.get("dst") or "")
        relation = str(item.get("relation") or item.get("type") or item.get("kind") or "calls").lower()
        if source in nodes and target in nodes and relation in {"calls", "call", "invokes"}:
            provenance = str(item.get("confidence") or "GRAPHIFY_EXTRACTED")
            graph.add_edge(source, target, provenance=provenance)
            edges.append(DependencyEdge(source, target, provenance))
    if not nodes:
        raise ValueError("Graphify graph.json had no Python function nodes that could be matched to source files")
    return graph, nodes, edges


def build_ast_graph(root: Path) -> tuple[nx.DiGraph, dict[str, FunctionNode], list[DependencyEdge]]:
    graph = nx.DiGraph()
    nodes: dict[str, FunctionNode] = {}
    by_file: dict[str, list[FunctionNode]] = defaultdict(list)
    file_calls: dict[str, list[str]] = defaultdict(list)
    file_asts: dict[str, ast.Module] = {}

    for path in _iter_python_files(root):
        rel = path.relative_to(root).as_posix()
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=rel)
        except (SyntaxError, UnicodeDecodeError, OSError):
            continue
        file_asts[rel] = tree
        collector = _FunctionCollector(path, root)
        collector.visit(tree)
        nodes.update(collector.nodes)
        by_file[rel].extend(collector.nodes.values())
        file_calls[rel].extend(name for _, name in collector.calls)
        graph.add_nodes_from(collector.nodes)

    # Resolve calls by symbol name. Ambiguous symbols are deliberately not connected.
    symbol_index: dict[str, list[str]] = defaultdict(list)
    for node_id, node in nodes.items():
        symbol_index[node.name].append(node_id)
    edges: list[DependencyEdge] = []
    for file, tree in file_asts.items():
        # Match AST declarations by source line so nested functions retain their
        # qualified identity instead of being flattened to the outer function.
        node_by_line = {item.line: node_id for node_id, item in nodes.items() if item.file == file}
        for node in ast.walk(tree):
            if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            caller = node_by_line.get(node.lineno)
            if caller is None:
                continue
            called_names: set[str] = set()
            for child in ast.walk(node):
                if isinstance(child, ast.Call):
                    if isinstance(child.func, ast.Name):
                        called_names.add(child.func.id)
                    elif isinstance(child.func, ast.Attribute):
                        called_names.add(child.func.attr)
            for symbol in called_names:
                candidates = symbol_index.get(symbol, [])
                if len(candidates) == 1 and candidates[0] != caller:
                    target = candidates[0]
                    graph.add_edge(caller, target, provenance="AST_NAME_RESOLVED")
                    edges.append(DependencyEdge(caller, target, "AST_NAME_RESOLVED"))
    return graph, nodes, edges


def load_graph(root: Path) -> tuple[nx.DiGraph, dict[str, FunctionNode], list[DependencyEdge], str]:
    graph_file = root / "graphify-out" / "graph.json"
    if graph_file.exists():
        try:
            data = json.loads(graph_file.read_text(encoding="utf-8"))
            graph, nodes, edges = _normalise_graphify(data, root)
            return graph, nodes, edges, "Graphify graph.json"
        except (ValueError, json.JSONDecodeError, OSError, TypeError) as exc:
            graph, nodes, edges = build_ast_graph(root)
            return graph, nodes, edges, f"Python AST fallback (Graphify adapter: {exc})"
    graph, nodes, edges = build_ast_graph(root)
    return graph, nodes, edges, "Python AST fallback (Graphify graph not found)"
