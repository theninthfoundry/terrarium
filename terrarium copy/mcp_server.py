"""Local-only MCP server for trusted workspaces.

Install: pip install 'mcp>=1.28,<2' (v1 API); run: python -m terrarium.mcp_server
Do not expose this process publicly: analyze_repository executes repository pytest code.
"""
from __future__ import annotations

import os
from pathlib import Path

from .engine import analyze_repository
from .graph import load_graph


def trusted_root() -> Path:
    configured = os.environ.get('TERRARIUM_MCP_WORKSPACE')
    if not configured:
        raise RuntimeError('Set TERRARIUM_MCP_WORKSPACE to an explicitly trusted directory')
    root = Path(configured).expanduser().resolve(strict=True)
    if not root.is_dir():
        raise ValueError('MCP workspace must be a directory')
    return root


def resolve_repo(relative_repo: str) -> Path:
    root = trusted_root()
    if not relative_repo or Path(relative_repo).is_absolute():
        raise ValueError('Use a non-empty relative repository path')
    candidate = (root / relative_repo).resolve(strict=True)
    if not candidate.is_relative_to(root) or not candidate.is_dir():
        raise ValueError('Repository must be inside trusted workspace')
    return candidate


def blast_radius_data(repository: str, symbol: str) -> dict:
    """Static impact only; it is not a validated assurance score."""
    root = resolve_repo(repository)
    graph, nodes, _, source = load_graph(root)
    matched = sorted(nid for nid, n in nodes.items()
                     if nid == symbol or n.qualified_name == symbol)
    if not matched:
        return {'found': False, 'query': symbol, 'graph_source': source,
                'matches': [], 'affected_symbols': [], 'predicted_tests': [],
                'warning': 'Symbol not found. Use a fully qualified graph node id.'}
    if len(matched) > 1:
        return {'found': False, 'query': symbol, 'graph_source': source,
                'matches': matched, 'affected_symbols': [], 'predicted_tests': [],
                'warning': 'Ambiguous symbol, select an exact id.'}
    from .impact import predict_tests
    import networkx as nx
    chosen = matched[0]
    affected = sorted({chosen} | nx.ancestors(graph, chosen))
    predicted, paths = predict_tests(root, graph, nodes, [chosen])
    return {'found': True, 'query': chosen, 'graph_source': source,
            'affected_symbols': affected[:200], 'affected_count': len(affected),
            'predicted_tests': predicted, 'dependency_paths': paths[:40],
            'warning': 'Static prediction only. Run calibrate_change for mutation evidence.'}


def calibrate_change_data(repository: str, changed_file: str, max_mutations: int = 4) -> dict:
    root = resolve_repo(repository)
    if not 1 <= max_mutations <= 6:
        raise ValueError('max_mutations must be between 1 and 6')
    rel = Path(changed_file)
    if rel.is_absolute() or '..' in rel.parts or rel.suffix != '.py':
        raise ValueError('Changed file must be a relative Python file')
    target = (root / rel).resolve(strict=True)
    if not target.is_relative_to(root) or not target.is_file():
        raise ValueError('Changed file must stay inside repository')
    # Calling this tool executes tests: only use with explicitly trusted local repositories.
    report = analyze_repository(root, [rel.as_posix()], max_mutations=max_mutations, timeout=30)
    return report.to_dict()


def serve() -> None:
    # Fail closed before starting an MCP listener.
    trusted_root()
    try:
        from mcp.server.fastmcp import FastMCP
    except ImportError as exc:
        raise RuntimeError("Install 'mcp>=1.28,<2' for the validated v1 API") from exc
    mcp = FastMCP('TERRARIUM evidence tools')

    @mcp.tool()
    def blast_radius(repository: str, symbol: str) -> dict:
        """Query dependency-based blast radius in an explicitly trusted local workspace."""
        return blast_radius_data(repository, symbol)

    @mcp.tool()
    def calibrate_change(repository: str, changed_file: str, max_mutations: int = 4) -> dict:
        """Run bounded mutation-testing evidence on TRUSTED local source only."""
        return calibrate_change_data(repository, changed_file, max_mutations)

    mcp.run(transport='stdio')


if __name__ == '__main__':
    serve()
