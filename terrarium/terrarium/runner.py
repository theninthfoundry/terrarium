"""Trusted-local runner, intentionally NOT a sandbox for untrusted code."""
import os,subprocess,sys,tempfile,shutil,time,xml.etree.ElementTree as ET
from pathlib import Path
EXCLUDE={'.git','.venv','venv','node_modules','__pycache__','.pytest_cache','.terrarium','graphify-out','dist','build'}
def _copy_repo(source,dest):
    files=0;size=0
    for path in source.rglob('*'):
        rel=path.relative_to(source)
        if set(rel.parts)&EXCLUDE or any(x=='.env' or x.startswith('.env.') for x in rel.parts):continue
        if path.is_symlink():continue
        if path.is_file():
            files+=1;size+=path.stat().st_size
            if files>20000 or size>100*1024*1024:raise ValueError('Repository exceeds safe local copy limits')
            target=dest/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
def _run(repo,timeout):
    outfile=repo/'.terrarium-results.xml';start=time.monotonic()
    env={'PATH':os.environ.get('PATH',''),'PYTHONDONTWRITEBYTECODE':'1','PYTHONPATH':str(repo),'HOME':str(repo),'TMPDIR':str(repo)}
    if sys.platform=='win32':env['SYSTEMROOT']=os.environ.get('SYSTEMROOT','')
    try:
        result=subprocess.run([sys.executable,'-m','pytest','-q','--tb=no',f'--junitxml={outfile}'],cwd=repo,capture_output=True,text=True,timeout=timeout,env=env)
        failed=[]
        if outfile.is_file():
            try:
                tree=ET.parse(outfile)
                for case in tree.iter('testcase'):
                    if case.find('failure') is not None or case.find('error') is not None:
                        raw=case.attrib.get('name','');cl=case.attrib.get('classname','')
                        module=cl.replace('.','/')+'.py'
                        failed.append(module+'::'+raw)
            except ET.ParseError:pass
        return result.returncode,(result.stdout+'\n'+result.stderr)[-4000:],time.monotonic()-start,sorted(set(failed))
    except subprocess.TimeoutExpired:return 124,'Timeout',time.monotonic()-start,[]
def run_baseline(root,timeout=45):
    with tempfile.TemporaryDirectory(prefix='terrarium-base-') as td:
        clone=Path(td)/'repo';clone.mkdir();_copy_repo(root,clone)
        c,o,d,f=_run(clone,timeout);return c==0,o,d,f
def run_mutations(root,mutations,predicted_by_mutation,timeout=45):
    results=[]
    for m in mutations:
        with tempfile.TemporaryDirectory(prefix='terrarium-mut-') as td:
            clone=Path(td)/'repo';clone.mkdir();_copy_repo(root,clone)
            (clone/m.file).write_text(m.source,encoding='utf-8');c,o,d,failed=_run(clone,timeout)
            status='killed' if c==1 and failed else 'survived' if c==0 else 'invalid' if c==1 else 'infra_error'
            results.append(dict(mutation_id=m.mutation_id,file=m.file,function=m.function,description=m.description,status=status,predicted_tests=predicted_by_mutation.get(m.mutation_id,[]),failing_tests=failed,duration_seconds=round(d,3),error=o if status in {'invalid','infra_error'} else None))
    return results
