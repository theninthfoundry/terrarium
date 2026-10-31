"""Conservative Python call graph; explicit Graphify provenance on accepted edges."""
import ast,json
from pathlib import Path
import networkx as nx
from .models import FunctionNode,DependencyEdge
SKIP={'.git','.venv','venv','node_modules','__pycache__','.pytest_cache','dist','build'}
def iter_py(root):
    for p in root.rglob('*.py'):
        if not (set(p.relative_to(root).parts)&SKIP) and not p.is_symlink(): yield p

def build_ast_graph(root):
    g=nx.DiGraph(); nodes={}; edges=[]; bodies={}; imports={}
    for p in iter_py(root):
        rel=p.relative_to(root).as_posix()
        try: tree=ast.parse(p.read_text(encoding='utf-8'))
        except (OSError,UnicodeError,SyntaxError): continue
        aliases={}
        for item in tree.body:
            if isinstance(item,ast.ImportFrom):
                for alias in item.names: aliases[alias.asname or alias.name]=(item.module or '',alias.name)
            if isinstance(item,ast.Import):
                for alias in item.names: aliases[alias.asname or alias.name]=(alias.name,'')
        imports[rel]=aliases
        def collect(seq,scope=''):
            for item in seq:
                if isinstance(item,(ast.FunctionDef,ast.AsyncFunctionDef,ast.ClassDef)):
                    name=scope+'.'+item.name if scope else item.name
                    if not isinstance(item,ast.ClassDef):
                        ident=f'{rel}::{name}'; node=FunctionNode(ident,item.name,ident,rel,item.lineno,item.name.startswith('test_'))
                        nodes[ident]=node;g.add_node(ident);bodies[ident]=item
                    collect(item.body,name)
        collect(tree.body)
    by_name={}
    for key,n in nodes.items(): by_name.setdefault(n.name,[]).append(key)
    for caller,body in bodies.items():
        rel=nodes[caller].file
        for item in ast.walk(body):
            if not isinstance(item,ast.Call): continue
            target_name=item.func.id if isinstance(item.func,ast.Name) else item.func.attr if isinstance(item.func,ast.Attribute) else None
            if not target_name: continue
            candidates=by_name.get(target_name,[])
            if len(candidates)==1 and candidates[0]!=caller:
                target=candidates[0];g.add_edge(caller,target,provenance='AST_UNIQUE_NAME');edges.append(DependencyEdge(caller,target,'AST_UNIQUE_NAME'))
    return g,nodes,edges

def load_graph(root):
    root=Path(root);g,nodes,edges=build_ast_graph(root)
    graphfile=root/'graphify-out'/'graph.json'
    if not graphfile.is_file(): return g,nodes,edges,'Python AST fallback (Graphify graph not found)'
    try:
        data=json.loads(graphfile.read_text(encoding='utf-8'));raw_nodes=data.get('nodes');raw_edges=data.get('links',data.get('edges'))
        if isinstance(raw_nodes,dict): raw_nodes=[{'id':k,**(v if isinstance(v,dict) else {})} for k,v in raw_nodes.items()]
        if not isinstance(raw_nodes,list) or not isinstance(raw_edges,list): raise ValueError('unsupported node-link data')
        mapping={}
        for node in raw_nodes:
            if not isinstance(node,dict): continue
            filename=str(node.get('source_file',node.get('file',''))).replace('\\','/')
            label=str(node.get('label',node.get('name',''))).split('(')[0].strip()
            choices=[k for k,v in nodes.items() if v.file==filename and (v.name==label or k.endswith('::'+label))]
            if len(choices)==1: mapping[str(node.get('id'))]=choices[0]
        graph=nx.DiGraph();graph.add_nodes_from(nodes);verified=[]
        for edge in raw_edges:
            if not isinstance(edge,dict): continue
            source=mapping.get(str(edge.get('source')));dest=mapping.get(str(edge.get('target')))
            relation=str(edge.get('relation',edge.get('type',''))).lower()
            if source and dest and source!=dest and relation in {'calls','call','function_call'}:
                graph.add_edge(source,dest,provenance='GRAPHIFY');verified.append(DependencyEdge(source,dest,'GRAPHIFY'))
        if not verified: raise ValueError('no compatible verified calls')
        return graph,nodes,verified,'Graphify graph.json'
    except (ValueError,TypeError,OSError,KeyError,json.JSONDecodeError) as ex:
        return g,nodes,edges,f'Python AST fallback (Graphify adapter: {type(ex).__name__})'
