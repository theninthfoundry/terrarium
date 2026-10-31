from pathlib import Path

from terrarium.engine import analyze_repository
from terrarium.graph import load_graph

ROOT = Path(__file__).resolve().parents[1]


def test_sample_experiment_finds_a_real_blind_spot():
    report = analyze_repository(ROOT / "sample_repo", ["src/pricing.py"], max_mutations=6, timeout=30)
    assert report.baseline_passed
    assert report.valid_mutants >= 2
    assert report.mutation_tested_recall is not None
    assert 0 <= report.mutation_tested_recall <= 1
    assert "tests/test_reflection.py::test_reflection_based_discount_path" in report.missed_tests


def test_graphify_node_link_adapter_preserves_call_edges(tmp_path):
    source = tmp_path / "src"
    source.mkdir()
    (source / "logic.py").write_text(
        "def inner(x):\n    return x * 2\n\ndef outer(x):\n    return inner(x)\n",
        encoding="utf-8",
    )
    graph_dir = tmp_path / "graphify-out"
    graph_dir.mkdir()
    graph = {
        "directed": False,
        "nodes": [
            {"id": "src_logic_inner", "label": "inner()", "file_type": "code", "source_file": "src/logic.py"},
            {"id": "src_logic_outer", "label": "outer()", "file_type": "code", "source_file": "src/logic.py"},
        ],
        "links": [
            {"source": "src_logic_outer", "target": "src_logic_inner", "relation": "calls", "confidence": "EXTRACTED"}
        ],
    }
    import json
    (graph_dir / "graph.json").write_text(json.dumps(graph), encoding="utf-8")
    import networkx as nx
    loaded, nodes, edges, source_name = load_graph(tmp_path)
    assert source_name == "Graphify graph.json"
    assert isinstance(loaded, nx.DiGraph)
    assert loaded.has_edge("src_logic_outer", "src_logic_inner")
    assert nodes["src_logic_inner"].name == "inner"
    assert edges[0].provenance == "EXTRACTED"


def test_mutations_never_modify_original_repository():
    source = ROOT / "sample_repo" / "src" / "pricing.py"
    before = source.read_bytes()
    analyze_repository(ROOT / "sample_repo", ["src/pricing.py"], max_mutations=2, timeout=30)
    assert source.read_bytes() == before


def test_failed_baseline_skips_mutation_scoring(tmp_path):
    (tmp_path / "src").mkdir()
    (tmp_path / "tests").mkdir()
    (tmp_path / "src" / "logic.py").write_text("def calculate(x):\n    return x * 2\n", encoding="utf-8")
    (tmp_path / "tests" / "test_logic.py").write_text(
        "from src.logic import calculate\n\ndef test_known_failure():\n    assert calculate(2) == 99\n",
        encoding="utf-8",
    )
    report = analyze_repository(tmp_path, ["src/logic.py"], max_mutations=2, timeout=30)
    assert not report.baseline_passed
    assert report.total_mutants == 0
    assert report.mutation_tested_recall is None
