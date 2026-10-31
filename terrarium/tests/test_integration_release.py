from pathlib import Path
from fastapi.testclient import TestClient
from terrarium.api import app
from terrarium.engine import analyze_repository
from terrarium.graph import load_graph
from terrarium.mutator import generate_mutations
ROOT=Path(__file__).resolve().parents[1]
def test_public_demo_end_to_end(monkeypatch):
    monkeypatch.setattr('terrarium.api._COOLDOWN_SECONDS',0)
    response=TestClient(app).post('/api/analyze',json={'repository_path':'sample_repo','changed_files':['src/pricing.py'],'max_mutations':4})
    assert response.status_code==200,response.text
    data=response.json()
    assert data['baseline_passed'] and data['valid_mutants']>0
    assert 'tests/test_reflection.py::test_reflection_based_discount_path' in data['missed_tests']
    assert data['receipt']['observed_pairs']>=data['receipt']['predicted_correct_pairs']
def test_evidence_does_not_change_source():
    path=ROOT/'sample_repo/src/pricing.py';before=path.read_bytes()
    report=analyze_repository(ROOT/'sample_repo',['src/pricing.py'],max_mutations=2,timeout=15)
    assert report.baseline_passed and path.read_bytes()==before
def test_full_scope_mutation_two_functions(tmp_path):
    (tmp_path/'src').mkdir()
    p=tmp_path/'src/a.py';p.write_text('def outer():\n    def check():\n        return 1 == 2\n    return check()\ndef other():\n    def check():\n        return 3 == 4\n    return check()\n')
    graph,nodes,_,_=load_graph(tmp_path)
    target=next(k for k in nodes if k.endswith('outer.check'))
    mutations=generate_mutations(tmp_path,[target],nodes,4)
    assert mutations
    assert 'return 1 != 2' in mutations[0].source
    assert 'return 3 == 4' in mutations[0].source
