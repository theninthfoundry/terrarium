from __future__ import annotations

import ast
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Mutation:
    mutation_id: str
    file: str
    function: str
    node_id: str
    description: str
    source: str


class _Mutator(ast.NodeTransformer):
    COMPARES = {
        ast.Eq: ast.NotEq, ast.NotEq: ast.Eq,
        ast.Lt: ast.GtE, ast.LtE: ast.Gt,
        ast.Gt: ast.LtE, ast.GtE: ast.Lt,
        ast.Is: ast.IsNot, ast.IsNot: ast.Is,
        ast.In: ast.NotIn, ast.NotIn: ast.In,
    }
    BINOPS = {ast.Add: ast.Sub, ast.Sub: ast.Add, ast.Mult: ast.FloorDiv, ast.FloorDiv: ast.Mult}

    def __init__(self, target_function: str, site_index: int):
        self.target_function = target_function
        self.site_index = site_index
        self.active = False
        self.seen = 0
        self.description: str | None = None

    def visit_FunctionDef(self, node: ast.FunctionDef):
        previous = self.active
        if node.name == self.target_function:
            self.active = True
            node = self.generic_visit(node)
            self.active = previous
            return node
        return node

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        return self.visit_FunctionDef(node)

    def visit_Compare(self, node: ast.Compare):
        if not self.active or self.description:
            return node
        node = self.generic_visit(node)
        for index, op in enumerate(node.ops):
            replacement = self.COMPARES.get(type(op))
            if replacement:
                if self.seen == self.site_index:
                    old = type(op).__name__
                    node.ops[index] = replacement()
                    self.description = f"comparison: {old} → {replacement.__name__}"
                    break
                self.seen += 1
        return node

    def visit_BinOp(self, node: ast.BinOp):
        if not self.active or self.description:
            return node
        node = self.generic_visit(node)
        replacement = self.BINOPS.get(type(node.op))
        if replacement:
            if self.seen == self.site_index:
                old = type(node.op).__name__
                node.op = replacement()
                self.description = f"arithmetic: {old} → {replacement.__name__}"
            else:
                self.seen += 1
        return node


def _eligible_sites(function: ast.FunctionDef | ast.AsyncFunctionDef) -> int:
    count = 0
    for node in ast.walk(function):
        if isinstance(node, ast.Compare):
            count += sum(1 for op in node.ops if type(op) in _Mutator.COMPARES)
        elif isinstance(node, ast.BinOp) and type(node.op) in _Mutator.BINOPS:
            count += 1
    return count


def generate_mutations(root: Path, changed_functions: list[str], nodes: dict, limit: int = 12) -> list[Mutation]:
    mutations: list[Mutation] = []
    for node_id in changed_functions:
        node = nodes[node_id]
        file, function = node.file, node.name
        path = root / file
        if not path.is_file() or path.suffix != ".py":
            continue
        try:
            original = path.read_text(encoding="utf-8")
            original_tree = ast.parse(original)
        except (OSError, SyntaxError, UnicodeDecodeError):
            continue
        target_name = function.split(".")[-1]
        target = next((node for node in ast.walk(original_tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == target_name), None)
        if target is None:
            continue
        for site_index in range(_eligible_sites(target)):
            tree = ast.parse(original)
            mutator = _Mutator(target_name, site_index)
            mutated = mutator.visit(tree)
            if not mutator.description:
                continue
            try:
                source = ast.unparse(ast.fix_missing_locations(mutated)) + "\n"
            except Exception:
                continue
            mutations.append(Mutation(f"M{len(mutations)+1:02d}", file, node.qualified_name, node_id, mutator.description, source))
            if len(mutations) >= limit:
                return mutations
    return mutations
