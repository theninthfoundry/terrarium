import ast,hashlib
from pathlib import Path
from dataclasses import dataclass
@dataclass
class Mutation:
    mutation_id:str
    file:str
    function:str
    node_id:str
    description:str
    source:str
    source_hash:str=''
COMPARE={ast.Eq:ast.NotEq,ast.NotEq:ast.Eq,ast.Lt:ast.GtE,ast.LtE:ast.Gt,ast.Gt:ast.LtE,ast.GtE:ast.Lt,ast.Is:ast.IsNot,ast.IsNot:ast.Is,ast.In:ast.NotIn,ast.NotIn:ast.In}
BINARY={ast.Add:ast.Sub,ast.Sub:ast.Add,ast.Mult:ast.FloorDiv,ast.FloorDiv:ast.Mult}
class Mutator(ast.NodeTransformer):
    def __init__(self,scope,site):self.scope=scope;self.site=site;self.stack=[];self.seen=0;self.description=None
    def visit_ClassDef(self,n):
        self.stack.append(n.name);self.generic_visit(n);self.stack.pop();return n
    def visit_FunctionDef(self,n):
        self.stack.append(n.name);self.generic_visit(n);self.stack.pop();return n
    visit_AsyncFunctionDef=visit_FunctionDef
    def visit_Compare(self,n):
        if '.'.join(self.stack)==self.scope and self.description is None:
            for i,op in enumerate(n.ops):
                new=COMPARE.get(type(op))
                if new:
                    if self.seen==self.site:n.ops[i]=new();self.description=f'{type(op).__name__} -> {new.__name__}';break
                    self.seen+=1
        return self.generic_visit(n)
    def visit_BinOp(self,n):
        if '.'.join(self.stack)==self.scope and self.description is None:
            new=BINARY.get(type(n.op))
            if new:
                if self.seen==self.site:self.description=f'{type(n.op).__name__} -> {new.__name__}';n.op=new()
                else:self.seen+=1
        return self.generic_visit(n)

def generate_mutations(root,changed_functions,nodes,limit=12):
    result=[]
    for ident in changed_functions:
        node=nodes[ident];file=node.file
        try:original=(root/file).read_text(encoding='utf-8');ast.parse(original)
        except (SyntaxError,OSError,UnicodeError):continue
        scope=ident.split('::',1)[1]
        for site in range(100):
            tree=ast.parse(original);mutator=Mutator(scope,site);mutated=mutator.visit(tree)
            if not mutator.description:break
            rendered=ast.unparse(ast.fix_missing_locations(mutated))+'\n'
            result.append(Mutation(f'M{len(result)+1:02}',file,ident,ident,mutator.description,rendered,hashlib.sha256(original.encode()).hexdigest()))
            if len(result)>=limit:return result
    return result
