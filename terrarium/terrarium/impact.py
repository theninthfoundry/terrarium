import ast
from pathlib import Path
import networkx as nx

def discover_changed_functions(root,files,nodes):return sorted(k for k,n in nodes.items() if n.file in set(files))
def predict_tests(root,graph,nodes,changed_functions):
    predicted=set();paths=[]
    for changed in changed_functions:
        if changed not in graph:continue
        affected={changed}|nx.ancestors(graph,changed)
        for tid,n in nodes.items():
            if not n.is_test:continue
            if tid in affected:
                predicted.add(tid)
                try:paths.append(nx.shortest_path(graph,tid,changed))
                except nx.NetworkXNoPath:pass
    return sorted(predicted),paths
