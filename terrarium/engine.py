from __future__ import annotations

from pathlib import Path

from .explain import explain_with_gemma
from .graph import load_graph
from .impact import discover_changed_functions, predict_tests
from .models import AnalysisReport, MutationResult
from .mutator import generate_mutations
from .runner import run_baseline, run_mutations


def analyze_repository(root: Path, changed_files: list[str] | None = None, max_mutations: int = 10, timeout: int = 90) -> AnalysisReport:
    root = root.resolve()
    if not root.is_dir():
        raise ValueError(f"Repository path does not exist: {root}")
    if changed_files is None:
        changed_files = [p.relative_to(root).as_posix() for p in root.rglob("*.py") if "test" not in p.parts and not any(x in p.parts for x in (".git", ".venv", "__pycache__"))]
    changed_files = sorted({item.replace("\\", "/").lstrip("/") for item in changed_files})
    for item in changed_files:
        if ".." in Path(item).parts or not (root / item).is_file():
            raise ValueError(f"Changed file is outside the repository or does not exist: {item}")

    graph, nodes, edges, graph_source = load_graph(root)
    changed_node_ids = discover_changed_functions(root, changed_files, nodes)
    changed_functions = [nodes[node_id].qualified_name for node_id in changed_node_ids]
    predicted, paths = predict_tests(root, graph, nodes, changed_node_ids)
    baseline_passed, baseline_output, _, baseline_failures = run_baseline(root, timeout)
    warnings = []
    if "fallback" in graph_source.lower():
        warnings.append("Graphify graph.json was not available; this run used the built-in Python AST graph. Dynamic and cross-language edges may be missing.")
    if not changed_functions:
        warnings.append("No functions were mapped in the changed files. Provide a supported source file and ensure the graph includes function nodes.")
    if not baseline_passed:
        warnings.append("Baseline tests did not pass in a clean copy. Mutation experiments were skipped because the comparison would be unreliable.")
        mutations_data = []
    else:
        generated = generate_mutations(root, changed_node_ids, nodes, limit=max_mutations)
        predicted_by_mutation = {
            mutation.mutation_id: predict_tests(root, graph, nodes, [mutation.node_id])[0]
            for mutation in generated
        }
        mutations_data = run_mutations(root, generated, predicted_by_mutation, timeout)

    mutation_results = [MutationResult(**item) for item in mutations_data]
    killed = [item for item in mutation_results if item.status == "killed"]
    actual_pairs = {(test, item.mutation_id) for item in killed for test in item.failing_tests}
    predicted_pairs = {(test, item.mutation_id) for item in killed for test in item.predicted_tests}
    recall = (len(actual_pairs & predicted_pairs) / len(actual_pairs)) if actual_pairs else None
    missed = sorted({test for item in killed for test in item.failing_tests if test not in item.predicted_tests})
    report = AnalysisReport(
        repository=root.name,
        graph_source=graph_source,
        changed_files=changed_files,
        changed_functions=changed_functions,
        predicted_tests=predicted,
        dependency_paths=paths[:40],
        baseline_passed=baseline_passed,
        baseline_summary="Baseline passed" if baseline_passed else ("Baseline failed: " + "; ".join(baseline_failures[:5]) if baseline_failures else baseline_output[-500:]),
        mutations=mutation_results,
        mutation_tested_recall=round(recall, 4) if recall is not None else None,
        valid_mutants=len(killed),
        total_mutants=len(mutation_results),
        missed_tests=missed,
        explanation="",
        warnings=warnings,
    )
    report.explanation = explain_with_gemma(report.to_dict())
    return report
