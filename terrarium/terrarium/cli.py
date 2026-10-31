import argparse,json
from pathlib import Path
from .engine import analyze_repository
def main():
    parser=argparse.ArgumentParser(prog='terrarium');sub=parser.add_subparsers(dest='cmd',required=True)
    a=sub.add_parser('analyze');a.add_argument('repo');a.add_argument('--changed',action='append');a.add_argument('--max-mutations',type=int,default=6);a.add_argument('--timeout',type=int,default=45)
    args=parser.parse_args()
    report=analyze_repository(Path(args.repo),args.changed,args.max_mutations,args.timeout)
    folder=Path('.terrarium');folder.mkdir(exist_ok=True)
    (folder/'receipt.json').write_text(json.dumps(report.to_dict(),indent=2),encoding='utf-8')
    print(json.dumps({'recall':report.mutation_tested_recall,'confidence':report.confidence,'missed_tests':report.missed_tests,'receipt':str(folder/'receipt.json')},indent=2))
if __name__=='__main__':main()
