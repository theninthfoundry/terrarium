from pathlib import Path
import pytest
from terrarium.mcp_server import resolve_repo, blast_radius_data, calibrate_change_data
from terrarium.graphify_check import inspect_graphify


def test_mcp_rejects_unset_root(monkeypatch):
    monkeypatch.delenv('TERRARIUM_MCP_WORKSPACE', raising=False)
    with pytest.raises(RuntimeError):
        resolve_repo('sample_repo')


def test_mcp_rejects_traversal(tmp_path, monkeypatch):
    (tmp_path / 'ok').mkdir()
    monkeypatch.setenv('TERRARIUM_MCP_WORKSPACE', str(tmp_path))
    with pytest.raises((ValueError, FileNotFoundError)):
        resolve_repo('../outside')


def test_mcp_rejects_absolute_paths(tmp_path, monkeypatch):
    monkeypatch.setenv('TERRARIUM_MCP_WORKSPACE', str(tmp_path))
    with pytest.raises(ValueError):
        resolve_repo(str(tmp_path))


def test_missing_graphify_is_reported(tmp_path):
    assert inspect_graphify(tmp_path)['compatible'] is False


def test_blast_radius_on_sample(monkeypatch):
    root = Path(__file__).resolve().parents[1]
    monkeypatch.setenv('TERRARIUM_MCP_WORKSPACE', str(root))
    result = blast_radius_data('sample_repo', 'src/pricing.py::apply_discount')
    assert isinstance(result['predicted_tests'], list)
    assert result['graph_source']


def test_calibration_rejects_traversal_before_execution(monkeypatch):
    root = Path(__file__).resolve().parents[1]
    monkeypatch.setenv('TERRARIUM_MCP_WORKSPACE', str(root))
    with pytest.raises(ValueError):
        calibrate_change_data('sample_repo', '../outside.py')
