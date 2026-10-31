from pathlib import Path
from collections import defaultdict
import hashlib,json,subprocess,sys,datetime,ast
from .models import AnalysisReport,MutationResult
from .graph import load_graph
from .impact import discover_changed_functions,predict_tests
from .mutator import generate_mutations
from .runner import run_baseline,run_mutations
from .explain import explain_with_gemma

def dynamic_risks(root):
    risks=[]
    for p in root.rglob('*.py'):
        if any(s in p.parts for s in ('.venv','__pycache__','.git')):continue
        try:tree=ast.parse(p.read_text(encoding='utf-8'))
        except (OSError,UnicodeError,SyntaxError):continue
        for n in ast.walk(tree):
            if isinstance(n,ast.Call):
                name=n.func.id if isinstance(n.func,ast.Name) else n.func.attr if isinstance(n.func,ast.Attribute) else ''
                if name in {'getattr','setattr','eval','exec','import_module','__import__'}:
                    risks.append({'file':p.relative_to(root).as_posix(),'line':n.lineno,'kind':name})
    return risks[:100]
def analyze_repository(root,changed_files=None,max_mutations=6,timeout=45):
    root=Path(root).resolve(strict=True)
    if changed_files is None:changed_files=[p.relative_to(root).as_posix() for p in root.rglob('*.py') if p.parts and p.name!='__init__.py' and 'tests' not in p.parts][:12]
    changed_files=sorted(set(changed_files))
    for item in changed_files:
        p=Path(item)
        if p.is_absolute() or '..' in p.parts or not (root/p).resolve().is_relative_to(root) or not (root/p).is_file():raise ValueError('Invalid changed-file path')
    graph,nodes,edges,source=load_graph(root)
    changed=discover_changed_functions(root,changed_files,nodes)
    predicted,paths=predict_tests(root,graph,nodes,changed)
    passed,output,_,failures=run_baseline(root,timeout)
    warnings=[]
    if 'fallback' in source: warnings.append('Graphify output not verified; Python AST fallback used')
    if not passed:warnings.append('Baseline failed; mutation measurement withheld')
    mutants=generate_mutations(root,changed,nodes,max_mutations) if passed else []
    predictions={m.mutation_id:predict_tests(root,graph,nodes,[m.node_id])[0] for m in mutants}
    results=[MutationResult(**x) for x in run_mutations(root,mutants,predictions,timeout)]
    killed=[m for m in results if m.status=='killed']
    actual={(m.mutation_id,t) for m in killed for t in m.failing_tests}
    correct=sum(t in m.predicted_tests for m in killed for t in m.failing_tests)
    recall=round(correct/len(actual),4) if actual else None
    missed=sorted({t for m in killed for t in m.failing_tests if t not in m.predicted_tests})
    risks=dynamic_risks(root)
    confidence='low' if len(killed)<10 or risks or missed or 'fallback' in source else 'medium'
    report=AnalysisReport(root.name,source,changed_files,changed,predicted,paths[:40],passed,'Baseline passed' if passed else 'Baseline failed: '+output[-500:],results,recall,len(killed),len(results),missed,warnings=warnings,confidence=confidence,dynamic_risks=risks)
    try: git=subprocess.run(['git','-C',str(root),'rev-parse','HEAD'],capture_output=True,text=True,timeout=3);rev=git.stdout.strip() if git.returncode==0 else None
    except (OSError,subprocess.TimeoutExpired):rev=None
    digest=hashlib.sha256()
    for f in changed_files:digest.update(f.encode());digest.update((root/f).read_bytes())
    report.receipt={'git_revision':rev,'source_fingerprint_sha256':digest.hexdigest(),'python':sys.version.split()[0],'generated_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'measurement':'Mutation-Tested Impact Recall','observed_pairs':len(actual),'predicted_correct_pairs':correct,'missed_pairs':len(actual)-correct,'scope':'sample-specific, not general regression coverage'}
    report.explanation=explain_with_gemma(report.to_dict())
    return report
