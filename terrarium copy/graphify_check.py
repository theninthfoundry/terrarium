"""Read-only Graphify compatibility diagnostics. Does not claim schema compatibility."""
from __future__ import annotations
import json
from pathlib import Path


def inspect_graphify(root: Path) -> dict:
    source = root.resolve() / 'graphify-out' / 'graph.json'
    if not source.is_file():
        return {'exists': False, 'compatible': False, 'reason': 'graph.json missing', 'path': str(source)}
    if source.stat().st_size > 20 * 1024 * 1024:
        return {'exists': True, 'compatible': False, 'reason': 'Graph exceeds 20 MiB inspection cap'}
    try:
        data = json.loads(source.read_text('utf-8'))
        if not isinstance(data, dict):
            raise ValueError('Root JSON object is not a mapping')
        graph_meta = data.get('graph', {})
        if not isinstance(graph_meta, dict):
            graph_meta = {}
        nodes = data.get('nodes')
        edges = data.get('links', data.get('edges'))
        shape_ok = isinstance(nodes, (list, dict)) and isinstance(edges, list)
        from .graph import load_graph
        _, parsed_nodes, parsed_edges, actual_source = load_graph(root)
        used_graphify = actual_source == 'Graphify graph.json'
        return {'exists': True, 'compatible': bool(shape_ok and used_graphify),
                'schema_version': graph_meta.get('schema_version'),
                'graphify_version': graph_meta.get('graphify_version'),
                'raw_node_count': len(nodes) if isinstance(nodes, (list, dict)) else None,
                'raw_edge_count': len(edges) if isinstance(edges, list) else None,
                'mapped_function_count': len(parsed_nodes), 'mapped_edge_count': len(parsed_edges),
                'graph_source': actual_source,
                'warning': 'An accepted graph is not proof that call-edge semantics were correctly mapped; inspect representative source-to-target paths.'}
    except (OSError, ValueError, TypeError, json.JSONDecodeError) as exc:
        return {'exists': True, 'compatible': False, 'reason': type(exc).__name__ + ': ' + str(exc)[:160]}
