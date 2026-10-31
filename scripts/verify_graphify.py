from pathlib import Path
import json
import sys
from terrarium.graphify_check import inspect_graphify

if __name__ == '__main__':
    outcome = inspect_graphify(Path(sys.argv[1] if len(sys.argv) > 1 else '.'))
    print(json.dumps(outcome, indent=2))
    raise SystemExit(0 if outcome.get('compatible') else 1)
