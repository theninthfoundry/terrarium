from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class FunctionNode:
    id: str
    name: str
    qualified_name: str
    file: str
    line: int
    is_test: bool = False


@dataclass
class DependencyEdge:
    source: str
    target: str
    provenance: str = "AST"


@dataclass
class MutationResult:
    mutation_id: str
    file: str
    function: str
    description: str
    status: str
    predicted_tests: list[str] = field(default_factory=list)
    failing_tests: list[str] = field(default_factory=list)
    duration_seconds: float = 0.0
    error: str | None = None


@dataclass
class AnalysisReport:
    repository: str
    graph_source: str
    changed_files: list[str]
    changed_functions: list[str]
    predicted_tests: list[str]
    dependency_paths: list[list[str]]
    baseline_passed: bool
    baseline_summary: str
    mutations: list[MutationResult]
    mutation_tested_recall: float | None
    valid_mutants: int
    total_mutants: int
    missed_tests: list[str]
    explanation: str
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        result = asdict(self)
        result["mutations"] = [asdict(item) for item in self.mutations]
        return result
